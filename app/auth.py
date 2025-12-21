"""
Middleware d'authentification JWT.
"""
from fastapi import Header, HTTPException, status, Query
from app.services.auth_service import auth_service
from typing import Optional

async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)  # NOUVEAU : Support du token en query
) -> dict:
    """
    Dépendance FastAPI qui vérifie le token JWT et retourne l'utilisateur.

    Le token peut être passé de 2 façons :
    1. Header Authorization:  Bearer <token>
    2. Query parameter: ?token=<token> (pour les tests Swagger avec multipart)

    Usage dans une route:
    @app.get("/protected")
    async def protected(user: dict = Depends(get_current_user)):
        # user contient {"user_id": ".. .", "email": "..."}
        ...
    """
    jwt_token = None

    # Priorité 1 : Essayer de récupérer depuis le header Authorization
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0]. lower() == "bearer":
            jwt_token = parts[1]

    # Priorité 2 :  Essayer de récupérer depuis le query parameter
    if not jwt_token and token:
        jwt_token = token

    # Si aucun token trouvé
    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header manquant ou query parameter 'token' manquant",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Vérifier le token
    try:
        payload = auth_service.decode_token(jwt_token)
        return payload  # Contient user_id, email, etc.
    except Exception as e:
        raise HTTPException(
            status_code=status. HTTP_401_UNAUTHORIZED,
            detail=f"Token invalide ou expiré: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )