"""Reviewed completion/correction workflows over canonical clinical records."""

import hashlib
import hmac
import json
import math
import os
import re

import asm3.i18n
import asm3.animal
import asm3.diary
import asm3.medical
import asm3.stock
import asm3.utils

from .transactions import native_transaction

KINDS = {
    "medical": ("animalmedicaltreatment", "DateGiven", "newdate"),
    "vaccination": ("animalvaccination", "DateOfVaccination", "givennewdate"),
    "test": ("animaltest", "DateOfTest", "newdate"),
}


def reject(message):
    raise asm3.utils.ASMValidationError(message)


def selected_ids(post):
    raw = post["ids"].split(",")
    if (
        not raw
        or len(raw) > 1000
        or any(not re.fullmatch(r"[1-9][0-9]{0,9}", v) for v in raw)
    ):
        reject("Select valid care records (at most 1000 per action)")
    ids = [int(v) for v in raw]
    if any(record_id > 2147483647 for record_id in ids):
        reject("Select valid care records")
    if len(set(ids)) != len(ids):
        reject("A care record may be selected only once")
    return sorted(ids)


def check_access(dbo, post, kind, check_animal, mobile=False):
    data = asm3.utils.PostedData({"ids": post["id"]}, dbo.locale) if mobile else post
    for record_id in selected_ids(data):
        row = dbo.first_row(
            dbo.query(
                f"SELECT AnimalID FROM {KINDS[kind][0]} WHERE ID = ?", [record_id]
            )
        )
        animal = asm3.animal.get_animal(dbo, row.ANIMALID) if row else None
        if animal is None:
            reject("A selected care record needs a valid linked animal")
        check_animal(animal)


def lock_row(db, table, record_id):
    # Table names are internal constants, never request data.
    suffix = " FOR UPDATE" if db.dbtype == "POSTGRESQL" else ""
    return db.first_row(
        db.query(f"SELECT * FROM {table} WHERE ID = ?" + suffix, [record_id])
    )


def snapshot(db, table, row, audit_id=None):
    if audit_id is None:
        audit_id = db.query_int(
            "SELECT COUNT(*) FROM audittrail WHERE TableName = ? AND LinkID = ?",
            [table, row.ID],
        )
    value = json.dumps([table, dict(row), audit_id or 0], sort_keys=True, default=str)
    return hmac.new(
        os.environ["SECRET_KEY"].encode(), value.encode(), hashlib.sha256
    ).hexdigest()


def add_versions(dbo, rows, kind):
    """Attach opaque snapshots without exposing additional clinical fields."""
    table = KINDS[kind][0]
    key = "TREATMENTID" if kind == "medical" else "ID"
    selected = sorted({row[key] for row in rows if row.get(key)})
    versions = {}
    for offset in range(0, len(selected), 400):
        chunk = selected[offset : offset + 400]
        placeholders = ",".join("?" for _ in chunk)
        canonical = dbo.query(
            f"SELECT c.*, (SELECT COUNT(*) FROM audittrail a WHERE a.TableName = ? AND a.LinkID = c.ID) AS TW_AUDIT_REV "
            f"FROM {table} c WHERE c.ID IN ({placeholders})",
            [table, *chunk],
        )
        for row in canonical:
            audit_id = row.pop("TW_AUDIT_REV")
            versions[row.ID] = snapshot(dbo, table, row, audit_id or 0)
    for row in rows:
        row["CAREVERSION"] = versions.get(row.get(key), "")


def check_stock(db, post, action):
    item = post.integer("item") if post["item"] else -1
    if action != "record" and item != -1:
        reject("Corrections cannot deduct stock; reconcile inventory separately")
    if item == -1:
        return False
    quantity = post.floating("quantity")
    stock = lock_row(db, "stocklevel", item)
    if not stock or not math.isfinite(quantity) or quantity <= 0:
        reject("Select available stock and a positive finite quantity")
    balance = asm3.utils.cfloat(stock.BALANCE)
    if not math.isfinite(balance) or quantity > balance:
        reject("The selected stock does not have enough available quantity")
    if not db.query_int(
        "SELECT COUNT(*) FROM stockusagetype WHERE ID = ?", [post.integer("usagetype")]
    ):
        reject("Select a valid stock usage type")
    return True


