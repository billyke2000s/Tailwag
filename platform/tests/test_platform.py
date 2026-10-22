import base64, io, os, shutil, uuid
from unittest.mock import patch
from django.test import TestCase, Client
from shelter import core
from shelter.models import Receipt
import asm3.cachemem, asm3.configuration, asm3.animal, asm3.person, asm3.media, asm3.users, asm3.utils
from PIL import Image


class PlatformTests(TestCase):
    def setUp(self):
        shutil.copyfile(os.environ["TEST_CORE_BACKUP"], core.database().database)
        asm3.cachemem.dict_client = {}
        self.dbo = core.database()
        asm3.configuration.invalidate_config_cache(self.dbo)

    def token(self, kind="contact"):
        response = self.client.get("/apply/" + kind + "/")
        self.assertEqual(response.status_code, 200)
        return response.context["token"]

    def payload(self, token):
        return {
            "submission": token,
            "first_name": "Synthetic",
            "last_name": "Applicant",
            "email": "synthetic@example.invalid",
            "message": "Synthetic integration test only",
            "privacy": "on",
            "website": "",
        }

    def animal(self, **flags):
        data = {
            "animalname": "Synthetic resident",
            "animaltype": "1",
            "species": "1",
            "entryreason": "1",
            "estimatedage": "2",
            "dateofbirth": "01/01/2022",
            "datebroughtin": "01/01/2025",
            "breed1": "1",
            "breed2": "1",
            "basecolour": "1",
            "neutered": "on",
            "microchipped": "on",
            "microchipnumber": str(uuid.uuid4().int)[:15],
        }
        aid, _ = asm3.animal.insert_animal_from_form(
            self.dbo, asm3.utils.PostedData(data, "en_GB"), "synthetic-test"
        )
        out = io.BytesIO()
        Image.new("RGB", (80, 80), "#7c9c85").save(out, "JPEG")
        mid = asm3.media.attach_file_from_form(
            self.dbo,
            "synthetic-test",
            0,
            aid,
            1,
            asm3.utils.PostedData(
                {
                    "filename": "synthetic.jpg",
                    "filetype": "image/jpeg",
                    "filedata": "data:image/jpeg;base64,"
                    + base64.b64encode(out.getvalue()).decode(),
                },
                "en_GB",
            ),
        )
        self.dbo.update(
            "media",
            mid,
            {
                "WebsitePhoto": 1,
                "ExcludeFromPublish": 0,
                "MediaNotes": "Approved public description",
            },
        )
        self.dbo.update(
            "animal",
            aid,
            {
                "Neutered": 1,
                "Identichipped": 1,
                "AnimalComments": "PRIVATE INTERNAL TEXT",
                "IsNotAvailableForAdoption": 0,
                **flags,
            },
        )
        return aid

    def person(self, capacity=1, assessed=True):
        pid = asm3.person.insert_person_from_form(
            self.dbo,
            asm3.utils.PostedData(
                {"surname": "Synthetic Foster", "forenames": "Test"}, "en_GB"
            ),
            "test",
            geocode=False,
        )
        self.dbo.update(
            "owner",
            pid,
            {"IDCheck": int(assessed), "FosterCapacity": capacity, "IsFosterer": 1},
        )
        return pid

    def foster(self, aid, pid):
        return asm3.movement.insert_foster_from_form(
            self.dbo,
            "test",
            asm3.utils.PostedData(
                {"animal": str(aid), "person": str(pid), "fosterdate": "01/10/2026"},
                "en_GB",
            ),
        )

    def test_pages_and_headers(self):
        for url in (
            "/",
            "/about/",
            "/adoption/",
            "/fostering/",
            "/volunteering/",
            "/help/",
            "/visiting/",
            "/faq/",
            "/privacy/",
            "/accessibility/",
        ):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200, url)
            self.assertIn("script-src 'none'", response["Content-Security-Policy"])
            self.assertEqual(response["Cache-Control"], "no-store")

    def test_enquiries_persist_in_real_staff_inbox(self):
        for kind in ("contact", "adopt", "foster", "volunteer"):
            response = self.client.post(
                "/apply/" + kind + "/", self.payload(self.token(kind))
            )
            self.assertEqual(response.status_code, 200)
            receipt = Receipt.objects.get(kind=kind)
            self.assertEqual(receipt.state, "sent")
            self.assertEqual(
                self.dbo.query_string(
                    "SELECT Value FROM onlineformincoming WHERE CollationID = ? AND FieldName = 'reference'",
                    [receipt.core_id],
                ),
                str(receipt.id),
            )
            self.assertTrue(
                self.dbo.query(
                    "SELECT CollationID FROM onlineformincoming WHERE CollationID = ?",
                    [receipt.core_id],
                )
            )

    def test_repeat_token_does_not_duplicate(self):
        data = self.payload(self.token())
        self.client.post("/apply/contact/", data)
        count = self.dbo.query_int("SELECT COUNT(*) FROM onlineformincoming")
        self.client.post("/apply/contact/", data)
        self.assertEqual(Receipt.objects.count(), 1)
        self.assertEqual(
            count, self.dbo.query_int("SELECT COUNT(*) FROM onlineformincoming")
        )

    def test_invalid_form_preserves_input(self):
        data = self.payload(self.token())
        data["email"] = "invalid"
        response = self.client.post("/apply/contact/", data)
        self.assertContains(response, "Synthetic")
        self.assertFalse(Receipt.objects.exists())

    def test_csrf_enforced(self):
        self.assertEqual(
            Client(enforce_csrf_checks=True)
            .post("/apply/contact/", self.payload(str(uuid.uuid4())))
            .status_code,
            403,
        )

    def test_forged_token_rejected(self):
        self.assertEqual(
            self.client.post(
                "/apply/contact/", self.payload(str(uuid.uuid4()))
            ).status_code,
            400,
        )

    def test_honeypot(self):
        data = self.payload(self.token())
        data["website"] = "spam"
        self.client.post("/apply/contact/", data)
        self.assertFalse(Receipt.objects.exists())

    def test_uncertain_write_not_retried(self):
        data = self.payload(self.token())
        with patch("shelter.core.submit", side_effect=RuntimeError()) as submit:
            self.assertEqual(self.client.post("/apply/contact/", data).status_code, 503)
            self.client.post("/apply/contact/", data)
            self.assertEqual(submit.call_count, 1)
        self.assertEqual(Receipt.objects.get().state, "review")

    def test_rate_limit(self):
        for _ in range(8):
            self.assertEqual(
                self.client.post(
                    "/apply/contact/", self.payload(self.token())
                ).status_code,
                200,
            )
        self.assertEqual(
            self.client.post("/apply/contact/", self.payload(self.token())).status_code,
            429,
        )

    def test_approved_projection(self):
        aid = self.animal()
        rows = core.animals()
        self.assertEqual([a["id"] for a in rows], [aid])
        self.assertEqual(
            set(rows[0]),
            {"id", "name", "species", "breed", "age", "sex", "description"},
        )
        response = self.client.get(f"/animals/{aid}/")
        self.assertContains(response, "Approved public description")
        self.assertNotContains(response, "PRIVATE INTERNAL TEXT")
        self.assertEqual(self.client.get(f"/animals/{aid}/photo/").status_code, 200)

    def test_private_statuses_and_guessed_ids(self):
        for flag in (
            "IsNotAvailableForAdoption",
            "IsHold",
            "IsQuarantine",
            "HasPermanentFoster",
            "HasActiveReserve",
        ):
            aid = self.animal(**{flag: 1})
            self.assertNotIn(aid, [a["id"] for a in core.animals()])
            self.assertEqual(self.client.get(f"/animals/{aid}/").status_code, 404)
            self.assertEqual(self.client.get(f"/animals/{aid}/photo/").status_code, 404)

    def test_comments_publishing_refused(self):
        asm3.configuration.cset(self.dbo, "PublisherUseComments", "Yes")
        with self.assertRaises(RuntimeError):
            core.animals()
        self.assertEqual(self.client.get("/animals/").status_code, 503)

    def test_hidden_application_refused(self):
        aid = self.animal(IsNotAvailableForAdoption=1)
        self.assertEqual(
            self.client.get("/apply/adopt/", {"animal": aid}).status_code, 404
        )

    def test_outage_is_not_empty_list(self):
        with patch("shelter.core.animals", side_effect=RuntimeError()):
            self.assertContains(
                self.client.get("/animals/"), "couldn’t load", status_code=503
            )

    def test_default_accounts(self):
        self.assertIsNone(asm3.users.authenticate(self.dbo, "user", "letmein"))
        self.assertEqual(
            self.dbo.query_int(
                "SELECT DisableLogin FROM users WHERE UserName = ?", ["guest"]
            ),
            1,
        )

    def test_unsafe_uploads(self):
        for content, mime in (
            (b'<svg onload="alert(1)"></svg>', "image/svg+xml"),
            (b"<script>test</script>", "text/html"),
            (b"%PDF-1.7 test", "application/pdf"),
        ):
            with self.assertRaises(asm3.utils.ASMValidationError):
                asm3.media.attach_file_from_form(
                    self.dbo,
                    "test",
                    0,
                    1,
                    1,
                    asm3.utils.PostedData(
                        {
                            "filedata": "data:"
                            + mime
                            + ";base64,"
                            + base64.b64encode(content).decode()
                        },
                        "en_GB",
                    ),
                )

    def test_sanctuary_adoption_before_mutation(self):
        aid = self.animal(IsNotAvailableForAdoption=1)
        with self.assertRaises(asm3.utils.ASMValidationError):
            asm3.movement.insert_adoption_from_form(
                self.dbo,
                "test",
                asm3.utils.PostedData(
                    {"animal": str(aid), "movementdate": "01/10/2026"}, "en_GB"
                ),
            )
        self.assertEqual(
            self.dbo.query_int(
                "SELECT IsNotAvailableForAdoption FROM animal WHERE ID = ?", [aid]
            ),
            1,
        )

    def test_logs_no_private_content(self):
        with self.assertLogs("care.events", level="ERROR") as logs:
            import asm3.al

            asm3.al.error(
                "private-email@example.invalid password-secret",
                "submission.test",
                self.dbo,
            )
        self.assertNotIn("password-secret", "".join(logs.output))
        self.assertNotIn("private-email", "".join(logs.output))

    def test_health(self):
        self.assertEqual(self.client.get("/health/").json(), {"status": "ok"})
        with patch("shelter.core.database", side_effect=RuntimeError()):
            self.assertEqual(self.client.get("/health/").status_code, 503)

    def test_sqlite_restore(self):
        import sqlite3, tempfile

        aid = self.animal()
        with tempfile.TemporaryDirectory() as folder:
            source = sqlite3.connect(self.dbo.database)
            backup = sqlite3.connect(folder + "/backup.sqlite3")
            source.backup(backup)
            self.dbo.execute("DELETE FROM animal WHERE ID = ?", [aid])
            backup.backup(source)
            source.close()
            backup.close()
        self.assertEqual(
            self.dbo.query_int("SELECT COUNT(*) FROM animal WHERE ID = ?", [aid]), 1
        )

    def test_foster_capacity_return_and_identity(self):
        first = self.animal()
        second = self.animal()
        pid = self.person()
        mid = self.foster(first, pid)
        with self.assertRaises(asm3.utils.ASMValidationError):
            self.foster(second, pid)
        self.assertEqual(
            self.dbo.query_int(
                "SELECT COUNT(*) FROM adoption WHERE AnimalID = ?", [second]
            ),
            0,
        )
        asm3.movement.return_movement(self.dbo, mid, "test", first, self.dbo.today())
        self.foster(second, pid)
        self.assertEqual(self.dbo.query_int("SELECT COUNT(*) FROM animal"), 2)

    def test_unassessed_household(self):
        aid = self.animal()
        pid = self.person(assessed=False)
        with self.assertRaises(asm3.utils.ASMValidationError):
            self.foster(aid, pid)
        self.assertEqual(self.dbo.query_int("SELECT COUNT(*) FROM adoption"), 0)

    def test_active_foster_cannot_silently_return(self):
        aid = self.animal()
        first = self.person()
        second = self.person()
        mid = self.foster(aid, first)
        with self.assertRaises(asm3.utils.ASMValidationError):
            self.foster(aid, second)
        self.assertIsNone(
            self.dbo.query_date("SELECT ReturnDate FROM adoption WHERE ID = ?", [mid])
        )

    def test_role_templates(self):
        from shelter.roles import ROLES, security_map

        permissions = security_map(ROLES["Volunteer"])
        self.assertTrue(
            asm3.users.check_permission_map_bool(0, permissions, asm3.users.VIEW_ANIMAL)
        )
        for perm in (
            asm3.users.VIEW_PERSON,
            asm3.users.ADD_MOVEMENT,
            asm3.users.ADD_USER,
            asm3.users.USE_SQL_INTERFACE,
            asm3.users.EXPORT_PEOPLE_CSV,
        ):
            self.assertFalse(asm3.users.check_permission_map_bool(0, permissions, perm))

    def test_totp_leading_zero_enrolment(self):
        with patch("asm3.utils.totp", return_value=12345):
            asm3.users.update_user_settings(
                self.dbo, "care-admin", twofavalidcode="012345"
            )
        self.assertEqual(
            self.dbo.query_int(
                "SELECT EnableTOTP FROM users WHERE UserName = 'care-admin'"
            ),
            1,
        )

    def test_adoption_and_transfer_do_not_silently_end_foster(self):
        aid = self.animal()
        pid = self.person()
        mid = self.foster(aid, pid)
        for fn, datefield in [
            (asm3.movement.insert_adoption_from_form, "movementdate"),
            (asm3.movement.insert_transfer_from_form, "transferdate"),
        ]:
            with self.assertRaises(asm3.utils.ASMValidationError):
                fn(
                    self.dbo,
                    "test",
                    asm3.utils.PostedData(
                        {
                            "animal": str(aid),
                            "person": str(pid),
                            datefield: "02/10/2026",
                        },
                        "en_GB",
                    ),
                )
            self.assertIsNone(
                self.dbo.query_date(
                    "SELECT ReturnDate FROM adoption WHERE ID = ?", [mid]
                )
            )
        self.assertEqual(self.dbo.query_int("SELECT COUNT(*) FROM adoption"), 1)

    def test_modern_hash_and_legacy_upgrade(self):
        password = "A synthetic unique passphrase for tests!"
        self.assertTrue(asm3.users.hash_password(password).startswith("pbkdf2:sha256:"))
        import hashlib
        from asm3.pbkdf2.pbkdf23 import pbkdf2

        legacy_hash = pbkdf2(
            hashlib.sha1, password.encode(), b"synthetic-salt", 100, 24
        ).hex()
        legacy = "pbkdf2:sha1:synthetic-salt:100:" + legacy_hash
        self.assertTrue(
            asm3.users.verify_password(
                password, asm3.users.hash_password(password, "md5")
            )
        )
        self.dbo.execute("UPDATE users SET Password = ? WHERE ID = 1", [legacy])
        user = asm3.users.authenticate(self.dbo, "care-admin", password)
        self.assertIsNotNone(user)
        self.assertTrue(user["PASSWORD"].startswith("pbkdf2:sha256:"))
        self.assertTrue(asm3.users.verify_password(password, user["PASSWORD"]))

    def test_password_policy_on_creation_change_and_reset(self):
        for password in ["short", "12345678901234567890", "password123456"]:
            with self.assertRaises(asm3.utils.ASMValidationError):
                asm3.users.insert_user_from_form(
                    self.dbo,
                    "test",
                    asm3.utils.PostedData(
                        {"username": "weak-user", "password": password}, "en_GB"
                    ),
                )
            with self.assertRaises(asm3.utils.ASMValidationError):
                asm3.users.reset_password(self.dbo, 1, password)
            with self.assertRaises(asm3.utils.ASMValidationError):
                asm3.users.change_password(self.dbo, "care-admin", "unused", password)
        self.assertEqual(
            self.dbo.query_int(
                "SELECT COUNT(*) FROM users WHERE UserName = 'weak-user'"
            ),
            0,
        )

    def test_session_stamp_tracks_privileges_and_disabled_accounts(self):
        from shelter.accounts import credential_stamp

        original = credential_stamp(self.dbo, "care-admin")
        self.assertTrue(original)
        role = self.dbo.query_int("SELECT ID FROM role WHERE RoleName = 'Finance'")
        self.dbo.insert("userrole", {"UserID": 1, "RoleID": role}, generateID=False)
        assigned = credential_stamp(self.dbo, "care-admin")
        self.assertNotEqual(original, assigned)
        self.dbo.execute("UPDATE role SET SecurityMap = ? WHERE ID = ?", ["", role])
        self.assertNotEqual(assigned, credential_stamp(self.dbo, "care-admin"))
        self.dbo.execute("UPDATE users SET LocationFilter = '1' WHERE ID = 1")
        filtered = credential_stamp(self.dbo, "care-admin")
        self.assertNotEqual(assigned, filtered)
        self.dbo.execute("UPDATE users SET DisableLogin = 1 WHERE ID = 1")
        self.assertEqual(credential_stamp(self.dbo, "care-admin"), "")
        self.assertEqual(credential_stamp(self.dbo, "nonexistent"), "")

    def test_finance_role_cannot_view_sensitive_foster_report(self):
        from types import SimpleNamespace
        import asm3.reports

        role = self.dbo.query_int("SELECT ID FROM role WHERE RoleName = 'Finance'")
        asm3.users.insert_user_from_form(
            self.dbo,
            "test",
            asm3.utils.PostedData(
                {
                    "username": "synthetic-finance",
                    "password": "A unique synthetic finance passphrase!",
                    "roles": str(role),
                },
                "en_GB",
            ),
        )
        report = self.dbo.query_int(
            "SELECT ID FROM customreport WHERE Title = 'Active Fosters'"
        )
        self.assertGreater(report, 0)
        session = SimpleNamespace(
            locale="en_GB", dbo=self.dbo, superuser=0, user="synthetic-finance"
        )
        with self.assertRaises(asm3.utils.ASMPermissionError):
            asm3.reports.check_view_permission(session, report)
