from .base import *  # noqa: F401,F403
import sys

DEBUG = True
SECRET_KEY = SECRET_KEY or "dev-only-insecure-key-change-me"  # noqa: F405

if "test" in sys.argv:
    # Keep rate limits from interfering with automated tests.
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {"auth": "10000/min", "contact": "10000/min"}  # noqa: F405
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
