"""
Modèles Pydantic pour valider les données.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Literal, Optional, List
from datetime import datetime

# ===== AUTH =====

class RegisterRequest(BaseModel):
    """Inscription d'un nouvel utilisateur"""
    email:   EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=100)

class LoginRequest(BaseModel):
    """Connexion"""
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    """Changement de mot de passe"""
    old_password: str
    new_password: str = Field(..., min_length=8)

class AuthResponse(BaseModel):
    """Réponse après connexion/inscription"""
    access_token:   str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    """Informations utilisateur"""
    user_id: str
    email:   str
    name: str
    created_at: str

# ===== SESSIONS =====

class UploadFileResponse(BaseModel):
    """Réponse après upload d'un fichier"""
    file_id: str
    file_name: str
    file_size: int
    file_url: str

class AddFileResponse(BaseModel):
    """Réponse après ajout d'un fichier à une session existante"""
    file_id:   str
    file_name:  str
    file_size: int
    file_url: str
    session_id: str
    message: str = "Fichier ajouté avec succès au contexte de la session"

class CreateSessionResponse(BaseModel):
    """Réponse après création de session (avec titre et résumé générés par l'IA)"""
    session_id: str
    title: str
    summary: str
    files: List[dict]

class SessionListResponse(BaseModel):
    """Liste des sessions de l'utilisateur"""
    sessions:   List[dict]

class SessionDetailResponse(BaseModel):
    """Détails d'une session"""
    session_id: str
    title:   str
    summary: str
    status: str
    created_at:   str
    files: List[dict]

# ===== TOOLS =====

class GenerateToolRequest(BaseModel):
    """Demande de génération d'un outil"""
    tool_type:   Literal["quiz", "flashcards", "detailed_notes"]
    focus_section: Optional[str] = None

class GenerateToolResponse(BaseModel):
    """Réponse avec le contenu généré"""
    content: dict

class SessionArtifactsResponse(BaseModel):
    """Réponse avec tous les artefacts d'une session"""
    session_id: str
    artifacts:  dict  # {"quiz": {... }, "flashcards": {...}, "detailed_notes": {...}}

# ===== CHAT =====

class ChatRequest(BaseModel):
    """Message de chat"""
    message: str = Field(..., min_length=1)

class ChatResponse(BaseModel):
    """Réponse du chat"""
    response: str