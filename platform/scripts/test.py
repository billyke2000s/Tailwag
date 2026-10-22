#!/usr/bin/env python3
import os, pathlib, tempfile, subprocess, sys, secrets, shutil

root = pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="tailwag-tests-") as tmp:
    env = {
        **os.environ,
        "DEBUG": "true",
        "TZ": "UTC",
        "SECRET_KEY": secrets.token_urlsafe(48),
        "ADMIN_PASSWORD": secrets.token_urlsafe(24),
        "PGDATABASE": tmp + "/core.sqlite3",
        "ASM3_CONF": tmp + "/asm3.conf",
        "CORE_CACHE_DIR": tmp + "/cache",
    }
    env.pop("PGHOST", None)
    for script in ["configure.py", "bootstrap.py"]:
        subprocess.run(
            [sys.executable, str(root / "scripts" / script)], env=env, check=True
        )
    env["TEST_CORE_BACKUP"] = tmp + "/empty.sqlite3"
    shutil.copyfile(tmp + "/core.sqlite3", env["TEST_CORE_BACKUP"])
    subprocess.run(
        [sys.executable, str(root / "manage.py"), "test", "tests", "--verbosity", "2"],
        cwd=root,
        env=env,
        check=True,
    )
