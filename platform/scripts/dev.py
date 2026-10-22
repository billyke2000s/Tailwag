#!/usr/bin/env python3
import os, pathlib, secrets, subprocess, sys, json

root = pathlib.Path(__file__).resolve().parents[1]
os.chdir(root)
(root / "runtime").mkdir(exist_ok=True)
path = root / "runtime/dev-secrets.json"
if not path.exists():
    path.write_text(
        json.dumps(
            {
                "SECRET_KEY": secrets.token_urlsafe(48),
                "ADMIN_PASSWORD": secrets.token_urlsafe(24),
            }
        )
    )
    path.chmod(0o600)
os.environ.update(json.loads(path.read_text()))
os.environ.update(
    {
        "DEBUG": "true",
        "TZ": "UTC",
        "ASM3_CONF": str(root / "runtime/asm3.conf"),
        "STAFF_URL": "http://localhost:5000",
    }
)
subprocess.run([sys.executable, "scripts/configure.py"], check=True)
subprocess.run([sys.executable, "manage.py", "migrate"], check=True)
if not (root / "runtime/core.sqlite3").exists():
    subprocess.run([sys.executable, "scripts/bootstrap.py"], check=True)
if "--seed" in sys.argv:
    os.environ["DEMO_DATA"] = "true"
    subprocess.run([sys.executable, "scripts/seed-demo.py"], check=True)
    sys.exit(0)
if "--prepare" in sys.argv:
    sys.exit(0)
subprocess.run([sys.executable, "manage.py", "collectstatic", "--noinput"], check=True)
staff = subprocess.Popen(
    [
        sys.executable,
        "-m",
        "gunicorn",
        "--bind",
        "127.0.0.1:5000",
        "--workers",
        "1",
        "--threads",
        "4",
        "staff_wsgi:application",
    ]
)
try:
    subprocess.run(
        [sys.executable, "manage.py", "runserver", "127.0.0.1:8000", "--noreload"],
        check=True,
    )
finally:
    staff.terminate()
    staff.wait()
