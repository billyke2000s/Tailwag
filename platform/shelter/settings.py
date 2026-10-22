import os
from pathlib import Path
from urllib.parse import urlsplit

BASE_DIR = Path(__file__).resolve().parent.parent
DEBUG = os.getenv("DEBUG", "false") == "true"
SECRET_KEY = os.environ["SECRET_KEY"]
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "shelter",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "shelter.middleware.Headers",
]
ROOT_URLCONF = "shelter.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "shelter.context.organisation",
            ]
        },
    }
]
if os.getenv("PGHOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "HOST": os.environ["PGHOST"],
            "PORT": os.getenv("PGPORT", "5432"),
            "NAME": os.environ["PGDATABASE"],
            "USER": os.environ["PGUSER"],
            "PASSWORD": os.environ["PGPASSWORD"],
            "CONN_MAX_AGE": 60,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.getenv(
                "PORTAL_DB_PATH", str(BASE_DIR / "runtime" / "portal.sqlite3")
            ),
        }
    }
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
STATIC_URL = "/assets/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
USE_TZ = True
TIME_ZONE = "Europe/London"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_SSL_REDIRECT = not DEBUG
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
DATA_UPLOAD_MAX_MEMORY_SIZE = 65536
ORG_NAME = os.getenv("ORG_NAME", "TailWag Animal Care")
ORG_EMAIL = os.getenv("ORG_EMAIL", "")
ORG_ADDRESS = os.getenv("ORG_ADDRESS", "")
ORG_NATION = os.getenv("ORG_NATION", "England")
ORG_AUTHORITY = os.getenv("ORG_AUTHORITY", "unconfirmed")
ORG_VISITING = os.getenv(
    "ORG_VISITING",
    "Visits by confirmed appointment only. Please contact the team before travelling.",
)
DONATE_URL = os.getenv("DONATE_URL", "")
STAFF_URL = os.getenv("STAFF_URL", "http://localhost:5000")
PUBLIC_LAUNCH = os.getenv("PUBLIC_LAUNCH", "false") == "true"
if PUBLIC_LAUNCH and (
    not ORG_EMAIL or not ORG_ADDRESS or ORG_AUTHORITY == "unconfirmed"
):
    raise RuntimeError("Public launch requires organisation and council configuration")
if DONATE_URL and urlsplit(DONATE_URL).scheme != "https":
    raise RuntimeError("DONATE_URL requires a verified HTTPS provider")
if not DEBUG and urlsplit(STAFF_URL).scheme != "https":
    raise RuntimeError("Production staff URL requires HTTPS")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "WARNING"},
}
