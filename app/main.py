"""
Point d'entrée principal de l'application FastAPI.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import session, tools
from app.config import settings

# Créer l'application FastAPI
app = FastAPI(
    title="StudySynergy API",
    description="Backend API pour l'application StudySynergy - Plateforme d'apprentissage assistée par IA",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configuration CORS (pour autoriser le frontend React à appeler l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, remplacer par l'URL exacte du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrer les routes
app.include_router(session.router)
app.include_router(tools. router)

# Route de santé (pour vérifier que l'API fonctionne)
@app.get("/health")
async def health_check():
    """Endpoint de santé pour vérifier que l'API est en ligne."""
    return {
        "status": "ok",
        "message": "StudySynergy API is running"
    }

# Point d'entrée pour lancer le serveur
if __name__ == "__main__":
    import uvicorn
    uvicorn. run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG  # Auto-reload en mode debug
    )