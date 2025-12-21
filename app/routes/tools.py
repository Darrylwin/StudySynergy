"""
Routes pour la génération d'outils pédagogiques.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.models import GenerateToolRequest, GenerateToolResponse
from app.services.firebase_service import firebase_service
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/session", tags=["Tools"])

@router.post("/{session_id}/generate-tool", response_model=GenerateToolResponse)
async def generate_tool(
    session_id: str,
    request: GenerateToolRequest,
    current_user:  dict = Depends(get_current_user)
):
    """
    Génère un outil pédagogique (quiz, flashcards, notes).

    - **tool_type**: "quiz", "flashcards" ou "detailed_notes"
    - **focus_section**: (Optionnel) Section spécifique
    """
    session = firebase_service. get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session non trouvée"
        )

    # Vérifier le cache
    cached_artifact = firebase_service.get_artifact(session_id, request.tool_type)
    if cached_artifact:
        return GenerateToolResponse(content=cached_artifact)

    # Récupérer les fichiers
    files = firebase_service.get_session_files(session_id)
    gemini_files = [
        {'file_uri': f['geminiUri'], 'mime_type':  f['mimeType']}
        for f in files
    ]

    # Générer selon le type
    if request.tool_type == "quiz":
        content = gemini_service.generate_quiz(gemini_files, request.focus_section)
    elif request.tool_type == "flashcards":
        content = gemini_service.generate_flashcards(gemini_files, request.focus_section)
    elif request.tool_type == "detailed_notes":
        content = gemini_service.generate_detailed_notes(gemini_files, request.focus_section)

    # Sauvegarder en cache
    firebase_service.save_artifact(session_id, request.tool_type, content)

    return GenerateToolResponse(content=content)