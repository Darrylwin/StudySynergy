# StudySynergy Backend - API FastAPI

Backend de l'application StudySynergy, plateforme d'apprentissage assistée par IA pour le TechSprint Hackathon 2025.

## Technologies

- **FastAPI** : Framework web Python moderne et rapide
- **Firebase Firestore** : Base de données NoSQL
- **Cloudinary** : Stockage de fichiers (images, PDFs, audio, etc.)
- **Google gemini-2.5-flash** : Moteur d'IA pour l'analyse de documents et la génération de contenu
- **JWT** : Authentification sécurisée

## Prérequis

- Python 3.9+
- Compte Firebase avec projet configuré
- Compte Cloudinary
- Clé API Google Gemini

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/Darrylwin/StudySynergy.git
cd studysynergy
```

### 2. Créer un environnement virtuel

```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configuration Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Créer un projet (ou utiliser un existant)
3. Activer **Firestore Database**
4. Aller dans **Paramètres du projet** > **Comptes de service**
5. Cliquer sur **Générer une nouvelle clé privée**
6. Télécharger le fichier JSON et le renommer `firebase_credentials.json`
7. Le placer à la racine du projet

### 5. Configuration Cloudinary

1. Créer un compte sur [Cloudinary](https://cloudinary.com/)
2. Récupérer vos credentials dans le Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 6. Configuration Gemini

1. Aller sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créer une clé API
3. La copier pour l'étape suivante

### 7. Fichier `.env`

Créer un fichier `.env` à la racine : 

```bash
# Firebase
FIREBASE_CREDENTIALS_PATH=./firebase_credentials.json

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# Taille max des fichiers
MAX_FILE_SIZE_MB=50

# Google Gemini
GEMINI_API_KEY=votre_cle_api_ici

# JWT
JWT_SECRET_KEY=votre_cle_secrete_super_longue_et_aleatoire_ici_changez_moi
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Serveur
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

**Remplacer :**
- `votre_cloud_name`, `votre_api_key`, `votre_api_secret` par vos credentials Cloudinary
- `votre_cle_api_ici` par votre clé API Gemini
- `JWT_SECRET_KEY` par une clé secrète aléatoire forte

## Lancement

```bash
python run.py
```

Ou avec uvicorn directement :

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

L'API sera accessible sur : http://localhost:8000

Documentation interactive : http://localhost:8000/docs

## Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Infos utilisateur
- `POST /api/auth/change-password` - Changer le mot de passe

**Tous les autres endpoints nécessitent un header:**
```
Authorization: Bearer <JWT_TOKEN>
```

### Sessions

- `POST /api/session/create` - Créer une nouvelle session avec fichiers
- `POST /api/session/{id}/add-file` - Ajouter un fichier à une session
- `GET /api/session/list` - Liste des sessions de l'utilisateur
- `GET /api/session/{id}` - Détails d'une session
- `DELETE /api/session/{id}` - Supprimer une session
- `POST /api/session/{id}/chat` - Discuter avec l'IA sur le cours

### Outils pédagogiques

- `POST /api/session/{id}/generate-tool` - Générer un quiz, flashcards ou notes
- `GET /api/session/{id}/artifacts` - Récupérer tous les artefacts générés

## 📄 Licence

Projet pour le TechSprint Hackathon 2025
