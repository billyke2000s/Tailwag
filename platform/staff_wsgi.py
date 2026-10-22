import collections, os, sys, threading, time
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "vendor/asm/src"))
from shelter import core_runtime
from shelter.locks import writer_lock
import main
from whitenoise import WhiteNoise

main.web.config.debug = False
main.app.internalerror = lambda: main.web.internalerror(
    "The operation could not be confirmed. Check the record before retrying or ask the administrator."
)
main.web.config.session_parameters.update(
    {
        "secret_key": os.environ["SECRET_KEY"],
        "httponly": True,
        "samesite": "Strict",
        "timeout": 3600,
    }
)
app = WhiteNoise(
    main.application,
    root=str(ROOT / "vendor/asm/src/static"),
    prefix="static/",
    autorefresh=os.getenv("DEBUG") == "true",
)
lock = threading.Lock()
windows = collections.OrderedDict()
allowed = urlsplit(os.getenv("STAFF_URL", "http://localhost:5000"))


def application(environ, start_response):
    if os.getenv("TRUST_PROXY") == "true" and environ.get("HTTP_X_REAL_IP"):
        environ["REMOTE_ADDR"] = environ["HTTP_X_REAL_IP"]
    path = environ.get("PATH_INFO", "/")
    method = environ.get("REQUEST_METHOD", "GET")

    def reject(status, message):
        start_response(
            status,
            [
                ("Content-Type", "text/plain; charset=utf-8"),
                ("Cache-Control", "no-store"),
            ],
        )
        return [message.encode()]

    if path.rstrip("/") in (
        "/database",
        "/database_reset",
        "/database_update",
        "/service",
    ):
        return reject(
            "403 Forbidden",
            "Web database installers and unconfigured external service APIs are disabled",
        )
    if int(environ.get("CONTENT_LENGTH") or 0) > 16 * 1024 * 1024:
        return reject("413 Content Too Large", "Upload is too large")
    if method not in ("GET", "HEAD", "OPTIONS"):
        parsed = urlsplit(environ.get("HTTP_ORIGIN") or environ.get("HTTP_REFERER", ""))
        if (parsed.scheme, parsed.netloc) != (allowed.scheme, allowed.netloc):
            return reject(
                "403 Forbidden",
                "Request origin could not be verified; reload from the configured team hostname",
            )
    if path.rstrip("/") in ("/login", "/mobile_login") and method == "POST":
        key = environ.get("REMOTE_ADDR", "")
        now = time.monotonic()
        with lock:
            start, count = windows.get(key, (now, 0))
            if now - start > 600:
                start, count = now, 0
            if count >= 10:
                return reject(
                    "429 Too Many Requests",
                    "Too many login attempts; try in ten minutes",
                )
            windows[key] = (start, count + 1)
            windows.move_to_end(key)
            while len(windows) > 10000:
                windows.popitem(last=False)

    def headers(status, items, exc_info=None):
        items = [
            (k, v)
            for k, v in items
            if k.lower() not in ("cache-control", "x-frame-options", "referrer-policy")
        ]
        return start_response(
            status,
            items
            + [
                ("Cache-Control", "no-store"),
                ("X-Frame-Options", "DENY"),
                ("Referrer-Policy", "same-origin"),
                ("X-Content-Type-Options", "nosniff"),
            ],
            exc_info,
        )

    if method not in ("GET", "HEAD", "OPTIONS"):
        with writer_lock():
            return list(app(environ, headers))
    return app(environ, headers)
