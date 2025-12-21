"""
Middleware d'authentification JWT.
"""
from fastapi import Header, HTTPException, status
from app.services.auth_service import auth_service
from typing import Optional

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dépendance FastAPI qui vérifie le token JWT et retourne l'utilisateur.

    Usage dans une route:
    @app.get("/protected")
    async def protected(user: dict = Depends(get_current_user)):
        # user contient {"user_id": ".. .", "email": "..."}
        ...
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header manquant",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Format attendu: "Bearer <TOKEN>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0]. lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Format du header Authorization invalide.  Attendu: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    try:
        payload = auth_service.decode_token(token)
        return payload  # Contient user_id, email, etc.
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )