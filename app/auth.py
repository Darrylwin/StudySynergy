"""
Middleware d'authentification JWT.
"""
from fastapi import Header, HTTPException, status, Query
from app.services.auth_service import auth_service
from app.config import settings
from typing import Optional

async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None) if settings.DEBUG else Query(None, include_in_schema=False)
) -> dict:
    """
    Dépendance FastAPI qui vérifie le token JWT.

    En mode DEBUG : Accepte le token en query parameter pour faciliter les tests.
    En production : Uniquement le header Authorization.
    """
    jwt_token = None

    # Priorité 1 : Header Authorization
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            jwt_token = parts[1]

    # Priorité 2 : Query parameter (seulement en DEBUG)
    if not jwt_token and token and settings.DEBUG:
        jwt_token = token

    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header manquant",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = auth_service.decode_token(jwt_token)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalide: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )