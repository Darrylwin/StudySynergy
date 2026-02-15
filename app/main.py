"""
Initialisation de l'application FastAPI.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, session, tools
from app.config import settings
from app.routes import auth, session, tools, files

# Créer l'application FastAPI
app = FastAPI(
    title="StudySynergy API",
    description="Backend API pour StudySynergy - Plateforme d'apprentissage assistée par IA",
    version="2.1.0",
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS (pour autoriser le frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, remplacer par l'URL exacte du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrer les routes
app.include_router(auth.router)
app.include_router(session.router)
app.include_router(tools.router)
app.include_router(files.router)

# Route de santé
@app.get("/health")
async def health_check():
    """Vérifie que l'API est en ligne"""
    return {
        "status": "ok",
        "message": "StudySynergy API v2.1 is running",
        "auth": "JWT",
        "database": "Firestore",
        "storage": "Cloudinary"
    }

@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "message": "Bienvenue sur StudySynergy API",
        "documentation": "/docs",
        "health": "/health",
        "version": "2.1.0"
    }