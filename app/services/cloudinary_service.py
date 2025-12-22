"""
Service pour gérer l'upload de fichiers vers Cloudinary.
"""
import cloudinary
import cloudinary.uploader
from app.config import settings
from typing import Dict
import io
import re
import unicodedata

# Configurer Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


class CloudinaryService:
    """
    Service centralisé pour Cloudinary.
    """

    @staticmethod
    def upload_file(file_content: bytes, file_name: str, session_id: str) -> Dict[str, str]:
        try:
            file_buffer = io.BytesIO(file_content)

            # Simple solution : utiliser uniquement le nom de fichier original
            # Cloudinary gérera automatiquement les caractères spéciaux
            result = cloudinary.uploader.upload(
                file_buffer,
                folder=f"studysynergy/sessions/{session_id}",
                resource_type="auto",
                # Ne pas spécifier public_id explicitement
                # Laisser Cloudinary gérer le nom
                use_filename=False,  # Important : ne pas utiliser le nom de fichier comme base
                unique_filename=True,  # Générer un nom unique
                overwrite=False
            )

            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "format": result.get("format", ""),
                "resource_type": result.get("resource_type", "")
            }

        except Exception as e:
            # Ajouter plus d'informations pour debug
            print(f"Upload error details:")
            print(f"  File name: {file_name}")
            print(f"  Session ID: {session_id}")
            print(f"  Error: {str(e)}")
            raise Exception(f"Erreur lors de l'upload vers Cloudinary: {str(e)}")

    @staticmethod
    def delete_file(public_id: str, resource_type: str = "auto"):
        """
        Supprime un fichier de Cloudinary.

        Args:
            public_id: ID public du fichier dans Cloudinary
            resource_type: Type de ressource (image, video, raw, auto)
        """
        try:
            if resource_type == "auto":
                # Essayer les différents types
                for rtype in ["image", "video", "raw"]:
                    try:
                        result = cloudinary.uploader.destroy(public_id, resource_type=rtype)
                        if result.get("result") == "ok":
                            return
                    except:
                        continue
            else:
                cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception as e:
            print(f"Erreur lors de la suppression: {str(e)}")

    @staticmethod
    def delete_session_folder(session_id: str):
        """
        Supprime tous les fichiers d'une session.

        Args:
            session_id: ID de la session
        """
        try:
            # Supprimer le dossier et tout son contenu
            folder_path = f"studysynergy/sessions/{session_id}"

            # Cloudinary nécessite de supprimer les fichiers un par un
            # puis le dossier
            cloudinary.api.delete_resources_by_prefix(folder_path)
            cloudinary.api.delete_folder(folder_path)
        except Exception as e:
            print(f"Erreur lors de la suppression du dossier: {str(e)}")

    @staticmethod
    def get_file_url(public_id: str) -> str:
        """
        Récupère l'URL d'un fichier depuis son public_id.

        Args:
            public_id: ID public du fichier

        Returns:
            URL sécurisée du fichier
        """
        return cloudinary.CloudinaryImage(public_id).build_url(secure=True)


cloudinary_service = CloudinaryService()