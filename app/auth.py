"""
Middleware d'authentification Firebase.
"""
from fastapi import Header, HTTPException, status
from app.services.firebase_service import firebase_service
from typing import Optional


async def verify_firebase_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dépendance FastAPI qui vérifie le token Firebase.

    Utilisation dans une route :
    @app.get("/protected")
    async def protected_route(user: dict = Depends(verify_firebase_token)):
        # user contient {'uid':  '... ', 'email': '...', etc.}
        ...

    Args:
        authorization: Header HTTP "Authorization:  Bearer <TOKEN>"

    Returns:
        Les données du user décodées depuis le token

    Raises:
        HTTPException 401 si le token est invalide ou absent
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    # Format attendu : "Bearer <TOKEN>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format.  Expected: Bearer <token>"
        )

    token = parts[1]

    try:
        # Vérifier le token avec Firebase
        user_data = firebase_service.verify_token(token)
        return user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token:  {str(e)}"
        )