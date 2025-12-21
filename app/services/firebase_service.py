"""
Service pour interagir avec Firebase (Firestore + Storage).
"""
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from app.config import settings
from datetime import datetime
from typing import Optional, List, Dict
import uuid

# Initialiser Firebase Admin SDK (une seule fois)
cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
firebase_admin.initialize_app(cred, {
    'storageBucket': settings.FIREBASE_STORAGE_BUCKET
})

# Clients globaux
db = firestore.client()
bucket = storage.bucket()


class FirebaseService:
    """
    Service centralisé pour Firebase.
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
    def create_session(user_id: str, title: str) -> str:
        """
        Crée une nouvelle session dans Firestore.
        Retourne le session_id.
        """
        session_ref = db.collection('sessions').document()
        session_id = session_ref.id

        session_ref.set({
            'userId': user_id,
            'title': title,
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
                           storage_url: str, gemini_uri: str,
                           mime_type: str) -> str:
        """
        Sauvegarde les métadonnées d'un fichier uploadé.
        Retourne le file_id.
        """
        file_ref = db.collection('sessions').document(session_id) \
            .collection('files').document()
        file_id = file_ref.id

        file_ref.set({
            'fileName': file_name,
            'storageUrl': storage_url,
            'geminiUri': gemini_uri,
            'mimeType': mime_type,
            'uploadedAt': firestore.SERVER_TIMESTAMP
        })

        return file_id

    @staticmethod
    def get_session_files(session_id: str) -> List[dict]:
        """
        Récupère tous les fichiers d'une session.
        """
        files_ref = db.collection('sessions').document(session_id) \
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
        artifact_ref = db.collection('sessions').document(session_id) \
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
        doc = db.collection('sessions').document(session_id) \
            .collection('artifacts').document(tool_type).get()

        if doc.exists:
            return doc.to_dict().get('content')
        return None

    @staticmethod
    def upload_to_storage(file_content: bytes, file_name: str,
                          session_id: str) -> str:
        """
        Upload un fichier sur Firebase Storage.
        Retourne l'URL publique.
        """
        # Créer un chemin unique :  sessions/{sessionId}/{uuid}_{fileName}
        unique_name = f"{uuid.uuid4()}_{file_name}"
        blob_path = f"sessions/{session_id}/{unique_name}"

        blob = bucket.blob(blob_path)
        blob.upload_from_string(file_content)

        # Rendre le fichier accessible publiquement (optionnel)
        blob.make_public()

        return blob.public_url


firebase_service = FirebaseService()
