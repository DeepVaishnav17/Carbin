import os
from pathlib import Path

# -----------------------------------------
# Base
# -----------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent


# -----------------------------------------
# Security / Core
# -----------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-reatmos-dev-key-change-in-prod")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Allowed Hosts (Render provides domain like: xxxx.onrender.com)
# You can set ALLOWED_HOSTS in Render env as:
# yourapp.onrender.com,localhost,127.0.0.1
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "*").split(",") if h.strip()]

# Render proxy fix (important for HTTPS)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")


# -----------------------------------------
# Apps
# -----------------------------------------
INSTALLED_APPS = [
    # Django default
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "rest_framework",
    "corsheaders",

    # Local apps
    "pollution",
]


# -----------------------------------------
# Middleware
# -----------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    # WhiteNoise for Render static files
    "whitenoise.middleware.WhiteNoiseMiddleware",

    # CORS (must be high)
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# -----------------------------------------
# URL / WSGI
# -----------------------------------------
ROOT_URLCONF = "ReAtmosBackend.urls"

WSGI_APPLICATION = "ReAtmosBackend.wsgi.application"


# -----------------------------------------
# Templates
# -----------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # ✅ if you ever add global templates folder
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# -----------------------------------------
# Database
# -----------------------------------------
# ✅ SQLite is OK for basic admin/testing
# ⚠️ Render resets filesystem -> db.sqlite3 will reset after redeploy
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# -----------------------------------------
# Password Validation
# -----------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# -----------------------------------------
# Internationalization
# -----------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True


# -----------------------------------------
# Static files (Render + WhiteNoise)
# -----------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise: caching + compression
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


# -----------------------------------------
# Default primary key
# -----------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# -----------------------------------------
# Django REST Framework
# -----------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}


# -----------------------------------------
# CORS (Next.js frontend -> Django backend)
# -----------------------------------------
# In Render env set:
# CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
cors_allowed = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()

if cors_allowed:
    CORS_ALLOWED_ORIGINS = [x.strip() for x in cors_allowed.split(",") if x.strip()]
else:
    # ✅ allow all only in dev
    CORS_ALLOW_ALL_ORIGINS = DEBUG

# Optional headers support
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = ["https://re-atmos-ten.vercel.app"]

# -----------------------------------------
# Extra Production Security (Recommended)
# -----------------------------------------
if not DEBUG:
    # HTTPS enforcement (recommended)
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").lower() == "true"

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Security headers
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "False").lower() == "true"
    SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "False").lower() == "true"

    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True


# -----------------------------------------
# MongoDB Atlas (PyMongo)
# -----------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB", "carbon_emission_db")

MONGODB_USERS_COLLECTION = os.getenv("MONGODB_USERS_COLLECTION", "users")
MONGODB_APICENTERS_COLLECTION = os.getenv("MONGODB_APICENTERS_COLLECTION", "apicenter")
