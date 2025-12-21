# StudySynergy Backend - API FastAPI

Backend de l'application StudySynergy, plateforme d'apprentissage assistée par IA pour le TechSprint Hackathon 2025.

## 🚀 Technologies

- **FastAPI** : Framework web Python moderne et rapide
- **Firebase** : Authentification, base de données (Firestore) et stockage de fichiers
- **Google gemini-2.5-flash** : Moteur d'IA pour l'analyse de documents et la génération de contenu

## 📋 Prérequis

- Python 3.9+
- Compte Firebase avec projet configuré
- Clé API Google Gemini

## 🔧 Installation

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
pip install -r requirements. txt
```

### 4. Configuration Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Créer un projet (ou utiliser un existant)
3. Activer **Authentication** (méthode Google)
4. Activer **Firestore Database**
5. Activer **Storage**
6. Aller dans **Paramètres du projet** > **Comptes de service**
7. Cliquer sur **Générer une nouvelle clé privée**
8. Télécharger le fichier JSON et le renommer `firebase_credentials.json`
9. Le placer à la racine du projet

### 5. Configuration Gemini

1. Aller sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créer une clé API
3. La copier pour l'étape suivante

### 6. Fichier `.env`

Créer un fichier `.env` à la racine : 

```bash
FIREBASE_CREDENTIALS_PATH=./firebase_credentials.json
FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
GEMINI_API_KEY=votre_cle_api_ici
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

**Remplacer :**
- `votre-projet.appspot.com` par le nom de votre bucket Firebase Storage
- `votre_cle_api_ici` par votre clé API Gemini

## 🏃 Lancement

```bash
python -m app.main
```

Ou avec uvicorn directement :

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

L'API sera accessible sur :  http://localhost:8000

Documentation interactive : http://localhost:8000/docs

## 📚 Endpoints

### Authentification

Tous les endpoints (sauf `/health`) nécessitent un header : 
```
Authorization: Bearer <FIREBASE_TOKEN>
```

### Sessions

- `POST /api/session/create` - Créer une nouvelle session
- `POST /api/session/{id}/upload` - Upload un fichier
- `POST /api/session/{id}/generate-initial` - Générer le résumé global
- `POST /api/session/{id}/chat` - Discuter avec l'IA sur le cours

### Outils

- `POST /api/session/{id}/generate-tool` - Générer un quiz, flashcards ou notes

## 🏗️ Structure du projet

```
app/
├── main.py              # Point d'entrée FastAPI
├── config.py            # Configuration (Firebase, Gemini)
├── models.py            # Modèles Pydantic
├── auth.py              # Middleware d'authentification
├── routes/
│   ├── session.py       # Routes des sessions
│   └── tools.py         # Routes des outils
├── services/
│   ├── firebase_service.py  # Service Firebase
│   └── gemini_service.py    # Service Gemini
└── utils/
    └── helpers.py       # Fonctions utilitaires
```

## 🧪 Tests

Pour tester l'API, utiliser l'interface Swagger automatique : 
http://localhost:8000/docs

Ou avec curl : 

```bash
# Health check
curl http://localhost:8000/health

# Créer une session (nécessite un token)
curl -X POST http://localhost:8000/api/session/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Mon cours de test"}'
```

## 📝 Notes importantes

- **Sécurité** : Ne jamais commit `firebase_credentials.json` ou `.env`
- **CORS** : En production, restreindre `allow_origins` dans `main.py`
- **Coûts** : L'API Gemini a un quota gratuit limité

## 🐛 Troubleshooting

### Erreur "Invalid token"
- Vérifier que le token Firebase est valide
- Vérifier que `firebase_credentials.json` est correct

### Erreur Gemini
- Vérifier la clé API dans `.env`
- Vérifier les quotas sur Google AI Studio

### Erreur Firebase Storage
- Vérifier que le nom du bucket est correct dans `.env`
- Vérifier que Storage est activé dans Firebase Console

## 📄 Licence

Projet pour le TechSprint Hackathon 2025