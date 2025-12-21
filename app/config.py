"""
Configuration centralisée de l'application.
Charge les variables d'environnement et expose les paramètres.
"""
import os
from dotenv import load_dotenv

# Charger les variables depuis .env
load_dotenv()


class Settings:
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET")

    # Google Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    # Serveur
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"


# Instance globale accessible partout
settings = Settings()