def record_care(dbo, username, post, kind="medical", undo=False):
    table, date_column, date_field = KINDS[kind]
    ids = selected_ids(post)
    action = "undo" if undo else (post["recordaction"] or "record")
    if action not in ("record", "correct", "undo") or (
        action == "undo" and kind != "medical"
    ):
        reject("Select a valid care action")
    if action != "record" and len(ids) != 1:
        reject("Correct one care record at a time so its history can be reviewed")
    reason = post["correctionreason"].strip()
    if action != "record" and not 1 <= len(reason) <= 2000:
        reject("A correction reason is required (at most 2000 characters)")
    date = None if action == "undo" else post.date(date_field)
    if action != "undo" and (date is None or date > dbo.today()):
        reject("Enter a valid completed care date that is not in the future")
    if kind == "medical" and action != "undo" and post["newtime"]:
        if not re.fullmatch(
            r"(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?", post["newtime"]
        ):
            reject("Enter a valid time in HH:MM or HH:MM:SS format")
        date = asm3.i18n.parse_time(date, post["newtime"])
        if date > dbo.now():
            reject("Completed care cannot have a future time")
    reschedule_field = "rescheduledate" if kind == "vaccination" else "retestdate"
    reschedule = post.date(reschedule_field) if kind != "medical" else None
    if kind != "medical" and post[reschedule_field] and reschedule is None:
        reject("Enter a valid follow-up date")
    if reschedule and (action != "record" or reschedule < date):
        reject(
            "A follow-up must follow this completion and cannot be created by a correction"
        )
    with native_transaction(dbo) as db:
        rows = [lock_row(db, table, record_id) for record_id in ids]
        if any(row is None for row in rows):
            reject("A selected care record no longer exists; reload before continuing")
        completed = [row[date_column.upper()] is not None for row in rows]
        if action == "record" and any(completed):
            reject(
                "Care is already recorded for a selected item; reload and use an explicit correction if needed"
            )
        if action != "record" and not all(completed):
            reject("Corrections require completed records; reload before continuing")
        if action != "record":
            try:
                versions = json.loads(post["recordversions"])
                valid = isinstance(versions, dict) and all(
                    isinstance(versions.get(str(row.ID)), str)
                    and hmac.compare_digest(
                        versions[str(row.ID)], snapshot(db, table, row)
                    )
                    for row in rows
                )
            except (TypeError, ValueError):
                valid = False
            if not valid:
                reject(
                    "A care record changed or its snapshot is missing; reload and review before correcting"
                )
        deduct = check_stock(db, post, action)
        vet = post.integer("givenvet")
        if vet and not db.query_int(
            "SELECT COUNT(*) FROM owner WHERE ID = ? AND IsVet = 1", [vet]
        ):
            reject("Select a recorded veterinarian")
        if kind == "test" and not db.query_int(
            "SELECT COUNT(*) FROM testresult WHERE ID = ?", [post.integer("testresult")]
        ):
            reject("Select a valid test result")
        for row in rows:
            if kind == "medical":
                comments = (
                    post["treatmentcomments"]
                    if action != "undo"
                    else (row.COMMENTS or "")
                )
                by = post["givenby"] or username
                if action == "undo":
                    by, vet = row.GIVENBY or "", row.ADMINISTERINGVETID or 0
                if action != "record":
                    comments += "\nCorrection reason: " + reason
                asm3.medical.update_treatment_given(
                    db, username, row.ID, date, by, vet, comments
                )
                if action == "undo":
                    # A factual correction is not authority to restart a plan.
                    # Create a visible owner task; never send immediate email.
                    asm3.diary.insert_diary_from_form(
                        db,
                        username,
                        0,
                        row.ANIMALID,
                        asm3.utils.PostedData(
                            {
                                "diarydate": asm3.i18n.python2display(
                                    db.locale, db.today()
                                ),
                                "diarytime": db.now().strftime("%H:%M:%S"),
                                "diaryfor": username,
                                "subject": "Review care plan after completion correction",
                                "note": f"Erroneous completion cleared for treatment {row.ID}. Review regimen status and reconcile stock against physical usage before further action. This task does not authorise treatment.",
                                "comments": reason,
                                "emailnow": "",
                            },
                            db.locale,
                        ),
                    )
            elif kind == "vaccination":
                for field in ("givenexpires", "givenbatchexpiry"):
                    if post[field] and post.date(field) is None:
                        reject("Enter valid vaccination expiry dates")
                asm3.medical.complete_vaccination(
                    db,
                    username,
                    row.ID,
                    date,
                    post["givenby"] or username,
                    vet,
                    post.date("givenexpires"),
                    post["givenbatch"],
                    post.date("givenbatchexpiry"),
                    post["givenmanufacturer"],
                    post.integer("givencost"),
                    post["givenrabiestag"],
                )
                if reschedule:
                    asm3.medical.reschedule_vaccination(
                        db, username, row.ID, reschedule, post["reschedulecomments"]
                    )
            else:
                asm3.medical.complete_test(
                    db,
                    username,
                    row.ID,
                    date,
                    post.integer("testresult"),
                    vet,
                    post.integer("givencost"),
                )
                if reschedule:
                    asm3.medical.reschedule_test(
                        db, username, row.ID, reschedule, post["usagecomments"]
                    )
            if kind != "medical" and action == "correct":
                db.update(
                    table,
                    row.ID,
                    {
                        "Comments": (row.COMMENTS or "")
                        + "\nCorrection reason: "
                        + reason
                    },
                    username,
                )
        if deduct:
            clean = dict(post.data)
            clean["usagedate"] = asm3.i18n.python2display(db.locale, date)
            asm3.stock.deduct_stocklevel_from_form(
                db, username, asm3.utils.PostedData(clean, db.locale)
            )


def record_mobile_care(dbo, username, post, kind="medical"):
    date_field = KINDS[kind][2]
    record_care(
        dbo,
        username,
        asm3.utils.PostedData(
            {
                "ids": post["id"],
                date_field: asm3.i18n.python2display(dbo.locale, dbo.today()),
                "givenby": username,
                "item": "-1",
                "testresult": post["resultid"],
            },
            dbo.locale,
        ),
        kind,
    )
