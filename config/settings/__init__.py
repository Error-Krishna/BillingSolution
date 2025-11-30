import os
from .base import * # Import all common settings first

# Determine which settings file to load based on the environment variable
# DJANGO_SETTINGS_MODULE is typically set to 'config.settings.dev' or 'config.settings.prod'
try:
    # Get the last part of the settings module name (e.g., 'dev' or 'prod')
    ENV_NAME = os.environ.get('DJANGO_SETTINGS_MODULE', '').rsplit('.', 1)[-1] 
except IndexError:
    ENV_NAME = 'dev' # Default to dev if the env var isn't set properly

# Dynamically import the specific environment settings
if ENV_NAME == 'prod':
    from .prod import *
    print("--- Loading Production Settings ---")
elif ENV_NAME == 'dev':
    from .dev import *
    print("--- Loading Development Settings ---")
else:
    # Fallback to dev if the name is unrecognized
    from .dev import *
    print(f"--- Unknown environment '{ENV_NAME}'. Defaulting to Development Settings. ---")