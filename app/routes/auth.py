"""
Routes d'authentification (register, login, me, change-password).
"""
from fastapi import APIRouter, HTTPException, status, Depends
from app.models import (
    RegisterRequest, LoginRequest, ChangePasswordRequest,
    AuthResponse, UserResponse
)
from app.services.auth_service import auth_service
from app.services.firebase_service import firebase_service
from app.auth import get_current_user
from datetime import timedelta
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Inscription d'un nouvel utilisateur.

    - **email**: Email unique
    - **password**: Mot de passe (min 8 caractères)
    - **name**: Nom de l'utilisateur
    """
    # Vérifier si l'email existe déjà
    existing_user = firebase_service.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )

    # Hasher le mot de passe
    hashed_password = auth_service.hash_password(request.password)

    # Créer l'utilisateur
    user_id = firebase_service.create_user(request.email, hashed_password, request.name)

    # Créer le token JWT
    access_token = auth_service.create_access_token(
        data={"user_id": user_id, "email": request.email}
    )

    return AuthResponse(
        access_token=access_token,
        user={
            "user_id": user_id,
            "email": request.email,
            "name": request.name
        }
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Connexion d'un utilisateur.

    - **email**: Email de l'utilisateur
    - **password**: Mot de passe
    """
    # Récupérer l'utilisateur
    user = firebase_service.get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Vérifier le mot de passe
    if not auth_service.verify_password(request.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Créer le token JWT
    access_token = auth_service.create_access_token(
        data={"user_id": user['user_id'], "email": user['email']}
    )

    return AuthResponse(
        access_token=access_token,
        user={
            "user_id": user['user_id'],
            "email": user['email'],
            "name": user['name']
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Récupère les informations de l'utilisateur connecté.

    Nécessite un token JWT valide dans le header Authorization.
    """
    user = firebase_service.get_user_by_id(current_user['user_id'])

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    return UserResponse(
        user_id=user['user_id'],
        email=user['email'],
        name=user['name'],
        created_at=str(user.get('createdAt', ''))
    )


@router.post("/change-password")
async def change_password(
        request: ChangePasswordRequest,
        current_user: dict = Depends(get_current_user)
):
    """
    Change le mot de passe de l'utilisateur connecté.

    - **old_password**: Ancien mot de passe
    - **new_password**: Nouveau mot de passe (min 8 caractères)
    """
    # Récupérer l'utilisateur
    user = firebase_service.get_user_by_id(current_user['user_id'])

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    # Vérifier l'ancien mot de passe
    if not auth_service.verify_password(request.old_password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ancien mot de passe incorrect"
        )

    # Hasher le nouveau mot de passe
    new_hashed_password = auth_service.hash_password(request.new_password)

    # Mettre à jour
    firebase_service.update_user_password(current_user['user_id'], new_hashed_password)

    return {"message": "Mot de passe modifié avec succès"}