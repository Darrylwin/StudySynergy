"""
Modèles Pydantic pour valider les données des requêtes/réponses.
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


# ===== REQUÊTES (Input) =====

class CreateSessionRequest(BaseModel):
    """Données pour créer une nouvelle session"""
    title: str = Field(..., min_length=1, max_length=200)


class GenerateToolRequest(BaseModel):
    """Demande de génération d'un outil (quiz, flashcards, etc.)"""
    tool_type: Literal["quiz", "flashcards", "detailed_notes"]
    focus_section: Optional[str] = None  # Section spécifique du cours (optionnel)


class ChatRequest(BaseModel):
    """Message de chat pour discuter du cours"""
    message: str = Field(..., min_length=1)


# ===== RÉPONSES (Output) =====

class CreateSessionResponse(BaseModel):
    """Réponse après création de session"""
    session_id: str


class UploadFileResponse(BaseModel):
    """Réponse après upload d'un fichier"""
    status: str = "uploaded"
    file_id: str


class GenerateInitialResponse(BaseModel):
    """Réponse avec le résumé global initial"""
    summary: str


class GenerateToolResponse(BaseModel):
    """Réponse avec le contenu généré (quiz, flashcards, etc.)"""
    content: dict  # Le JSON généré par Gemini


class ChatResponse(BaseModel):
    """Réponse du chat"""
    response: str
