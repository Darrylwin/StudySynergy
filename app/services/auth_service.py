"""
Service d'authentification avec JWT.
"""
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from app.config import settings
from typing import Optional

class AuthService:
    """
    Service centralisé pour l'authentification.
    """

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash un mot de passe avec bcrypt.

        Args:
            password:  Le mot de passe en clair

        Returns:
            Le hash du mot de passe
        """
        # Convertir le mot de passe en bytes
        password_bytes = password. encode('utf-8')

        # Générer un salt et hasher
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)

        # Retourner le hash en string
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Vérifie un mot de passe contre son hash.

        Args:
            plain_password: Le mot de passe en clair
            hashed_password: Le hash stocké en base

        Returns:
            True si le mot de passe est correct, False sinon
        """
        # Convertir en bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')

        # Vérifier
        return bcrypt.checkpw(password_bytes, hashed_bytes)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Crée un token JWT.

        Args:
            data:  Données à encoder dans le token (ex: {"user_id": "123"})
            expires_delta:  Durée de validité du token

        Returns:
            Le token JWT
        """
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp":  expire})
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
            ValueError: Si le token est invalide
        """
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            raise ValueError("Token invalide ou expiré")

auth_service = AuthService()