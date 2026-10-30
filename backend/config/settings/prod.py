"""Production settings. Requires DJANGO_SECRET_KEY and DJANGO_ALLOWED_HOSTS in the environment."""
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403

DEBUG = False
if not SECRET_KEY:  # noqa: F405
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY in the environment for production.")

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
X_FRAME_OPTIONS = "DENY"
