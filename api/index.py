import sys
import os
from pathlib import Path

# Add the backend directory to the path so internal imports work
backend_path = str(Path(__file__).parent.parent / "smartscholar-backend")
sys.path.append(backend_path)

# Now import the app from main
from main import app

# Set the root path to /api so that FastAPI handles routing correctly on Vercel
app.root_path = "/api"
