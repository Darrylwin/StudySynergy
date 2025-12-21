"""
Routes pour la gestion des sessions d'apprentissage.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Request
from typing import List
from app.auth import get_current_user
from app.models import (
    UploadFileResponse, CreateSessionResponse,
    SessionListResponse, SessionDetailResponse,
    ChatRequest, ChatResponse
)
from app.services.firebase_service import firebase_service
from app.services. gemini_service import gemini_service
from app.config import settings
import uuid
import os

router = APIRouter(prefix="/api/session", tags=["Sessions"])

@router.post("/create", response_model=CreateSessionResponse)
async def create_session(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Crée une session en uploadant des fichiers.

    **Flow complet:**
    1. User uploade ses fichiers de cours (PDF, images, audio, etc.)
    2. Fichiers sauvegardés localement
    3. Fichiers envoyés à Gemini pour analyse
    4. L'IA génère automatiquement le TITRE et le RÉSUMÉ
    5. Session créée avec toutes les infos

    **Pas de titre manuel, tout est automatique ! **
    """
    user_id = current_user['user_id']
    base_url = str(request.base_url).rstrip('/')

    # Créer un ID de session temporaire
    temp_session_id = str(uuid.uuid4())

    uploaded_files = []
    local_paths = []

    try:
        # 1. Upload tous les fichiers
        for file in files:
            # Lire le fichier
            file_content = await file.read()
            file_size = len(file_content)

            # Validation
            if file_size > settings.MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Fichier trop volumineux: {file.filename}. Max: {settings.MAX_FILE_SIZE_MB} MB"
                )

            file_id = str(uuid.uuid4())

            # Sauvegarder localement
            local_path, file_url = firebase_service.save_file_locally(
                file_content, file.filename, temp_session_id, file_id, base_url
            )

            local_paths.append(local_path)

            # Upload vers Gemini
            gemini_uri = gemini_service.upload_file(local_path, file.content_type)

            uploaded_files.append({
                'file_id': file_id,
                'file_name': file.filename,
                'file_size': file_size,
                'file_url': file_url,
                'gemini_uri':  gemini_uri,
                'mime_type': file.content_type
            })

        # 2. Préparer les fichiers pour Gemini
        gemini_files = [
            {'file_uri': f['gemini_uri'], 'mime_type': f['mime_type']}
            for f in uploaded_files
        ]

        # 3. Générer TITRE + RÉSUMÉ avec l'IA
        title, summary = gemini_service.generate_title_and_summary(gemini_files)

        # 4. Créer la session dans Firestore avec le vrai titre
        session_id = firebase_service.create_session(user_id, title, summary)

        # 5. Renommer le dossier temporaire
        old_dir = settings.UPLOAD_DIR / "sessions" / temp_session_id
        new_dir = settings.UPLOAD_DIR / "sessions" / session_id
        old_dir.rename(new_dir)

        # 6. Sauvegarder les métadonnées des fichiers
        for f in uploaded_files:
            # Mettre à jour l'URL avec le vrai session_id
            f['file_url'] = f['file_url'].replace(temp_session_id, session_id)

            firebase_service.save_file_metadata(
                session_id, f['file_name'], f['file_url'],
                f['gemini_uri'], f['mime_type'], f['file_size']
            )

        return CreateSessionResponse(
            session_id=session_id,
            title=title,
            summary=summary,
            files=[
                {
                    'file_id':  f['file_id'],
                    'file_name': f['file_name'],
                    'file_size': f['file_size'],
                    'file_url': f['file_url']
                }
                for f in uploaded_files
            ]
        )

    except Exception as e:
        # En cas d'erreur, nettoyer les fichiers
        for path in local_paths:
            if os.path.exists(path):
                os.unlink(path)

        firebase_service.delete_session_files(temp_session_id)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la session: {str(e)}"
        )

@router.get("/list", response_model=SessionListResponse)
async def list_sessions(current_user: dict = Depends(get_current_user)):
    """
    Liste toutes les sessions de l'utilisateur connecté.
    """
    sessions = firebase_service.get_user_sessions(current_user['user_id'])

    return SessionListResponse(sessions=sessions)

@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(
    session_id:  str,
    current_user:  dict = Depends(get_current_user)
):
    """
    Récupère les détails d'une session.
    """
    session = firebase_service.get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status. HTTP_404_NOT_FOUND,
            detail="Session non trouvée"
        )

    files = firebase_service.get_session_files(session_id)

    return SessionDetailResponse(
        session_id=session_id,
        title=session['title'],
        summary=session['summary'],
        status=session['status'],
        created_at=str(session.get('createdAt', '')),
        files=files
    )

@router.post("/{session_id}/chat", response_model=ChatResponse)
async def chat_about_course(
    session_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Discuter avec l'IA à propos du cours.

    L'IA répond uniquement aux questions liées au contenu des fichiers.
    """
    session = firebase_service.get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session non trouvée"
        )

    files = firebase_service.get_session_files(session_id)

    gemini_files = [
        {'file_uri': f['geminiUri'], 'mime_type':  f['mimeType']}
        for f in files
    ]

    response_text = gemini_service.chat_about_course(gemini_files, request.message)

    return ChatResponse(response=response_text)