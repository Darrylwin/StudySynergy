"""
Routes API pour servir les fichiers uploadés.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from app.services.firebase_service import firebase_service
from app.auth import verify_firebase_token
from pathlib import Path

router = APIRouter(prefix="/api/files", tags=["Files"])


@router.get("/{session_id}/{filename}")
async def get_file(
        session_id: str,
        filename: str,
        user: dict = Depends(verify_firebase_token)
):
    """
    Récupère un fichier uploadé.

    Sécurité : Vérifie que l'utilisateur a accès à cette session.
    """
    # Vérifier que l'utilisateur a accès à cette session
    session = firebase_service.get_session(session_id)
    if not session or session['userId'] != user['uid']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied"
        )

    # Récupérer le fichier
    file_path = firebase_service.get_file_path(session_id, filename)

    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Retourner le fichier
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )