"""
Service d'authentification avec JWT.
"""
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from typing import Optional

# Configuration du hachage de mot de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """
    Service centralisé pour l'authentification.
    """

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash un mot de passe"""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Vérifie un mot de passe"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Crée un token JWT.

        Args:
            data: Données à encoder dans le token (ex: {"user_id": "123"})
            expires_delta:  Durée de validité du token

        Returns:
            Le token JWT
        """
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> dict:
        """
        Décode et vérifie un token JWT.

        Args:
            token:  Le token JWT

        Returns:
            Les données décodées

        Raises:
            JWTError: Si le token est invalide
        """
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            raise ValueError("Token invalide ou expiré")


auth_service = AuthService()