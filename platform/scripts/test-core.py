#!/usr/bin/env python3
import os, sys, tempfile, pathlib, shutil, unittest, importlib
from unittest.mock import patch

root = pathlib.Path(__file__).resolve().parents[1]
upstream = root / "vendor/asm"
sys.path[:0] = [str(upstream), str(upstream / "src")]
with tempfile.TemporaryDirectory(prefix="tailwag-core-tests-") as tmp:
    config = pathlib.Path(tmp) / "asm3.conf"
    config.write_text(
        f"log_location = stderr\nlog_debug = false\ndisk_cache = {tmp}/cache\n"
    )
    os.environ["ASM3_CONF"] = str(config)
    import asm3.db, asm3.dbupdate, asm3.cachemem, asm3.al, asm3.utils

    asm3.al.logmsg = lambda *args: None
    dbo = asm3.db.get_dbo("SQLITE")
    dbo.database = tmp + "/base.db"
    dbo.installpath = str(upstream / "src") + "/"
    for install in (
        asm3.dbupdate.install_db_structure,
        asm3.dbupdate.install_db_views,
        asm3.dbupdate.install_default_data,
        asm3.dbupdate.install_db_sequences,
        asm3.dbupdate.install_db_stored_procedures,
        asm3.dbupdate.install_default_templates,
        asm3.dbupdate.install_default_onlineforms,
    ):
        install(dbo)
    from unittests import base

    modules = [
        "animal",
        "animalcontrol",
        "animalname",
        "additional",
        "dbfs",
        "dbupdate",
        "diary",
        "event",
        "financial",
        "html",
        "log",
        "lookups",
        "lostfound",
        "media",
        "medical",
        "movement",
        "onlineform",
        "person",
        "reports",
        "search",
        "stock",
        "template",
        "users",
        "utils",
        "waitinglist",
        "wordprocessor",
    ]
    suite = unittest.TestSuite(
        unittest.defaultTestLoader.loadTestsFromModule(
            importlib.import_module("unittests.test_" + name)
        )
        for name in modules
    )

    class IsolatedResult(unittest.TextTestResult):
        def startTest(self, test):
            shutil.copyfile(tmp + "/base.db", tmp + "/test.db")
            asm3.cachemem.dict_client = {}
            shutil.rmtree(tmp + "/cache", ignore_errors=True)
            base.dbo = asm3.db.get_dbo("SQLITE")
            base.dbo.database = tmp + "/test.db"
            base.dbo.installpath = str(upstream / "src") + "/"
            if test.id().endswith(".test_create_transport"):
                from asm3 import animal as animal_module

                animal_module.insert_animal_from_form(
                    base.dbo,
                    asm3.utils.PostedData(
                        {
                            "animalname": "UnitTestAnimal",
                            "animaltype": "1",
                            "species": "1",
                            "estimatedage": "2",
                            "entryreason": "1",
                        },
                        "en",
                    ),
                    "test",
                )
            super().startTest(test)

    with patch("asm3.utils._send_email", return_value=None):
        result = unittest.TextTestRunner(resultclass=IsolatedResult, verbosity=1).run(
            suite
        )
    sys.exit(0 if result.wasSuccessful() else 1)
