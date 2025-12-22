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

            # Déterminer le resource_type basé sur l'extension
            file_ext = file_name.lower().split('.')[-1] if '.' in file_name else ''

            # Types qui doivent être traités comme 'raw' (non-images)
            raw_types = {'pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar'}

            if file_ext in raw_types:
                resource_type = "raw"
                # Pour les fichiers raw, il faut spécifier le filename avec extension
                result = cloudinary.uploader.upload(
                    file_buffer,
                    folder=f"studysynergy/sessions/{session_id}",
                    resource_type=resource_type,
                    use_filename=True,  # IMPORTANT: pour conserver le nom
                    unique_filename=True,
                    overwrite=False,
                    filename_override=file_name  # Force l'utilisation du nom de fichier
                )
            else:
                resource_type = "auto"
                result = cloudinary.uploader.upload(
                    file_buffer,
                    folder=f"studysynergy/sessions/{session_id}",
                    resource_type=resource_type,
                    use_filename=False,
                    unique_filename=True,
                    overwrite=False
                )

            print(f"DEBUG - Upload successful: {result['public_id']}")

            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "format": result.get("format", ""),
                "resource_type": result["resource_type"]
            }

        except Exception as e:
            print(f"DEBUG - Full error: {e}")
            import traceback
            traceback.print_exc()
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