"""
Configuration centralisée de l'application.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class Settings:
    # Firebase (uniquement Firestore)
    FIREBASE_CREDENTIALS_PATH:  str = os.getenv("FIREBASE_CREDENTIALS_PATH")

    # Stockage local
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "./uploads"))
    MAX_FILE_SIZE_MB: int = int(os. getenv("MAX_FILE_SIZE_MB", 50))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024

    # Google Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    # JWT
    JWT_SECRET_KEY:  str = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os. getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

    # Serveur
    HOST:  str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    def __init__(self):
        self.UPLOAD_DIR. mkdir(parents=True, exist_ok=True)

settings = Settings()