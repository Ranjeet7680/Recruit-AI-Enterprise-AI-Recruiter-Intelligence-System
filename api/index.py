import os
import sys

# Add the project root to the sys.path to allow importing from src
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.api import app
