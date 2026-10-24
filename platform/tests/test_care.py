"""Synthetic completion/replay/correction and rollback integration scenarios."""

import json
from unittest.mock import patch

from django.test import TestCase
from shelter import core
import asm3.i18n
import asm3.medical
import asm3.stock
import asm3.utils

from shelter.care import (
    KINDS,
    add_versions,
    check_access,
    record_care,
    record_mobile_care,
    snapshot,
)
from shelter.transactions import native_transaction
from tests import test_platform as baseline


class CareWorkflowTests(TestCase):
    setUp = baseline.PlatformTests.setUp
    animal = baseline.PlatformTests.animal

    def fixture(self, kind="medical"):
        aid = self.animal()
        date = asm3.i18n.python2display("en_GB", self.dbo.today())
        data = {
            "animal": str(aid),
            "required": date,
            "startdate": date,
            "type": "1",
            "result": "0",
            "treatmentname": "Synthetic fixture only",
            "dosage": "Synthetic text only; no dose",
            "singlemulti": "0",
            "treatmentrule": "0",
            "status": "0",
        }
        if kind == "medical":
            regimen = asm3.medical.insert_regimen_from_form(
                self.dbo, "synthetic-clinician", asm3.utils.PostedData(data, "en_GB")
            )
            rid = self.dbo.query_int(
                "SELECT ID FROM animalmedicaltreatment WHERE AnimalMedicalID = ?",
                [regimen],
            )
        else:
            create = (
                asm3.medical.insert_vaccination_from_form
                if kind == "vaccination"
                else asm3.medical.insert_test_from_form
            )
            rid = create(
                self.dbo, "synthetic-clinician", asm3.utils.PostedData(data, "en_GB")
            )
        stock = asm3.stock.insert_stocklevel_from_form(
            self.dbo,
            asm3.utils.PostedData(
                {
                    "name": "Synthetic supply fixture",
                    "unitname": "synthetic units",
                    "balance": "10",
                    "total": "10",
                    "usagedate": date,
                    "usagetype": "1",
                    "location": "1",
                },
                "en_GB",
            ),
            "synthetic-stock",
        )
        result = self.dbo.query_int("SELECT ID FROM testresult ORDER BY ID LIMIT 1")
        payload = {
            "ids": str(rid),
            KINDS[kind][2]: date,
            "givenby": "Synthetic carer",
            "item": str(stock),
            "quantity": "2",
            "usagetype": "1",
            "treatmentcomments": "Synthetic administration",
            "testresult": str(result),
        }
        return rid, stock, payload

    def give(self, payload, kind="medical", actor="synthetic-carer", **kwargs):
        return record_care(
            self.dbo, actor, asm3.utils.PostedData(payload, "en_GB"), kind, **kwargs
        )

    def row(self, kind, rid):
        return self.dbo.first_row(
            self.dbo.query(f"SELECT * FROM {KINDS[kind][0]} WHERE ID = ?", [rid])
        )

    def correction(self, kind, rid, payload, action="correct"):
        return {
            **payload,
            "recordaction": action,
            "correctionreason": "Synthetic correction reason",
            "item": "-1",
            "recordversions": json.dumps(
                {str(rid): snapshot(self.dbo, KINDS[kind][0], self.row(kind, rid))}
            ),
        }

    def test_repeated_completion_cannot_deduct_stock_twice(self):
        for kind in KINDS:
            with self.subTest(kind=kind):
                rid, stock, payload = self.fixture(kind)
                before = self.dbo.query_int(
                    "SELECT COUNT(*) FROM stockusage WHERE StockLevelID = ?", [stock]
                )
                self.give(payload, kind)
                with self.assertRaises(asm3.utils.ASMValidationError):
                    self.give(payload, kind)
                self.assertEqual(
                    self.dbo.query_float(
                        "SELECT Balance FROM stocklevel WHERE ID = ?", [stock]
                    ),
                    8,
                )
                self.assertEqual(
                    self.dbo.query_int(
                        "SELECT COUNT(*) FROM stockusage WHERE StockLevelID = ?",
                        [stock],
                    ),
                    before + 1,
                )
                self.assertIsNotNone(self.row(kind, rid)[KINDS[kind][1].upper()])

    def test_stock_failure_rolls_back_care_balance_and_audit(self):
        for kind in KINDS:
            with self.subTest(kind=kind):
                rid, stock, payload = self.fixture(kind)
                original = dict(self.row(kind, rid))
                audit = self.dbo.query_int("SELECT COUNT(*) FROM audittrail")
                usages = self.dbo.query_int("SELECT COUNT(*) FROM stockusage")
                with patch(
                    "asm3.stock.insert_stockusage",
                    side_effect=RuntimeError("Synthetic interrupted stock write"),
                ):
                    with self.assertRaises(RuntimeError):
                        self.give(payload, kind)
                self.assertEqual(dict(self.row(kind, rid)), original)
                self.assertEqual(
                    self.dbo.query_float(
                        "SELECT Balance FROM stocklevel WHERE ID = ?", [stock]
                    ),
                    10,
                )
                self.assertEqual(
                    self.dbo.query_int("SELECT COUNT(*) FROM audittrail"), audit
                )
                self.assertEqual(
                    self.dbo.query_int("SELECT COUNT(*) FROM stockusage"), usages
                )

    def test_mid_batch_failure_rolls_back_earlier_treatment(self):
        first, _, payload = self.fixture()
        second, _, _ = self.fixture()
        payload.update(ids=f"{first},{second}", item="-1")
        original = asm3.medical.update_treatment_given

        def fail_second(db, actor, rid, *args):
            if rid == second:
                raise RuntimeError("Synthetic interrupted batch")
            return original(db, actor, rid, *args)

        with patch("asm3.medical.update_treatment_given", side_effect=fail_second):
            with self.assertRaises(RuntimeError):
                self.give(payload)
        self.assertIsNone(self.row("medical", first).DATEGIVEN)
        self.assertIsNone(self.row("medical", second).DATEGIVEN)

    def test_invalid_stock_is_rejected_before_care_changes(self):
        rid, stock, payload = self.fixture()
        for quantity in ("0", "-1", "nan", "inf", "11", "bad"):
            with self.subTest(quantity=quantity):
                with self.assertRaises(asm3.utils.ASMValidationError):
                    self.give({**payload, "quantity": quantity})
                self.assertIsNone(self.row("medical", rid).DATEGIVEN)
        with self.assertRaises(asm3.utils.ASMValidationError):
            self.give({**payload, "item": "999999"})
        self.assertEqual(
            self.dbo.query_float(
                "SELECT Balance FROM stocklevel WHERE ID = ?", [stock]
            ),
            10,
        )

    def test_mixed_or_invalid_selection_has_no_partial_changes(self):
        first, _, payload = self.fixture()
        second, _, _ = self.fixture()
        self.give({**payload, "item": "-1"})
        for ids in (
            f"{first},{second}",
            f"{second},{second}",
            f"{second},999999",
            "",
            "bad",
            "0",
            "99999999999",
            "1" * 5000,
        ):
            with self.subTest(ids=ids):
                with self.assertRaises(asm3.utils.ASMValidationError):
                    self.give({**payload, "ids": ids, "item": "-1"})
                self.assertIsNone(self.row("medical", second).DATEGIVEN)

    def test_correction_requires_reason_snapshot_and_no_stock(self):
        for kind in KINDS:
            with self.subTest(kind=kind):
                rid, stock, payload = self.fixture(kind)
                self.give(payload, kind)
                correction = self.correction(kind, rid, payload)
                for change in (
                    {"correctionreason": ""},
                    {"recordversions": "{}"},
                    {"item": str(stock)},
                ):
                    with self.assertRaises(asm3.utils.ASMValidationError):
                        self.give({**correction, **change}, kind)
                self.give(correction, kind, actor="synthetic-reviewer")
                self.assertIn(
                    "Synthetic correction reason", self.row(kind, rid).COMMENTS
                )
                with self.assertRaises(asm3.utils.ASMValidationError):
                    self.give(correction, kind)  # stale/replayed correction
                self.assertEqual(
                    self.dbo.query_float(
                        "SELECT Balance FROM stocklevel WHERE ID = ?", [stock]
                    ),
                    8,
                )
                audit = self.dbo.query(
                    "SELECT * FROM audittrail WHERE TableName = ? AND LinkID = ?",
                    [KINDS[kind][0], rid],
                )
                self.assertTrue(
                    any(
                        r.USERNAME == "synthetic-reviewer"
                        and "Synthetic correction reason" in str(r)
                        for r in audit
                    )
                )

    def test_clear_erroneous_completion_preserves_actor_and_stock_history(self):
        rid, stock, payload = self.fixture()
        self.give(payload)
        undo = self.correction("medical", rid, payload, "undo")
        with self.assertRaises(asm3.utils.ASMValidationError):
            self.give({**undo, "correctionreason": ""})
        self.give(undo, actor="synthetic-reviewer")
        row = self.row("medical", rid)
        self.assertIsNone(row.DATEGIVEN)
        task = self.dbo.first_row(
            self.dbo.query(
                "SELECT * FROM diary WHERE LinkID = ? AND Subject = ?",
                [row.ANIMALID, "Review care plan after completion correction"],
            )
        )
        self.assertIsNotNone(task)
        self.assertEqual(task.DIARYFORNAME, "synthetic-reviewer")
        self.assertIsNone(task.DATECOMPLETED)
        self.assertEqual(row.GIVENBY, "Synthetic carer")
        self.assertIn("Synthetic administration", row.COMMENTS)
        self.assertIn("Synthetic correction reason", row.COMMENTS)
        self.assertEqual(
            self.dbo.query_float(
                "SELECT Balance FROM stocklevel WHERE ID = ?", [stock]
            ),
            8,
        )
        audit = self.dbo.query(
            "SELECT * FROM audittrail WHERE TableName = 'animalmedicaltreatment' AND LinkID = ?",
            [rid],
        )
        self.assertTrue(any(r.USERNAME == "synthetic-carer" for r in audit))
        self.assertTrue(any(r.USERNAME == "synthetic-reviewer" for r in audit))

    def test_snapshot_annotations_match_locked_canonical_record(self):
        for kind in KINDS:
            rid, _, payload = self.fixture(kind)
            rows = [{"TREATMENTID" if kind == "medical" else "ID": rid}]
            add_versions(self.dbo, rows, kind)
            self.assertEqual(
                rows[0]["CAREVERSION"],
                snapshot(self.dbo, KINDS[kind][0], self.row(kind, rid)),
            )
            self.give(payload, kind)
            self.assertNotEqual(
                rows[0]["CAREVERSION"],
                snapshot(self.dbo, KINDS[kind][0], self.row(kind, rid)),
            )

    def test_mobile_completion_cannot_overwrite_existing_care(self):
        for kind in KINDS:
            rid, _, payload = self.fixture(kind)
            data = asm3.utils.PostedData(
                {"id": str(rid), "resultid": payload["testresult"]}, "en_GB"
            )
            record_mobile_care(self.dbo, "synthetic-mobile", data, kind)
            original = dict(self.row(kind, rid))
            with self.assertRaises(asm3.utils.ASMValidationError):
                record_mobile_care(self.dbo, "synthetic-mobile", data, kind)
            self.assertEqual(dict(self.row(kind, rid)), original)

    def test_invalid_dates_and_correction_followup_are_rejected(self):
        for kind in KINDS:
            rid, _, payload = self.fixture(kind)
            for invalid in ("", "bad", "01/01/2100"):
                with self.assertRaises(asm3.utils.ASMValidationError):
                    self.give({**payload, KINDS[kind][2]: invalid}, kind)
            if kind == "medical":
                with self.assertRaises(asm3.utils.ASMValidationError):
                    self.give({**payload, "newtime": "25:99"}, kind)
            self.give(payload, kind)
            if kind != "medical":
                field = "rescheduledate" if kind == "vaccination" else "retestdate"
                with self.assertRaises(asm3.utils.ASMValidationError):
                    self.give(
                        {**self.correction(kind, rid, payload), field: "01/01/2100"},
                        kind,
                    )

    def test_native_transaction_does_not_change_session_connection(self):
        original = self.dbo.connection
        with self.assertRaises(RuntimeError):
            with native_transaction(self.dbo) as db:
                self.assertIsNot(db, self.dbo)
                db.execute("UPDATE configuration SET ItemValue = ItemValue")
                raise RuntimeError("Synthetic rollback")
        self.assertIs(self.dbo.connection, original)

    def test_swallowed_native_sql_failure_cannot_commit_later_writes(self):
        rid, _, _ = self.fixture()
        with self.assertRaises(RuntimeError):
            with native_transaction(self.dbo) as db:
                try:
                    db.execute("UPDATE synthetic_missing_table SET value=1")
                except Exception:
                    pass
                db.execute(
                    "UPDATE animalmedicaltreatment SET Comments = ? WHERE ID = ?",
                    ["Must roll back", rid],
                )
        self.assertNotEqual(self.row("medical", rid).COMMENTS, "Must roll back")

    def test_linked_animal_boundary_precedes_care_changes(self):
        for kind in KINDS:
            rid, stock, payload = self.fixture(kind)
            denied = asm3.utils.ASMPermissionError(
                "Synthetic animal outside assigned access"
            )
            with self.assertRaises(asm3.utils.ASMPermissionError):
                check_access(
                    self.dbo,
                    asm3.utils.PostedData(payload, "en_GB"),
                    kind,
                    lambda animal: (_ for _ in ()).throw(denied),
                )
            self.assertIsNone(self.row(kind, rid)[KINDS[kind][1].upper()])
            self.assertEqual(
                self.dbo.query_float(
                    "SELECT Balance FROM stocklevel WHERE ID = ?", [stock]
                ),
                10,
            )

    def test_veterinary_template_has_reviewed_completion_permissions(self):
        from shelter.roles import ROLES

        self.assertIn(asm3.users.BULK_COMPLETE_MEDICAL, ROLES["Veterinary team"])
        self.assertIn(asm3.users.BULK_COMPLETE_VACCINATION, ROLES["Veterinary team"])

    def test_native_seconds_time_is_preserved_in_completion_and_correction(self):
        rid, _, payload = self.fixture()
        payload.update(
            newdate=asm3.i18n.python2display(
                "en_GB", asm3.i18n.add_days(self.dbo.today(), -1)
            ),
            newtime="00:00:31",
            item="-1",
        )
        self.give(payload)
        self.assertEqual(self.row("medical", rid).DATEGIVEN.second, 31)
        correction = self.correction("medical", rid, payload)
        correction["newtime"] = "00:00:32"
        self.give(correction)
        self.assertEqual(self.row("medical", rid).DATEGIVEN.second, 32)

    def test_clear_review_task_failure_rolls_back_correction(self):
        rid, _, payload = self.fixture()
        self.give({**payload, "item": "-1"})
        original = dict(self.row("medical", rid))
        undo = self.correction("medical", rid, payload, "undo")
        with patch(
            "asm3.diary.insert_diary_from_form",
            side_effect=RuntimeError("Synthetic task write failure"),
        ):
            with self.assertRaises(RuntimeError):
                self.give(undo)
        self.assertEqual(dict(self.row("medical", rid)), original)
