"""
Routes API pour la gestion des sessions d'apprentissage.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Request
from fastapi.responses import FileResponse
from app.auth import verify_firebase_token
from app.models import (
    CreateSessionRequest, CreateSessionResponse,
    UploadFileResponse, GenerateInitialResponse,
    ChatRequest, ChatResponse
)
from app.services.firebase_service import firebase_service
from app.services.gemini_service import gemini_service
from app.config import settings
import tempfile
import os
import uuid

router = APIRouter(prefix="/api/session", tags=["Sessions"])

@router.post("/create", response_model=CreateSessionResponse)
async def create_session(
    request: CreateSessionRequest,
    user:  dict = Depends(verify_firebase_token)
):
    """
    Crée une nouvelle session d'apprentissage SANS titre (généré automatiquement par l'IA plus tard).

    Retourne le session_id.
    """
    user_id = user['uid']

    # Créer la session dans Firestore (sans titre, il sera généré plus tard)
    session_id = firebase_service.create_session(user_id)

    return CreateSessionResponse(session_id=session_id)

@router.post("/{session_id}/upload", response_model=UploadFileResponse)
async def upload_file(
    session_id: str,
    request: Request,  # NOUVEAU : Pour obtenir l'URL de base
    file: UploadFile = File(...),
    user: dict = Depends(verify_firebase_token)
):
    """
    Upload un fichier (PDF, Audio, Image) pour une session.

    Processus :
    1. Validation de la taille du fichier
    2. Stockage local dans uploads/sessions/{session_id}/
    3. Upload vers Gemini File API (pour analyse IA)
    4. Sauvegarde des métadonnées dans Firestore

    Retourne le file_id et l'URL pour accéder au fichier.
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
    file_size = len(file_content)

    # Validation de la taille
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status. HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large.  Maximum size: {settings.MAX_FILE_SIZE_MB} MB"
        )

    # Générer un ID unique pour ce fichier
    file_id = str(uuid.uuid4())

    # Obtenir l'URL de base dynamiquement depuis la requête
    base_url = str(request.base_url).rstrip('/')

    # 1. Sauvegarder localement
    local_path, file_url = firebase_service.save_file_locally(
        file_content,
        file. filename,
        session_id,
        file_id,
        base_url  # NOUVEAU : Passé dynamiquement
    )

    # 2. Upload vers Gemini File API
    try:
        gemini_uri = gemini_service.upload_file(local_path, file. content_type)
    except Exception as e:
        # Si Gemini échoue, on supprime le fichier local
        os.unlink(local_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload to Gemini: {str(e)}"
        )

    # 3. Sauvegarder les métadonnées dans Firestore
    firebase_service.save_file_metadata(
        session_id,
        file. filename,
        file_url,  # URL pour accéder au fichier via l'API
        gemini_uri,
        file. content_type,
        file_size
    )

    return UploadFileResponse(file_id=file_id, file_url=file_url)

@router.post("/{session_id}/generate-initial", response_model=GenerateInitialResponse)
async def generate_initial_summary(
    session_id: str,
    user: dict = Depends(verify_firebase_token)
):
    """
    Génère le TITRE et le résumé global introductif de la session.

    L'IA analyse les documents et :
    1. Génère un titre descriptif automatiquement
    2. Génère un résumé global
    3. Met à jour la session dans Firestore
    4. Change le status à "ready"

    Appelé automatiquement par le frontend quand tous les uploads sont finis.
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

    # Générer le TITRE et le RÉSUMÉ avec l'IA
    title, summary = gemini_service.generate_title_and_summary(gemini_files)

    # Sauvegarder dans Firestore
    firebase_service.update_session(session_id, {
        'title': title,  # NOUVEAU : Titre généré par l'IA
        'globalSummary': summary,
        'status': 'ready'
    })

    return GenerateInitialResponse(title=title, summary=summary)

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
    session = firebase_service. get_session(session_id)
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