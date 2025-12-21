"""
Fonctions utilitaires diverses.
"""
from typing import Optional


def format_file_size(size_bytes: int) -> str:
    """
    Formate une taille de fichier en octets vers un format lisible.

    Exemple:  1536 -> "1.5 KB"
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"


def get_mime_type_category(mime_type: str) -> str:
    """
    Retourne la catégorie d'un type MIME.

    Exemple: "application/pdf" -> "document"
    """
    if mime_type.startswith("image/"):
        return "image"
    elif mime_type.startswith("audio/"):
        return "audio"
    elif mime_type in ["application/pdf", "application/msword", "text/plain"]:
        return "document"
    else:
        return "other"