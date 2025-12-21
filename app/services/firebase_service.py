"""
Service pour interagir avec Firebase (Firestore uniquement).
Le stockage des fichiers est géré localement.
"""
import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.config import settings
from datetime import datetime
from typing import Optional, List, Dict
import uuid
import shutil
from pathlib import Path

# Initialiser Firebase Admin SDK (une seule fois)
cred = credentials.Certificate(settings. FIREBASE_CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)

# Client Firestore global
db = firestore.client()

class FirebaseService:
    """
    Service centralisé pour Firebase (Firestore + Auth uniquement).
    """

    @staticmethod
    def verify_token(token: str) -> dict:
        """
        Vérifie le token Firebase du user et retourne les infos.
        Lève une exception si invalide.
        """
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token  # Contient 'uid', 'email', etc.
        except Exception as e:
            raise ValueError(f"Token invalide: {str(e)}")

    @staticmethod
    def create_session(user_id: str) -> str:
        """
        Crée une nouvelle session dans Firestore SANS titre (généré plus tard par l'IA).
        Retourne le session_id.
        """
        session_ref = db.collection('sessions').document()
        session_id = session_ref.id

        session_ref.set({
            'userId': user_id,
            'title': 'Session en cours de création.. .',  # Titre temporaire
            'createdAt': firestore.SERVER_TIMESTAMP,
            'status': 'processing',
            'globalSummary': ''
        })

        return session_id

    @staticmethod
    def get_session(session_id: str) -> Optional[dict]:
        """Récupère une session par son ID"""
        doc = db.collection('sessions').document(session_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    @staticmethod
    def update_session(session_id: str, data: dict):
        """Met à jour une session"""
        db.collection('sessions').document(session_id).update(data)

    @staticmethod
    def save_file_metadata(session_id: str, file_name: str,
                          file_url: str, gemini_uri: str,
                          mime_type: str, file_size: int) -> str:
        """
        Sauvegarde les métadonnées d'un fichier uploadé.
        Retourne le file_id.
        """
        file_ref = db.collection('sessions').document(session_id)\
                     .collection('files').document()
        file_id = file_ref.id

        file_ref.set({
            'fileName': file_name,
            'fileUrl': file_url,  # URL pour accéder au fichier via l'API
            'geminiUri': gemini_uri,
            'mimeType': mime_type,
            'fileSize': file_size,
            'uploadedAt': firestore.SERVER_TIMESTAMP
        })

        return file_id

    @staticmethod
    def get_session_files(session_id: str) -> List[dict]:
        """
        Récupère tous les fichiers d'une session.
        """
        files_ref = db.collection('sessions').document(session_id)\
                      .collection('files').stream()

        return [
            {
                'fileId': f.id,
                **f.to_dict()
            }
            for f in files_ref
        ]

    @staticmethod
    def save_artifact(session_id: str, tool_type: str, content: dict):
        """
        Sauvegarde un artefact généré (quiz, flashcards, etc.).
        """
        artifact_ref = db.collection('sessions').document(session_id)\
                         .collection('artifacts').document(tool_type)

        artifact_ref.set({
            'content': content,
            'generatedAt': firestore.SERVER_TIMESTAMP
        })

    @staticmethod
    def get_artifact(session_id: str, tool_type: str) -> Optional[dict]:
        """
        Récupère un artefact s'il existe déjà.
        """
        doc = db.collection('sessions').document(session_id)\
                . collection('artifacts').document(tool_type).get()

        if doc.exists:
            return doc.to_dict().get('content')
        return None

    @staticmethod
    def save_file_locally(file_content: bytes, file_name: str,
                         session_id: str, file_id: str, base_url: str) -> tuple[str, str]:
        """
        Sauvegarde un fichier localement dans uploads/sessions/{session_id}/

        Args:
            file_content:  Contenu binaire du fichier
            file_name: Nom original du fichier
            session_id: ID de la session
            file_id: ID unique du fichier
            base_url: URL de base de la requête (ex: http://localhost:8000)

        Returns:
            Tuple (chemin_fichier_local, url_api)
        """
        # Créer le dossier de la session
        session_dir = settings.UPLOAD_DIR / "sessions" / session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        # Construire le nom de fichier :  {file_id}_{nom_original}
        safe_filename = f"{file_id}_{file_name}"
        file_path = session_dir / safe_filename

        # Sauvegarder le fichier
        with open(file_path, 'wb') as f:
            f.write(file_content)

        # Construire l'URL pour accéder au fichier via l'API (dynamique)
        file_url = f"{base_url}/api/files/{session_id}/{safe_filename}"

        return str(file_path), file_url

    @staticmethod
    def get_file_path(session_id: str, filename: str) -> Optional[Path]:
        """
        Récupère le chemin complet d'un fichier.
        Retourne None si le fichier n'existe pas.
        """
        file_path = settings.UPLOAD_DIR / "sessions" / session_id / filename

        if file_path.exists() and file_path.is_file():
            return file_path
        return None

    @staticmethod
    def delete_session_files(session_id: str):
        """
        Supprime tous les fichiers d'une session (pour nettoyage).
        """
        session_dir = settings.UPLOAD_DIR / "sessions" / session_id
        if session_dir.exists():
            shutil.rmtree(session_dir)

firebase_service = FirebaseService()
