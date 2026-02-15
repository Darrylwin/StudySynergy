from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.services.firebase_service import firebase_service

router = APIRouter(prefix="/api/files", tags=["Files"])

@router.get("/{session_id}/{filename}")
async def get_file_by_name(session_id: str, filename: str):
    files = firebase_service.get_session_files(session_id)
    file = next((f for f in files if f['fileName'] == filename), None)

    if not file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    return RedirectResponse(url=file['fileUrl'])