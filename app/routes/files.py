"""
Routes pour servir les fichiers uploadés.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from app.services.firebase_service import firebase_service
from app.auth import get_current_user

router = APIRouter(prefix="/api/files", tags=["Files"])

@router.get("/{session_id}/{filename}")
async def get_file(
    session_id: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère un fichier uploadé.
    """
    session = firebase_service. get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session non trouvée"
        )

    file_path = firebase_service.get_file_path(session_id, filename)

    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )

    return FileResponse(path=file_path, filename=filename)