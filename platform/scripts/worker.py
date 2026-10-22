#!/usr/bin/env python3
import datetime, pathlib, subprocess, sys, time
from zoneinfo import ZoneInfo

root = pathlib.Path(__file__).resolve().parents[1]
success = root / "runtime/last-jobs-success"
attempt = root / "runtime/last-jobs-attempt"


def write(path, text):
    temp = path.with_suffix(".new")
    temp.write_text(text)
    temp.replace(path)


while True:
    now = datetime.datetime.now(ZoneInfo("Europe/London"))
    today = now.date().isoformat()
    if now.hour >= 4 and (not attempt.exists() or attempt.read_text() != today):
        write(attempt, today)
        result = subprocess.run([sys.executable, str(root / "scripts/run-jobs.py")])
        if result.returncode == 0:
            cleanup = subprocess.run(
                [sys.executable, str(root / "scripts/prune-metadata.py")]
            )
            if cleanup.returncode:
                print("metadata_cleanup_failed", file=sys.stderr)
            write(success, today)
        else:
            print("daily_jobs_failed_reconciliation_required", file=sys.stderr)
    time.sleep(60)
