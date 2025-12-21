"""
Configuration centralisée de l'application.
Charge les variables d'environnement et expose les paramètres.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Charger les variables depuis . env
load_dotenv()


class Settings:
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH")

    # Stockage local
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "./uploads"))
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", 50))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024

    # Google Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    # Serveur
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    def __init__(self):
        # Créer le dossier uploads s'il n'existe pas
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# Instance globale accessible partout
settings = Settings()