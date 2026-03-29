"""
Configuration loader for the Python AI Engine.
Loads environment variables from .env file.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b")

# Server
PYTHON_API_PORT = int(os.getenv("PYTHON_API_PORT", 8001))
