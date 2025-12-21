"""
Point d'entrée de l'application FastAPI.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, session, tools, files
from app.config import settings

app = FastAPI(
    title="StudySynergy API",
    description="Backend API pour StudySynergy - Plateforme d'apprentissage IA",
    version="2.0.0",
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrer les routes
app.include_router(auth.router)
app.include_router(session. router)
app.include_router(tools.router)
app.include_router(files.router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "StudySynergy API v2.0",
        "auth": "JWT",
        "database": "Firestore",
        "storage": "Local"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )