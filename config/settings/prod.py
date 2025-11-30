from .base import * # Import all common settings

# Override base settings for production
DEBUG = False

# ------------------------------------------------------------------
# ⚠️ Update this with your real domain name when you deploy!
# ------------------------------------------------------------------
ALLOWED_HOSTS = ['www.your-domain.com', 'your-domain.com']


# Example production-only security settings
# (You can uncomment these when you deploy to a live server)

# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_HSTS_SECONDS = 31536000 # (1 year)
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True