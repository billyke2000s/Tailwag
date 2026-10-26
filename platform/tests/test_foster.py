"""Synthetic current-placement, canonical receipt and real WSGI boundary checks."""

from http.cookies import SimpleCookie
from io import BytesIO
import os
import re
from unittest.mock import patch
from urllib.parse import urlencode
import uuid
from wsgiref.util import setup_testing_defaults

from django.test import TestCase
from shelter import core, foster
from shelter.extensions import migrate
import asm3.configuration
import asm3.diary
import asm3.i18n
import asm3.users
import asm3.utils
from tests import test_platform as baseline


class FosterTests(TestCase):
    setUp = baseline.PlatformTests.setUp
    animal = baseline.PlatformTests.animal
    person = baseline.PlatformTests.person
    foster = baseline.PlatformTests.foster

    def fixture(self, enabled=True, name="synthetic-carer"):
        person = self.person(capacity=4)
        aid = self.animal(AnimalName="Assigned synthetic animal")
        movement = self.foster(aid, person)
        rid = asm3.configuration.cint(self.dbo, foster.ROLE_KEY)
        password = "Synthetic-foster-fixture-passphrase"
        uid = asm3.users.insert_user_from_form(
            self.dbo,
            "synthetic-admin",
            asm3.utils.PostedData(
                {
                    "username": name,
                    "password": password,
                    "realname": "Synthetic carer",
                    "person": str(person),
                    "roles": str(rid),
                },
                "en_GB",
            ),
        )
        self.dbo.update(
            "users", uid, {"EnableTOTP": int(enabled), "OTPSecret": "JBSWY3DPEHPK3PXP"}
        )
        return aid, person, uid, movement, password

    def task(self, aid, username="synthetic-carer", **changes):
        fields = {
            "diarydate": asm3.i18n.python2display("en_GB", self.dbo.today()),
            "subject": "Synthetic assigned care instruction",
            "note": "Instruction shared by staff",
            "comments": "PRIVATE STAFF COMMENTS",
            "diaryfor": username,
            **changes,
        }
        return asm3.diary.insert_diary_from_form(
            self.dbo,
            "synthetic-admin",
            asm3.diary.ANIMAL,
            aid,
            asm3.utils.PostedData(fields, "en_GB"),
        )

    def test_migration_and_role_install_are_repeatable_without_assigning_users(self):
        before = self.dbo.query_int("SELECT COUNT(*) FROM role")
        for _ in range(2):
            migrate(self.dbo)
            foster.install(self.dbo)
        self.assertEqual(
            self.dbo.query_int("SELECT COUNT(*) FROM tw_extension_migration"), 2
        )
        self.assertEqual(self.dbo.query_int("SELECT COUNT(*) FROM role"), before)
        rid = asm3.configuration.cint(self.dbo, foster.ROLE_KEY)
        self.assertFalse(
            self.dbo.query_string("SELECT SecurityMap FROM role WHERE ID = ?", [rid])
        )
        self.assertEqual(
            self.dbo.query_int("SELECT COUNT(*) FROM userrole WHERE RoleID = ?", [rid]),
            0,
        )

    def test_projection_is_household_only_and_rechecks_return_future_and_death(self):
        aid, person, uid, movement, _ = self.fixture()
        other = self.animal()
        self.foster(other, self.person())
        user = foster.identity(self.dbo, "synthetic-carer")
        self.assertEqual([r.ID for r in foster.animals(self.dbo, user)], [aid])
        self.assertEqual(
            set(foster.animals(self.dbo, user)[0]),
            {"ID", "ANIMALNAME", "SHELTERCODE", "SPECIESNAME", "HASPHOTO"},
        )
        for values in (
            {"ReturnDate": self.dbo.today()},
            {
                "ReturnDate": None,
                "MovementDate": asm3.i18n.add_days(self.dbo.today(), 1),
            },
        ):
            self.dbo.update("adoption", movement, values)
            self.assertEqual(foster.animals(self.dbo, user), [])
            with self.assertRaises(asm3.utils.ASMPermissionError):
                foster.require_animal(self.dbo, user, aid)
        self.dbo.update("adoption", movement, {"MovementDate": self.dbo.today()})
        self.dbo.update("animal", aid, {"DeceasedDate": self.dbo.today()})
        self.assertEqual(foster.animals(self.dbo, user), [])

    def test_observation_has_canonical_history_review_task_and_idempotent_receipt(self):
        aid, _, uid, _, _ = self.fixture()
        token = str(uuid.uuid4())
        with patch(
            "asm3.utils.send_email", side_effect=AssertionError("No immediate email")
        ):
            first = foster.act(
                self.dbo,
                "synthetic-carer",
                aid,
                token,
                "observation",
                "Synthetic appetite observation",
            )
            self.assertEqual(
                foster.act(
                    self.dbo,
                    "synthetic-carer",
                    aid,
                    token,
                    "observation",
                    "Synthetic appetite observation",
                ),
                first,
            )
        log = self.dbo.first_row(
            self.dbo.query("SELECT * FROM log WHERE ID = ?", [first[0]])
        )
        diary = self.dbo.first_row(
            self.dbo.query("SELECT * FROM diary WHERE ID = ?", [first[1]])
        )
        self.assertEqual(
            (log.LINKTYPE, log.LINKID, log.CREATEDBY), (0, aid, "synthetic-carer")
        )
        self.assertEqual(diary.DIARYFORNAME, "care-admin")
        self.assertIn(str(log.ID), diary.NOTE)
        self.assertEqual(
            self.dbo.query_int("SELECT COUNT(*) FROM tw_action_receipt"), 1
        )
        with self.assertRaises(asm3.utils.ASMValidationError):
            foster.act(
                self.dbo,
                "synthetic-carer",
                aid,
                token,
                "observation",
                "Changed payload must fail",
            )
        user = foster.identity(self.dbo, "synthetic-carer")
        self.assertIsNone(foster.observations(self.dbo, user, aid)[0].DATECOMPLETED)
        self.dbo.update(
            "diary", diary.ID, {"DateCompleted": self.dbo.now()}, "care-admin"
        )
        self.assertIsNotNone(foster.observations(self.dbo, user, aid)[0].DATECOMPLETED)

    def test_review_or_receipt_failure_rolls_back_log_diary_and_audit(self):
        aid, *_ = self.fixture()
        before = [
            self.dbo.query_int(f"SELECT COUNT(*) FROM {table}")
            for table in ("log", "diary", "audittrail", "tw_action_receipt")
        ]
        with patch(
            "asm3.diary.insert_diary_from_form",
            side_effect=RuntimeError("Synthetic write failure"),
        ):
            with self.assertRaises(RuntimeError):
                foster.act(
                    self.dbo,
                    "synthetic-carer",
                    aid,
                    str(uuid.uuid4()),
                    "observation",
                    "Synthetic rollback observation",
                )
        self.assertEqual(
            before,
            [
                self.dbo.query_int(f"SELECT COUNT(*) FROM {table}")
                for table in ("log", "diary", "audittrail", "tw_action_receipt")
            ],
        )

    def test_missing_reviewer_validation_and_staff_account_are_fail_closed(self):
        aid, *_ = self.fixture()
        asm3.configuration.cset(self.dbo, "TailWagFosterReviewUser", "unconfigured")
        for token, kind, text in (
            (str(uuid.uuid4()), "observation", "Valid synthetic observation"),
            ("bad-token", "observation", "Valid synthetic observation"),
            (str(uuid.uuid4()), "observation", "x"),
            (str(uuid.uuid4()), "unknown", "x"),
        ):
            with self.assertRaises(asm3.utils.ASMValidationError):
                foster.act(self.dbo, "synthetic-carer", aid, token, kind, text)
        self.assertEqual(
            self.dbo.query_int("SELECT COUNT(*) FROM tw_action_receipt"), 0
        )
        with self.assertRaises(asm3.utils.ASMPermissionError):
            foster.act(
                self.dbo,
                "care-admin",
                aid,
                str(uuid.uuid4()),
                "observation",
                "Valid synthetic observation",
            )

    def test_only_own_assigned_diary_is_projected_and_can_be_completed(self):
        aid, *_ = self.fixture()
        task = self.task(aid)
        hidden = self.task(aid, "care-admin")
        user = foster.identity(self.dbo, "synthetic-carer")
        self.assertEqual([r.ID for r in foster.tasks(self.dbo, user, aid)], [task])
        self.assertNotIn("COMMENTS", foster.tasks(self.dbo, user, aid)[0])
        token = str(uuid.uuid4())
        version = foster.task_version(user, foster.tasks(self.dbo, user, aid)[0])
        self.assertEqual(
            foster.act(
                self.dbo,
                user.USERNAME,
                aid,
                token,
                "task",
                task_id=task,
                version=version,
            ),
            (task, 0),
        )
        self.assertEqual(
            foster.act(
                self.dbo,
                user.USERNAME,
                aid,
                token,
                "task",
                task_id=task,
                version=version,
            ),
            (task, 0),
        )
        for task_id in (task, hidden):
            with self.assertRaises(asm3.utils.ASMValidationError):
                foster.act(
                    self.dbo,
                    user.USERNAME,
                    aid,
                    str(uuid.uuid4()),
                    "task",
                    task_id=task_id,
                )
        self.assertEqual(
            self.dbo.query_string(
                "SELECT LastChangedBy FROM diary WHERE ID = ?", [task]
            ),
            user.USERNAME,
        )

    def test_return_or_household_change_blocks_all_read_and_write_projections(self):
        aid, _, uid, movement, _ = self.fixture()
        self.task(aid)
        self.dbo.update("adoption", movement, {"ReturnDate": self.dbo.today()})
        user = foster.identity(self.dbo, "synthetic-carer")
        for fn in (foster.require_animal, foster.tasks, foster.observations):
            with self.assertRaises(asm3.utils.ASMPermissionError):
                fn(self.dbo, user, aid)
        with self.assertRaises(asm3.utils.ASMPermissionError):
            foster.act(
                self.dbo,
                user.USERNAME,
                aid,
                str(uuid.uuid4()),
                "observation",
                "Synthetic observation after return",
            )

    def test_conflicting_active_movement_fails_closed(self):
        aid, person, _, movement, _ = self.fixture()
        self.dbo.insert(
            "adoption",
            {
                "AnimalID": aid,
                "OwnerID": person,
                "MovementType": 1,
                "MovementDate": self.dbo.today(),
            },
            "synthetic-import",
        )
        user = foster.identity(self.dbo, "synthetic-carer")
        self.assertEqual(foster.animals(self.dbo, user), [])

    def test_changed_task_instructions_require_a_fresh_review(self):
        aid, *_ = self.fixture()
        task = self.task(aid)
        user = foster.identity(self.dbo, "synthetic-carer")
        version = foster.task_version(user, foster.tasks(self.dbo, user, aid)[0])
        self.dbo.update(
            "diary", task, {"Note": "Revised synthetic instructions"}, "care-admin"
        )
        with self.assertRaises(asm3.utils.ASMValidationError):
            foster.act(
                self.dbo,
                user.USERNAME,
                aid,
                str(uuid.uuid4()),
                "task",
                task_id=task,
                version=version,
            )
        self.assertIsNone(
            self.dbo.query("SELECT DateCompleted FROM diary WHERE ID = ?", [task])[
                0
            ].DATECOMPLETED
        )

    def test_receipt_write_failure_rolls_back_both_canonical_records(self):
        from asm3.dbms.sqlite import DatabaseSQLite3

        aid, *_ = self.fixture()
        before = [
            self.dbo.query_int(f"SELECT COUNT(*) FROM {table}")
            for table in ("log", "diary", "audittrail")
        ]
        original = DatabaseSQLite3.execute

        def fail_receipt(db, sql, *args, **kwargs):
            if sql.startswith("INSERT INTO tw_action_receipt"):
                raise RuntimeError("Synthetic receipt failure")
            return original(db, sql, *args, **kwargs)

        with patch.object(DatabaseSQLite3, "execute", fail_receipt):
            with self.assertRaises(RuntimeError):
                foster.act(
                    self.dbo,
                    "synthetic-carer",
                    aid,
                    str(uuid.uuid4()),
                    "observation",
                    "Synthetic uncertain-response guard",
                )
        self.assertEqual(
            before,
            [
                self.dbo.query_int(f"SELECT COUNT(*) FROM {table}")
                for table in ("log", "diary", "audittrail")
            ],
        )

    def test_simultaneous_submission_commits_only_one_observation_and_review_task(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier

        aid, *_ = self.fixture()
        token = str(uuid.uuid4())
        barrier = Barrier(2)

        def submit(_):
            barrier.wait()
            return foster.act(
                core.database(),
                "synthetic-carer",
                aid,
                token,
                "observation",
                "Synthetic concurrent observation",
            )

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(submit, range(2)))
        self.assertEqual(results[0], results[1])
        self.assertEqual(
            self.dbo.query_int("SELECT COUNT(*) FROM tw_action_receipt"), 1
        )

    def test_real_wsgi_observation_text_is_escaped_and_replay_reconciles(self):
        aid, *_, password = self.fixture()
        with patch.dict(os.environ, {"FOSTER_PORTAL_ENABLED": "true"}):
            self.login(password)
            detail = self.request(f"/foster/animal/{aid}")
            token = re.search(r'name="token" value="([^"]+)"', detail["body"])[1]
            values = {
                "csrf": self.csrf(detail),
                "action": "observation",
                "token": token,
                "text": '<img src=x onerror="alert(1)"> Synthetic literal text',
            }
            for _ in range(2):
                self.assertEqual(
                    self.request(f"/foster/animal/{aid}", values)["status"], 303
                )
            detail = self.request(f"/foster/animal/{aid}")
            self.assertNotIn("<img src=x onerror=", detail["body"])
            self.assertIn("&lt;img src=x onerror=", detail["body"])
            self.assertIn(
                "default-src 'none'", detail["headers"]["Content-Security-Policy"]
            )
            self.assertEqual(
                self.dbo.query_int("SELECT COUNT(*) FROM tw_action_receipt"), 1
            )

    def test_mixed_roles_superuser_missing_household_and_role_permission_changes_fail_closed(
        self,
    ):
        _, _, uid, _, _ = self.fixture()
        for values in ({"SuperUser": 1}, {"DisableLogin": 1}, {"OwnerID": 0}):
            self.dbo.update("users", uid, values)
            with self.assertRaises(asm3.utils.ASMPermissionError):
                foster.identity(self.dbo, "synthetic-carer")
            self.dbo.update(
                "users",
                uid,
                {"SuperUser": 0, "DisableLogin": 0, "OwnerID": self.person()},
            )
        rid = asm3.configuration.cint(self.dbo, foster.ROLE_KEY)
        self.dbo.update("role", rid, {"SecurityMap": "va *"})
        with self.assertRaises(asm3.utils.ASMPermissionError):
            foster.identity(self.dbo, "synthetic-carer")
        self.dbo.update("role", rid, {"SecurityMap": ""})
        staff_role = self.dbo.query_int(
            "SELECT ID FROM role WHERE RoleName = 'Care team'"
        )
        self.dbo.insert(
            "userrole", {"UserID": uid, "RoleID": staff_role}, generateID=False
        )
        with self.assertRaises(asm3.utils.ASMPermissionError):
            foster.identity(self.dbo, "synthetic-carer")

    def test_removing_portal_role_does_not_convert_carer_to_staff(self):
        _, _, uid, _, _ = self.fixture()
        self.dbo.delete("userrole", "UserID=%d" % uid)
        with self.assertRaises(asm3.utils.ASMPermissionError):
            foster.identity(self.dbo, "synthetic-carer")
        self.assertEqual(
            self.dbo.query_int(
                "SELECT COUNT(*) FROM tw_foster_account WHERE UserID = ?", [uid]
            ),
            1,
        )

    def request(self, path, data=None, origin="http://localhost:5000"):
        import staff_wsgi

        env = {}
        setup_testing_defaults(env)
        body = urlencode(data or {}).encode()
        env.update(
            {
                "PATH_INFO": path,
                "HTTP_HOST": "localhost:5000",
                "SERVER_NAME": "localhost",
                "SERVER_PORT": "5000",
                "REMOTE_ADDR": "127.0.0.1",
                "REQUEST_METHOD": "POST" if data is not None else "GET",
                "CONTENT_TYPE": "application/x-www-form-urlencoded",
                "CONTENT_LENGTH": str(len(body)),
                "wsgi.input": BytesIO(body),
                "HTTP_ORIGIN": origin,
                "HTTP_COOKIE": getattr(self, "cookies", ""),
            }
        )
        result = {}

        def start(status, headers, exc_info=None):
            result.update(status=int(status.split()[0]), headers=dict(headers))
            cookie = SimpleCookie()
            for key, value in headers:
                if key.lower() == "set-cookie":
                    cookie.load(value)
            if cookie:
                self.cookies = "; ".join(f"{k}={v.value}" for k, v in cookie.items())

        result["body"] = b"".join(staff_wsgi.application(env, start)).decode(
            errors="replace"
        )
        return result

    def login(self, password, code=True):
        self.cookies = ""
        return self.request(
            "/login",
            {
                "username": "synthetic-carer",
                "password": password,
                "onetimepass": str(asm3.utils.totp("JBSWY3DPEHPK3PXP")).zfill(6)
                if code
                else "",
            },
        )

    def csrf(self, response):
        return re.search(r'name="csrf" value="([^"]+)"', response["body"])[1]

    def test_real_wsgi_gateway_denies_native_routes_and_rechecks_live_placement(self):
        aid, _, _, movement, password = self.fixture()
        with patch.dict(os.environ, {"FOSTER_PORTAL_ENABLED": "true"}):
            self.assertEqual(self.login(password)["body"], "synthetic-carer")
            home = self.request("/foster")
            self.assertEqual(home["status"], 200)
            self.assertIn("Assigned synthetic animal", home["body"])
            for route in (
                "/animal",
                "/animal_find_results",
                "/config.js",
                "/media",
                "/report",
                "/service",
                "/diary",
                "/change_user_settings",
            ):
                self.assertIn(self.request(route)["status"], (303, 403), route)
                self.assertEqual(
                    self.request(route, {"mode": "complete"})["status"], 403, route
                )
            detail = self.request(f"/foster/animal/{aid}")
            self.assertNotIn("PRIVATE INTERNAL TEXT", detail["body"])
            self.assertEqual(
                self.request(
                    f"/foster/animal/{aid}",
                    {"action": "observation", "text": "Synthetic rejected"},
                )["status"],
                403,
            )
            self.assertEqual(
                self.request(
                    f"/foster/animal/{aid}",
                    {"csrf": self.csrf(detail)},
                    origin="https://foreign.invalid",
                )["status"],
                403,
            )
            self.dbo.update("adoption", movement, {"ReturnDate": self.dbo.today()})
            self.assertNotIn(
                "Assigned synthetic animal", self.request("/foster")["body"]
            )
            for route in (f"/foster/animal/{aid}", f"/foster/photo/{aid}"):
                self.assertEqual(self.request(route)["status"], 403)
            self.assertEqual(
                self.request(
                    f"/foster/animal/{aid}",
                    {
                        "csrf": self.csrf(detail),
                        "action": "observation",
                        "token": str(uuid.uuid4()),
                        "text": "Rejected after return",
                    },
                )["status"],
                403,
            )

    def test_real_wsgi_enrolment_own_account_and_credential_revocation(self):
        _, _, uid, _, password = self.fixture(enabled=False)
        with patch.dict(os.environ, {"FOSTER_PORTAL_ENABLED": "true"}):
            self.login(password, code=False)
            self.assertTrue(
                self.request("/foster")["headers"]
                .get("Location", "")
                .endswith("/foster/account")
            )
            account = self.request("/foster/account")
            self.assertEqual(account["status"], 200)
            self.assertNotIn("Active Fosters", account["body"])
            values = {
                "csrf": self.csrf(account),
                "action": "enrol",
                "password": password,
                "code": "bad",
            }
            self.assertEqual(self.request("/foster/account", values)["status"], 400)
            values["code"] = str(asm3.utils.totp("JBSWY3DPEHPK3PXP")).zfill(6)
            self.assertEqual(self.request("/foster/account", values)["status"], 303)
            self.assertEqual(
                self.dbo.query_int("SELECT EnableTOTP FROM users WHERE ID = ?", [uid]),
                1,
            )
            self.assertEqual(self.request("/foster")["status"], 200)
            self.dbo.update("users", uid, {"OwnerID": self.person()})
            self.assertEqual(self.request("/foster")["status"], 303)

    def test_real_wsgi_disabled_feature_and_staff_accounts_cannot_enter_portal(self):
        *_, password = self.fixture()
        with patch.dict(os.environ, {"FOSTER_PORTAL_ENABLED": "false"}):
            self.login(password)
            self.assertEqual(self.request("/foster")["status"], 403)
        self.cookies = ""
        self.assertEqual(self.request("/foster")["status"], 303)
