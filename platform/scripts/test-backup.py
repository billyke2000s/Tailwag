#!/usr/bin/env python3
"""Exercise maintenance failure handling without Docker or operational records."""

import os
from pathlib import Path
import subprocess
import tempfile

script = Path(__file__).with_name("backup.sh")
with tempfile.TemporaryDirectory(prefix="tailwag-backup-wrapper-") as folder:
    root = Path(folder)
    binary = root / "bin"
    binary.mkdir()
    docker = binary / "docker"
    docker.write_text("""#!/bin/sh
printf '%s\\n' "$*" >> "$TEST_CALLS"
case "$*" in
 'compose ps --status running --services public staff jobs') printf '%s\\n' "$TEST_RUNNING";;
 'compose exec -T db '*) [ "$TEST_FAIL" != yes ] || exit 17; printf 'synthetic dump only';;
esac
""")
    docker.chmod(0o700)
    for name, running, fail in [
        ("success", "public\nstaff", "no"),
        ("failure", "staff", "yes"),
        ("stopped", "", "no"),
    ]:
        output = root / name
        calls = root / (name + ".calls")
        env = {
            **os.environ,
            "PATH": str(binary) + ":" + os.environ["PATH"],
            "TEST_CALLS": str(calls),
            "TEST_RUNNING": running,
            "TEST_FAIL": fail,
        }
        result = subprocess.run(
            ["sh", str(script), str(output)], env=env, capture_output=True, text=True
        )
        assert (result.returncode == 0) == (fail == "no"), (name, result.stderr)
        starts = [
            line
            for line in calls.read_text().splitlines()
            if line.startswith("compose start")
        ]
        assert starts == (
            ["compose start " + running.replace("\n", " ")] if running else []
        ), (name, starts)
        if fail == "no":
            checksum = next(output.glob("*.sha256"))
            subprocess.run(
                ["sha256sum", "-c", checksum.name],
                cwd=output,
                check=True,
                stdout=subprocess.DEVNULL,
            )
            assert (next(output.glob("*.dump")).stat().st_mode & 0o077) == 0
        else:
            assert not list(output.glob("*.dump"))
print(
    "Backup wrapper synthetic success/failure/state/checksum checks passed; no live backup performed"
)
