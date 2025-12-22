"""
Routes pour la gestion des sessions d'apprentissage.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import List
from app.auth import get_current_user
from app.models import (
    CreateSessionResponse, AddFileResponse,
    SessionListResponse, SessionDetailResponse,
    ChatRequest, ChatResponse
)
from app.services.firebase_service import firebase_service
from app.services.cloudinary_service import cloudinary_service
from app.services.gemini_service import gemini_service
from app.config import settings
import uuid
import tempfile
import os

router = APIRouter(prefix="/api/session", tags=["Sessions"])


@router.post("/create", response_model=CreateSessionResponse)
async def create_session(
        files: List[UploadFile] = File(...),
        current_user: dict = Depends(get_current_user)
):
    """
    Crée une session en uploadant des fichiers.

    **Flow complet:**
    1. User uploade ses fichiers de cours (PDF, images, audio, etc.)
    2. Fichiers uploadés vers Cloudinary
    3. Fichiers envoyés à Gemini pour analyse
    4. L'IA génère automatiquement le TITRE et le RÉSUMÉ
    5. Session créée avec toutes les infos
    """
    user_id = current_user['user_id']
    temp_session_id = str(uuid.uuid4())
    uploaded_files = []
    temp_file_paths = []

    try:
        # 1. Upload tous les fichiers
        for file in files:
            file_content = await file.read()
            file_size = len(file_content)

            if file_size > settings.MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Fichier trop volumineux: {file.filename}. Max: {settings.MAX_FILE_SIZE_MB} MB"
                )

            # Upload vers Cloudinary
            cloudinary_result = cloudinary_service.upload_file(
                file_content, file.filename, temp_session_id
            )

            # Créer un fichier temporaire pour Gemini
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
                tmp.write(file_content)
                temp_path = tmp.name
                temp_file_paths.append(temp_path)

            # Upload vers Gemini
            gemini_uri = gemini_service.upload_file(temp_path, file.content_type)

            uploaded_files.append({
                'file_name': file.filename,
                'file_size': file_size,
                'file_url': cloudinary_result['url'],
                'cloudinary_public_id': cloudinary_result['public_id'],
                'gemini_uri': gemini_uri,
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

        # 5. Mettre à jour les public_ids Cloudinary avec le vrai session_id
        for f in uploaded_files:
            # Récupérer le nouveau public_id avec le bon session_id
            old_public_id = f['cloudinary_public_id']
            new_folder = f"studysynergy/sessions/{session_id}"

            # Cloudinary: déplacer le fichier vers le bon dossier
            try:
                result = cloudinary_service.cloudinary.uploader.rename(
                    old_public_id,
                    f"{new_folder}/{old_public_id.split('/')[-1]}"
                )
                f['cloudinary_public_id'] = result['public_id']
                f['file_url'] = result['secure_url']
            except:
                # Si le rename échoue, on garde l'ancien (pas critique)
                pass

        # 6. Sauvegarder les métadonnées des fichiers
        for f in uploaded_files:
            firebase_service.save_file_metadata(
                session_id,
                f['file_name'],
                f['file_url'],
                f['cloudinary_public_id'],
                f['gemini_uri'],
                f['mime_type'],
                f['file_size']
            )

        return CreateSessionResponse(
            session_id=session_id,
            title=title,
            summary=summary,
            files=[
                {
                    'file_id': str(uuid.uuid4()),
                    'file_name': f['file_name'],
                    'file_size': f['file_size'],
                    'file_url': f['file_url']
                }
                for f in uploaded_files
            ]
        )

    except Exception as e:
        # Nettoyer Cloudinary en cas d'erreur
        cloudinary_service.delete_session_folder(temp_session_id)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la session: {str(e)}"
        )
    finally:
        # Nettoyer les fichiers temporaires
        for temp_path in temp_file_paths:
            try:
                os.unlink(temp_path)
            except:
                pass


@router.post("/{session_id}/add-file", response_model=AddFileResponse)
async def add_file_to_session(
        session_id: str,
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user)
):
    """
    Ajoute un fichier à une session existante.

    Le fichier sera ajouté au contexte de la session et sera pris en compte
    pour les discussions avec l'IA et la génération d'outils pédagogiques.
    """
    session = firebase_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session non trouvée"
        )

    if session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cette session"
        )

    temp_path = None
    try:
        file_content = await file.read()
        file_size = len(file_content)

        if file_size > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Fichier trop volumineux: {file.filename}. Max: {settings.MAX_FILE_SIZE_MB} MB"
            )

        # Upload vers Cloudinary
        cloudinary_result = cloudinary_service.upload_file(
            file_content, file.filename, session_id
        )

        # Créer un fichier temporaire pour Gemini
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            tmp.write(file_content)
            temp_path = tmp.name

        # Upload vers Gemini
        try:
            gemini_uri = gemini_service.upload_file(temp_path, file.content_type)
        except Exception as e:
            cloudinary_service.delete_file(cloudinary_result['public_id'])
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de l'upload vers Gemini: {str(e)}"
            )

        # Sauvegarder les métadonnées
        file_id = firebase_service.save_file_metadata(
            session_id,
            file.filename,
            cloudinary_result['url'],
            cloudinary_result['public_id'],
            gemini_uri,
            file.content_type,
            file_size
        )

        # Invalider le cache des artefacts
        firebase_service.clear_artifacts_cache(session_id)

        return AddFileResponse(
            file_id=file_id,
            file_name=file.filename,
            file_size=file_size,
            file_url=cloudinary_result['url'],
            session_id=session_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'ajout du fichier: {str(e)}"
        )
    finally:
        # Nettoyer le fichier temporaire
        if temp_path:
            try:
                os.unlink(temp_path)
            except:
                pass


@router.get("/list", response_model=SessionListResponse)
async def list_sessions(current_user: dict = Depends(get_current_user)):
    """Liste toutes les sessions de l'utilisateur connecté."""
    sessions = firebase_service.get_user_sessions(current_user['user_id'])
    return SessionListResponse(sessions=sessions)


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(
        session_id: str,
        current_user: dict = Depends(get_current_user)
):
    """Récupère les détails d'une session."""
    session = firebase_service.get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
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


@router.delete("/{session_id}")
async def delete_session(
        session_id: str,
        current_user: dict = Depends(get_current_user)
):
    """Supprime une session et tous ses fichiers."""
    session = firebase_service.get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session non trouvée"
        )

    try:
        firebase_service.delete_session(session_id)
        return {"message": "Session supprimée avec succès"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression: {str(e)}"
        )


@router.post("/{session_id}/chat", response_model=ChatResponse)
async def chat_about_course(
        session_id: str,
        request: ChatRequest,
        current_user: dict = Depends(get_current_user)
):
    """Discuter avec l'IA à propos du cours."""
    session = firebase_service.get_session(session_id)

    if not session or session['userId'] != current_user['user_id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session non trouvée"
        )

    files = firebase_service.get_session_files(session_id)

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun fichier dans cette session"
        )

    gemini_files = [
        {'file_uri': f['geminiUri'], 'mime_type': f['mimeType']}
        for f in files
    ]

    response_text = gemini_service.chat_about_course(gemini_files, request.message)

    return ChatResponse(response=response_text)