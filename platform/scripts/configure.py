#!/usr/bin/env python3
"""Render private runtime configuration; never print secrets."""

import os, pathlib, json, secrets

root = pathlib.Path(__file__).resolve().parents[1]
runtime = root / "runtime"
runtime.mkdir(exist_ok=True, mode=0o700)


def value(key, default=""):
    data = os.getenv(key, default)
    if "\n" in data or "\r" in data or "#" in data:
        raise ValueError(f"Invalid config value: {key}")
    return data


production = os.getenv("DEBUG", "false") != "true"
if production and not os.getenv("PGHOST"):
    raise SystemExit("Production requires PostgreSQL")
values = {
    "base_url": value("STAFF_URL", "http://localhost:5000"),
    "service_url": value("STAFF_URL", "http://localhost:5000") + "/service",
    "locale": "en_GB",
    "timezone": "0",
    "log_location": "stderr",
    "log_debug": "false",
    "autoreload": "false",
    "deployment_type": "wsgi",
    "session_secure_cookie": str(production).lower(),
    "email_errors": "false",
    "db_type": "POSTGRESQL" if os.getenv("PGHOST") else "SQLITE",
    "db_host": value("PGHOST", "localhost"),
    "db_port": value("PGPORT", "5432"),
    "db_name": value("PGDATABASE", str(runtime / "core.sqlite3")),
    "db_username": value("PGUSER"),
    "db_password": value("PGPASSWORD"),
    "dbfs_store": "database",
    "disk_cache": value("CORE_CACHE_DIR", str(runtime / "cache")),
    "cache_common_queries": "false",
    "cache_service_responses": "false",
    "rollup_js": "false",
    "minify_js": "false",
    "smtp_server": json.dumps(
        {
            "sendmail": False,
            "host": value("SMTP_HOST", "localhost"),
            "port": int(value("SMTP_PORT", "1025")),
            "username": value("SMTP_USER"),
            "password": value("SMTP_PASSWORD"),
            "usetls": value("SMTP_TLS", "true") == "true",
        }
    ),
    "from_address": value("SMTP_FROM", "not-configured@example.invalid"),
    "html_to_pdf": "",
    "large_files_chunked": "false",
}
pathlib.Path(values["disk_cache"]).mkdir(parents=True, exist_ok=True)
path = pathlib.Path(os.getenv("ASM3_CONF", str(runtime / "asm3.conf")))
path.parent.mkdir(parents=True, exist_ok=True)
temp = path.parent / ("asm3.conf." + secrets.token_hex(8))
temp.write_text("".join(f"{k} = {v}\n" for k, v in values.items()))
temp.chmod(0o600)
temp.replace(path)
