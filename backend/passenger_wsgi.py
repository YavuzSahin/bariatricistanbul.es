import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Import the FastAPI app
from server import app

# Passenger WSGI/ASGI entry point
# cPanel Passenger 6+ supports ASGI natively
application = app
