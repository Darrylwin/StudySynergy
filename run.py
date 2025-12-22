"""
Script pour lancer le serveur FastAPI avec auto-installation des dépendances.
"""
import sys
import subprocess
from pathlib import Path

def install_dependencies():
    """Installe les dépendances si nécessaire."""
    print("🔧 Vérification des dépendances...")
    
    # Vérifier si uvicorn est installé
    try:
        import uvicorn
        print("✅ Dépendances déjà installées")
        return True
    except ImportError:
        print("📦 Installation des dépendances...")
        # Mettre à jour pip d'abord
        
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "--upgrade", "pip", "--user"
        ])
        
        # Installer les dépendances
        requirements_file = Path("requirements.txt")
        if not requirements_file.exists():
            print("❌ requirements.txt non trouvé!")
            return False
        
        # Nettoyer le cache avant installation
        subprocess.run([
            sys.executable, "-m", "pip", "cache", "purge"
        ], check=False)
        
        # Installer avec options optimisées
        subprocess.check_call([
            sys.executable, "-m", "pip", "install",
            "-r", str(requirements_file),
            "--user", 
            "--no-cache-dir",
            "--no-deps",  # Installer d'abord sans dépendances
            "--force-reinstall"
        ], stderr=subprocess.DEVNULL)
        
        # Puis installer les dépendances manquantes
        subprocess.check_call([
            sys.executable, "-m", "pip", "install",
            "-r", str(requirements_file),
            "--user",
            "--no-cache-dir"
        ])
        
        print("✅ Dépendances installées")
        return True

def setup_firebase_credentials():
    """Crée firebase_credentials.json depuis FIREBASE_CREDENTIALS_BASE64."""
    import os
    import json
    import base64
    from pathlib import Path
    
    credentials_b64 = os.getenv('FIREBASE_CREDENTIALS_BASE64')
    
    if credentials_b64:
        try:
            credentials_json = base64.b64decode(credentials_b64).decode('utf-8')
            json.loads(credentials_json)  # Valider le JSON
            Path('./firebase_credentials.json').write_text(credentials_json)
            print("✅ Firebase credentials configurés")
            return True
        except Exception as e:
            print(f"❌ Erreur Firebase credentials: {e}")
            return False
    else:
        if Path('./firebase_credentials.json').exists():
            print("✅ Utilisation Firebase credentials existants")
            return True
        print("⚠️ Firebase credentials manquants")
        return True  # Continue sans Firebase pour debug

if __name__ == "__main__":
    # Setup Firebase
    setup_firebase_credentials()
    
    # Installer les dépendances si nécessaire
    if not install_dependencies():
        print("❌ Échec de l'installation des dépendances")
        sys.exit(1)
    
    # Maintenant on peut importer
    import uvicorn
    from app.config import settings
    
    print("🚀 Démarrage de StudySynergy API...")
    print(f"📍 URL: http://{settings.HOST}:{settings.PORT}")
    print(f"📚 Documentation: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"💚 Health check: http://{settings.HOST}:{settings.PORT}/health")
    print("-" * 60)

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )