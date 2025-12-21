"""
Routes API pour la génération d'outils pédagogiques (quiz, flashcards, notes).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import verify_firebase_token
from app.models import GenerateToolRequest, GenerateToolResponse
from app.services.firebase_service import firebase_service
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/session", tags=["Tools"])


@router.post("/{session_id}/generate-tool", response_model=GenerateToolResponse)
async def generate_tool(
        session_id: str,
        request: GenerateToolRequest,
        user: dict = Depends(verify_firebase_token)
):
    """
    Génère un outil pédagogique (quiz, flashcards, notes détaillées).

    - **tool_type**: "quiz", "flashcards" ou "detailed_notes"
    - **focus_section**: (Optionnel) Section spécifique du cours sur laquelle se concentrer

    Processus :
    1. Vérifie si l'artefact existe déjà en cache (Firestore)
    2. Si oui, le retourne immédiatement
    3. Sinon, génère avec Gemini et sauvegarde en cache
    """
    # Vérifier l'accès
    session = firebase_service.get_session(session_id)
    if not session or session['userId'] != user['uid']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied"
        )

    # Vérifier que la session est prête
    if session['status'] != 'ready':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not ready yet.  Please generate initial summary first."
        )

    # 1. Vérifier si l'artefact existe déjà
    cached_artifact = firebase_service.get_artifact(session_id, request.tool_type)
    if cached_artifact:
        return GenerateToolResponse(content=cached_artifact)

    # 2. Récupérer les fichiers pour Gemini
    files = firebase_service.get_session_files(session_id)
    gemini_files = [
        {"file_uri": f['geminiUri'], "mime_type": f['mimeType']}
        for f in files
    ]

    # 3. Générer selon le type d'outil
    if request.tool_type == "quiz":
        content = gemini_service.generate_quiz(gemini_files, request.focus_section)
    elif request.tool_type == "flashcards":
        content = gemini_service.generate_flashcards(gemini_files, request.focus_section)
    elif request.tool_type == "detailed_notes":
        content = gemini_service.generate_detailed_notes(gemini_files, request.focus_section)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown tool_type: {request.tool_type}"
        )

    # 4. Sauvegarder en cache
    firebase_service.save_artifact(session_id, request.tool_type, content)

    return GenerateToolResponse(content=content)