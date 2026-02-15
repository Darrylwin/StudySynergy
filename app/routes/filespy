from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.auth import get_current_user
from app.services.firebase_service import firebase_service

router = APIRouter(prefix="/api/files", tags=["Files"])

@router.get("/{session_id}/{filename}")
async def get_file_by_name(
    session_id: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    session = firebase_service.get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    files = firebase_service.get_session_files(session_id)

    # Cherche par nom de fichier
    file = next((f for f in files if f['fileName'] == filename), None)

    if not file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    return RedirectResponse(url=file['fileUrl'])