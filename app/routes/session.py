"""
Routes API pour la gestion des sessions d'apprentissage.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.auth import verify_firebase_token
from app.models import (
    CreateSessionRequest, CreateSessionResponse,
    UploadFileResponse, GenerateInitialResponse,
    ChatRequest, ChatResponse
)
from app.services.firebase_service import firebase_service
from app.services.gemini_service import gemini_service
import tempfile
import os

router = APIRouter(prefix="/api/session", tags=["Sessions"])


@router.post("/create", response_model=CreateSessionResponse)
async def create_session(
        request: CreateSessionRequest,
        user: dict = Depends(verify_firebase_token)
):
    """
    Crée une nouvelle session d'apprentissage.

    - **title**:  Titre du cours (ex: "Mathématiques - Algèbre")

    Retourne le session_id.
    """
    user_id = user['uid']

    # Créer la session dans Firestore
    session_id = firebase_service.create_session(user_id, request.title)

    return CreateSessionResponse(session_id=session_id)


@router.post("/{session_id}/upload", response_model=UploadFileResponse)
async def upload_file(
        session_id: str,
        file: UploadFile = File(...),
        user: dict = Depends(verify_firebase_token)
):
    """
    Upload un fichier (PDF, Audio, Image) pour une session.

    Processus :
    1. Upload vers Firebase Storage (archive long terme)
    2. Upload vers Gemini File API (pour analyse IA)
    3. Sauvegarde des métadonnées dans Firestore

    Retourne le file_id.
    """
    # Vérifier que la session appartient bien au user
    session = firebase_service.get_session(session_id)
    if not session or session['userId'] != user['uid']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied"
        )

    # Lire le contenu du fichier
    file_content = await file.read()

    # 1. Upload vers Firebase Storage
    storage_url = firebase_service.upload_to_storage(
        file_content,
        file.filename,
        session_id
    )

    # 2. Upload vers Gemini File API
    # Pour cela, on doit sauvegarder temporairement le fichier sur disque
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        gemini_uri = gemini_service.upload_file(tmp_path, file.content_type)
    finally:
        # Nettoyer le fichier temporaire
        os.unlink(tmp_path)

    # 3. Sauvegarder les métadonnées dans Firestore
    file_id = firebase_service.save_file_metadata(
        session_id,
        file.filename,
        storage_url,
        gemini_uri,
        file.content_type
    )

    return UploadFileResponse(file_id=file_id)


@router.post("/{session_id}/generate-initial", response_model=GenerateInitialResponse)
async def generate_initial_summary(
        session_id: str,
        user: dict = Depends(verify_firebase_token)
):
    """
    Génère le résumé global introductif de la session.

    Appelé automatiquement par le frontend quand tous les uploads sont finis.

    Processus :
    1. Récupère tous les fichiers de la session
    2. Appelle Gemini pour générer le résumé
    3. Sauvegarde le résumé dans Firestore
    4. Met à jour le status de la session à "ready"
    """
    # Vérifier l'accès
    session = firebase_service.get_session(session_id)
    if not session or session['userId'] != user['uid']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied"
        )

    # Récupérer tous les fichiers
    files = firebase_service.get_session_files(session_id)

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded yet"
        )

    # Préparer les fichiers pour Gemini
    gemini_files = [
        {
            "file_uri": f['geminiUri'],
            "mime_type": f['mimeType']
        }
        for f in files
    ]

    # Générer le résumé
    summary = gemini_service.generate_global_summary(gemini_files)

    # Sauvegarder dans Firestore
    firebase_service.update_session(session_id, {
        'globalSummary': summary,
        'status': 'ready'
    })

    return GenerateInitialResponse(summary=summary)


@router.post("/{session_id}/chat", response_model=ChatResponse)
async def chat_about_course(
        session_id: str,
        request: ChatRequest,
        user: dict = Depends(verify_firebase_token)
):
    """
    Permet de discuter avec l'IA à propos du cours.

    L'IA ne répond QU'aux questions liées au contenu des fichiers uploadés.
    """
    # Vérifier l'accès
    session = firebase_service.get_session(session_id)
    if not session or session['userId'] != user['uid']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied"
        )

    # Récupérer les fichiers
    files = firebase_service.get_session_files(session_id)

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded yet"
        )

    gemini_files = [
        {"file_uri": f['geminiUri'], "mime_type": f['mimeType']}
        for f in files
    ]

    # Appeler Gemini
    response_text = gemini_service.chat_about_course(gemini_files, request.message)

    return ChatResponse(response=response_text)