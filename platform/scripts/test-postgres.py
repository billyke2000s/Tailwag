#!/usr/bin/env python3
import os, sys, tempfile, pathlib, subprocess, secrets, shutil
import psycopg2

root = pathlib.Path(__file__).resolve().parents[1]
name = os.environ["PGDATABASE"]
if not name.endswith("_test"):
    raise SystemExit("Refused: database must end in _test")
kwargs = dict(
    host=os.environ["PGHOST"],
    port=os.getenv("PGPORT", "5432"),
    user=os.environ["PGUSER"],
    password=os.environ["PGPASSWORD"],
)
with psycopg2.connect(dbname=name, **kwargs) as con:
    with con.cursor() as cursor:
        cursor.execute(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'"
        )
        if cursor.fetchone()[0]:
            raise SystemExit("Refused: test database is not empty")
with tempfile.TemporaryDirectory(prefix="care-pg-test-") as tmp:
    env = {
        **os.environ,
        "DEBUG": "true",
        "TZ": "UTC",
        "SECRET_KEY": secrets.token_urlsafe(48),
        "ADMIN_PASSWORD": secrets.token_urlsafe(24),
        "ASM3_CONF": tmp + "/asm3.conf",
        "CORE_CACHE_DIR": tmp + "/cache",
    }

    def run(script, *args):
        subprocess.run(
            [sys.executable, str(root / script), *args], env=env, cwd=root, check=True
        )

    run("scripts/configure.py")
    run("manage.py", "migrate", "--noinput")
    run("scripts/bootstrap.py")
    run("scripts/upgrade-core.py")
    run("manage.py", "migrate", "--check")
    os.environ.update(env)
    sys.path.insert(0, str(root))
    from shelter import core
    from shelter.locks import writer_lock

    data = dict(
        first_name="Synthetic",
        last_name="Postgres Test",
        email="postgres-test@example.invalid",
        message="Synthetic database verification",
    )
    with writer_lock():
        first = core.submit("contact", data, "", "127.0.0.1", "Mozilla Test")
    with writer_lock():
        second = core.submit("contact", data, "", "127.0.0.1", "Mozilla Test")
    assert first != second
    assert (
        core.database().query_int(
            "SELECT COUNT(DISTINCT CollationID) FROM onlineformincoming"
        )
        == 2
    )
    # Exercise the same advisory-writer boundary used by real staff POSTs.
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    import asm3.animal, asm3.person, asm3.movement, asm3.utils, asm3.i18n

    dbo = core.database()
    person = asm3.person.insert_person_from_form(
        dbo,
        asm3.utils.PostedData(
            {"surname": "Synthetic PG concurrency household", "forenames": "Test"},
            "en_GB",
        ),
        "pg-test",
        geocode=False,
    )
    dbo.update("owner", person, {"IDCheck": 1, "IsFosterer": 1, "FosterCapacity": 1})
    animal_ids = [
        asm3.animal.insert_animal_from_form(
            dbo,
            asm3.utils.PostedData(
                {
                    "animalname": "Synthetic PG capacity " + str(i),
                    "animaltype": "1",
                    "species": "1",
                    "estimatedage": "2",
                    "entryreason": "1",
                },
                "en_GB",
            ),
            "pg-test",
        )[0]
        for i in range(2)
    ]
    ready = Barrier(2)

    def place(animal):
        ready.wait(timeout=10)
        try:
            with writer_lock():
                db = core.database()
                asm3.movement.insert_foster_from_form(
                    db,
                    "pg-test",
                    asm3.utils.PostedData(
                        {
                            "animal": str(animal),
                            "person": str(person),
                            "fosterdate": asm3.i18n.python2display("en_GB", db.today()),
                        },
                        "en_GB",
                    ),
                )
            return "placed"
        except asm3.utils.ASMValidationError:
            return "rejected"

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(place, animal_ids))
    assert sorted(results) == ["placed", "rejected"], results
    assert (
        dbo.query_int(
            "SELECT COUNT(*) FROM adoption WHERE OwnerID = ? AND MovementType = 2 AND ReturnDate IS NULL",
            [person],
        )
        == 1
    )
    # Real PostgreSQL transaction: competing completion and interrupted stock write.
    import json
    from unittest.mock import patch
    import asm3.medical, asm3.stock
    from shelter.care import record_care, snapshot

    date = asm3.i18n.python2display("en_GB", dbo.today())
    treatment_ids = []
    for i in range(2):
        regimen = asm3.medical.insert_regimen_from_form(
            dbo,
            "pg-test",
            asm3.utils.PostedData(
                {
                    "animal": str(animal_ids[0]),
                    "startdate": date,
                    "treatmentname": "Synthetic PG care fixture " + str(i),
                    "dosage": "Synthetic text only; no dose",
                    "singlemulti": "0",
                    "treatmentrule": "0",
                    "status": "0",
                },
                "en_GB",
            ),
        )
        treatment_ids.append(
            dbo.query_int(
                "SELECT ID FROM animalmedicaltreatment WHERE AnimalMedicalID = ?",
                [regimen],
            )
        )
    care_stock = asm3.stock.insert_stocklevel_from_form(
        dbo,
        asm3.utils.PostedData(
            {
                "name": "Synthetic PG supply",
                "unitname": "synthetic units",
                "balance": "10",
                "total": "10",
                "usagedate": date,
                "usagetype": "1",
                "location": "1",
            },
            "en_GB",
        ),
        "pg-test",
    )
    care_payload = {
        "ids": str(treatment_ids[0]),
        "newdate": date,
        "item": str(care_stock),
        "quantity": "2",
        "usagetype": "1",
    }
    care_ready = Barrier(2)

    def complete_care(_):
        care_ready.wait(timeout=10)
        try:
            with writer_lock():
                record_care(
                    core.database(),
                    "pg-test",
                    asm3.utils.PostedData(care_payload, "en_GB"),
                )
            return "recorded"
        except asm3.utils.ASMValidationError:
            return "rejected"

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(complete_care, range(2)))
    assert sorted(results) == ["recorded", "rejected"], results
    assert (
        dbo.query_float("SELECT Balance FROM stocklevel WHERE ID = ?", [care_stock])
        == 8
    )
    before_audit = dbo.query_int("SELECT COUNT(*) FROM audittrail")
    failed_payload = {**care_payload, "ids": str(treatment_ids[1])}
    with patch(
        "asm3.stock.insert_stockusage",
        side_effect=RuntimeError("Synthetic PG interruption"),
    ):
        try:
            record_care(dbo, "pg-test", asm3.utils.PostedData(failed_payload, "en_GB"))
        except RuntimeError:
            pass
        else:
            raise AssertionError("Expected injected care interruption")
    assert (
        dbo.query_date(
            "SELECT DateGiven FROM animalmedicaltreatment WHERE ID = ?",
            [treatment_ids[1]],
        )
        is None
    )
    assert (
        dbo.query_float("SELECT Balance FROM stocklevel WHERE ID = ?", [care_stock])
        == 8
    )
    assert dbo.query_int("SELECT COUNT(*) FROM audittrail") == before_audit
    care_row = dbo.first_row(
        dbo.query(
            "SELECT * FROM animalmedicaltreatment WHERE ID = ?", [treatment_ids[0]]
        )
    )
    correction = {
        **care_payload,
        "item": "-1",
        "recordaction": "correct",
        "correctionreason": "Synthetic PG correction",
        "recordversions": json.dumps(
            {str(care_row.ID): snapshot(dbo, "animalmedicaltreatment", care_row)}
        ),
    }
    record_care(dbo, "pg-reviewer", asm3.utils.PostedData(correction, "en_GB"))
    try:
        record_care(dbo, "pg-reviewer", asm3.utils.PostedData(correction, "en_GB"))
    except asm3.utils.ASMValidationError:
        pass
    else:
        raise AssertionError("Stale PG correction accepted")
    # Real canonical portal metadata and independent per-account transaction lock.
    from shelter import foster
    from tests.foster_fixture import create as foster_fixture
    import uuid

    fixture = foster_fixture(dbo, env["ADMIN_PASSWORD"])
    token = str(uuid.uuid4())
    barrier = Barrier(2)

    def observe_once(_):
        barrier.wait()
        return foster.act(
            core.database(),
            "synthetic-portal-0",
            fixture["animals"][0],
            token,
            "observation",
            "Synthetic concurrent PostgreSQL observation",
        )

    with ThreadPoolExecutor(max_workers=2) as executor:
        outcomes = list(executor.map(observe_once, range(2)))
    assert outcomes[0] == outcomes[1]
    assert (
        dbo.query_int("SELECT COUNT(*) FROM tw_action_receipt WHERE Token = ?", [token])
        == 1
    )
    portal_log, portal_review = outcomes[0]
    assert (
        dbo.query_int("SELECT LinkType FROM diary WHERE ID = ?", [portal_review])
        == asm3.diary.ANIMAL
    )
    portal_user = foster.identity(dbo, "synthetic-portal-0")
    task_row = foster.tasks(dbo, portal_user, fixture["animals"][0])[0]
    foster.act(
        dbo,
        portal_user.USERNAME,
        fixture["animals"][0],
        str(uuid.uuid4()),
        "task",
        task_id=task_row.ID,
        version=foster.task_version(portal_user, task_row),
    )
    before_logs = dbo.query_int("SELECT COUNT(*) FROM log")
    from unittest.mock import patch

    with patch(
        "asm3.diary.insert_diary_from_form",
        side_effect=RuntimeError("Synthetic portal rollback"),
    ):
        try:
            foster.act(
                dbo,
                portal_user.USERNAME,
                fixture["animals"][0],
                str(uuid.uuid4()),
                "observation",
                "Synthetic PostgreSQL failure observation",
            )
        except RuntimeError:
            pass
        else:
            raise AssertionError("Portal failure was swallowed")
    assert dbo.query_int("SELECT COUNT(*) FROM log") == before_logs
    subprocess.run(
        ["pg_dump", "--format=custom", "--file", tmp + "/care.dump", name],
        env=env,
        check=True,
    )
    admin = psycopg2.connect(dbname="postgres", **kwargs)
    admin.autocommit = True
    try:
        with admin.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname=%s", ["tailwag_restore_test"]
            )
            if cursor.fetchone():
                raise SystemExit("Refused: restore database already exists")
            cursor.execute("CREATE DATABASE tailwag_restore_test")
        subprocess.run(
            [
                "pg_restore",
                "--exit-on-error",
                "--no-owner",
                "--no-acl",
                "--dbname",
                "tailwag_restore_test",
                tmp + "/care.dump",
            ],
            env=env,
            check=True,
        )
        with psycopg2.connect(dbname="tailwag_restore_test", **kwargs) as restored:
            with restored.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(DISTINCT CollationID) FROM onlineformincoming"
                )
                assert cursor.fetchone()[0] == 2
                cursor.execute(
                    "SELECT COUNT(*) FROM adoption WHERE OwnerID = %s AND MovementType = 2 AND ReturnDate IS NULL",
                    [person],
                )
                assert cursor.fetchone()[0] == 1
                cursor.execute(
                    "SELECT Balance FROM stocklevel WHERE ID = %s", [care_stock]
                )
                assert cursor.fetchone()[0] == 8
                cursor.execute(
                    "SELECT DateGiven, Comments FROM animalmedicaltreatment WHERE ID = %s",
                    [treatment_ids[0]],
                )
                completed = cursor.fetchone()
                assert (
                    completed[0] is not None
                    and "Synthetic PG correction" in completed[1]
                )
                cursor.execute(
                    "SELECT DateGiven FROM animalmedicaltreatment WHERE ID = %s",
                    [treatment_ids[1]],
                )
                assert cursor.fetchone()[0] is None
                cursor.execute(
                    "SELECT ResultID, AuxID FROM tw_action_receipt WHERE Token = %s",
                    [token],
                )
                assert cursor.fetchone() == (portal_log, portal_review)
                cursor.execute(
                    "SELECT LinkType, LinkID FROM diary WHERE ID = %s", [portal_review]
                )
                assert cursor.fetchone() == (asm3.diary.ANIMAL, fixture["animals"][0])
    finally:
        with admin.cursor() as cursor:
            cursor.execute("DROP DATABASE IF EXISTS tailwag_restore_test WITH (FORCE)")
        admin.close()
print(
    "PostgreSQL installation, migration, shared IDs, submissions, concurrent foster capacity, care concurrency/rollback/corrections, portal replay/rollback/tasks and restore passed"
)
