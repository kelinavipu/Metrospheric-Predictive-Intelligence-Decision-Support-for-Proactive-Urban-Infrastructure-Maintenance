"""
UrbanPulse Core Application Configuration
Loads settings from environment variables or .env file with zero-external-dependency defaults.
"""

import os
from pathlib import Path
from typing import List
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseModel):
    APP_NAME: str = "UrbanPulse"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "urbanpulse-matte-secret-key-native-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Storage paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    MODEL_STORE_DIR: Path = BASE_DIR / "model_store"
    DATABASE_PATH: Path = BASE_DIR / "urbanpulse.db"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'urbanpulse.db'}"

    # Simulation & Stream
    USE_SIMULATED_STREAM: bool = True
    SIMULATION_TICK_SECONDS: float = 1.0

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

# Instantiate global settings
settings = Settings()

# Ensure runtime directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.MODEL_STORE_DIR.mkdir(parents=True, exist_ok=True)
