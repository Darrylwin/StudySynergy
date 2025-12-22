"""
Script pour lancer le serveur FastAPI.

Usage:
    python run.py
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    print("🚀 Démarrage de StudySynergy API...")
    print(f"📍 URL: http://{settings.HOST}:{settings.PORT}")
    print(f"📚 Documentation: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"💚 Health check: http://{settings.HOST}:{settings.PORT}/health")
    print("-" * 60)

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,  # Auto-reload en mode debug
        log_level="info" if settings.DEBUG else "warning"
    )