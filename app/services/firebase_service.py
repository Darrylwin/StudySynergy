"""
Service pour interagir avec Firestore uniquement.
"""
import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings
from typing import Optional, List, Dict
import uuid
import shutil
from pathlib import Path

# Initialiser Firebase Admin SDK
cred = credentials.Certificate(settings.  FIREBASE_CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)

# Client Firestore
db = firestore.  client()

class FirebaseService:
    """
    Service centralisé pour Firestore.
    """

    # ===== USERS =====

    @staticmethod
    def create_user(email: str, hashed_password: str, name:  str) -> str:
        """Crée un utilisateur dans Firestore"""
        user_ref = db.collection('users').document()
        user_id = user_ref.id

        user_ref.set({
            'email':  email,
            'password':   hashed_password,
            'name': name,
            'createdAt': firestore.SERVER_TIMESTAMP
        })

        return user_id

    @staticmethod
    def get_user_by_email(email: str) -> Optional[dict]:
        """Récupère un utilisateur par email"""
        users = db.collection('users').where(filter=firestore. FieldFilter('email', '==', email)).limit(1).stream()

        for user in users:
            return {'user_id': user.id, **user.to_dict()}
        return None

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[dict]:
        """Récupère un utilisateur par ID"""
        doc = db.collection('users').document(user_id).get()
        if doc.exists:
            return {'user_id': doc.id, **doc.to_dict()}
        return None

    @staticmethod
    def update_user_password(user_id: str, new_hashed_password: str):
        """Met à jour le mot de passe d'un utilisateur"""
        db.collection('users').document(user_id).update({'password': new_hashed_password})

    # ===== SESSIONS =====

    @staticmethod
    def create_session(user_id: str, title: str, summary: str) -> str:
        """Crée une session avec titre et résumé générés par l'IA"""
        session_ref = db.collection('sessions').document()
        session_id = session_ref.id

        session_ref.set({
            'userId': user_id,
            'title': title,
            'summary': summary,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'status': 'ready'
        })

        return session_id

    @staticmethod
    def get_session(session_id: str) -> Optional[dict]:
        """Récupère une session par ID"""
        doc = db.collection('sessions').document(session_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    @staticmethod
    def get_user_sessions(user_id: str) -> List[dict]:
        """Récupère toutes les sessions d'un utilisateur"""
        sessions = db.  collection('sessions')\
            .where(filter=firestore.FieldFilter('userId', '==', user_id))\
            .order_by('createdAt', direction=firestore. Query.DESCENDING)\
            .stream()

        return [{'session_id': s.id, **s.to_dict()} for s in sessions]

    @staticmethod
    def update_session(session_id: str, data: dict):
        """Met à jour une session"""
        db.collection('sessions').document(session_id).update(data)

    # ===== FILES =====

    @staticmethod
    def save_file_metadata(session_id: str, file_name: str, file_url: str,
                          gemini_uri: str, mime_type: str, file_size: int) -> str:
        """Sauvegarde les métadonnées d'un fichier"""
        file_ref = db. collection('sessions').document(session_id)\
                     .collection('files').document()
        file_id = file_ref.id

        file_ref.  set({
            'fileName': file_name,
            'fileUrl':  file_url,
            'geminiUri': gemini_uri,
            'mimeType':   mime_type,
            'fileSize': file_size,
            'uploadedAt': firestore.SERVER_TIMESTAMP
        })

        return file_id

    @staticmethod
    def get_session_files(session_id: str) -> List[dict]:
        """Récupère tous les fichiers d'une session"""
        files = db.collection('sessions').document(session_id)\
                  .collection('files').stream()

        return [{'file_id': f.id, **f. to_dict()} for f in files]

    # ===== ARTIFACTS =====

    @staticmethod
    def save_artifact(session_id: str, tool_type: str, content: dict):
        """Sauvegarde un artefact généré"""
        artifact_ref = db.  collection('sessions').document(session_id)\
                         .collection('artifacts').document(tool_type)

        artifact_ref.set({
            'content': content,
            'generatedAt': firestore.SERVER_TIMESTAMP
        })

    @staticmethod
    def get_artifact(session_id: str, tool_type: str) -> Optional[dict]:
        """Récupère un artefact s'il existe"""
        doc = db.collection('sessions').document(session_id)\
                .collection('artifacts').document(tool_type).get()

        if doc.exists:
            return doc.to_dict().get('content')
        return None

    @staticmethod
    def get_all_artifacts(session_id: str) -> dict:
        """
        Récupère tous les artefacts générés pour une session.

        Returns:
            Dict avec les artefacts disponibles:
            {
                "quiz": {...},
                "flashcards": {...},
                "detailed_notes": {...}
            }
        """
        artifacts_ref = db.collection('sessions').document(session_id)\
                          .collection('artifacts').stream()

        artifacts = {}
        for artifact in artifacts_ref:
            artifacts[artifact.id] = artifact. to_dict().get('content')

        return artifacts

    @staticmethod
    def clear_artifacts_cache(session_id: str):
        """
        Supprime tous les artefacts en cache d'une session.
        Utilisé quand on ajoute un nouveau fichier au contexte.
        """
        artifacts_ref = db.collection('sessions').document(session_id)\
                          .collection('artifacts').stream()

        for artifact in artifacts_ref:
            artifact.reference. delete()

    # ===== STOCKAGE LOCAL =====

    @staticmethod
    def save_file_locally(file_content: bytes, file_name: str,
                         session_id: str, file_id: str, base_url: str) -> tuple[str, str]:
        """Sauvegarde un fichier localement"""
        session_dir = settings.UPLOAD_DIR / "sessions" / session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        safe_filename = f"{file_id}_{file_name}"
        file_path = session_dir / safe_filename

        with open(file_path, 'wb') as f:
            f.  write(file_content)

        file_url = f"{base_url}/api/files/{session_id}/{safe_filename}"

        return str(file_path), file_url

    @staticmethod
    def get_file_path(session_id: str, filename: str) -> Optional[Path]:
        """Récupère le chemin d'un fichier"""
        file_path = settings.UPLOAD_DIR / "sessions" / session_id / filename

        if file_path.exists() and file_path.is_file():
            return file_path
        return None

    @staticmethod
    def delete_session_files(session_id: str):
        """Supprime tous les fichiers d'une session"""
        session_dir = settings.UPLOAD_DIR / "sessions" / session_id
        if session_dir.exists():
            shutil.rmtree(session_dir)

firebase_service = FirebaseService()