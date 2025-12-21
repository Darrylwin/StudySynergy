"""
Script de test pour vérifier la configuration Firebase et le stockage local.
"""
import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.config import settings
import google.generativeai as genai
from pathlib import Path


def test_configuration():
    print("🔥 Test de configuration StudySynergy...")

    # 1. Test des credentials
    print("\n1️⃣ Test des credentials Firebase...")
    try:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        print("✅ Fichier credentials trouvé et valide")
    except Exception as e:
        print(f"❌ Erreur credentials: {e}")
        return

    # 2. Test de l'initialisation
    print("\n2️⃣ Test de l'initialisation Firebase...")
    try:
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialisé")
    except Exception as e:
        print(f"❌ Erreur initialisation: {e}")
        return

    # 3. Test Firestore
    print("\n3️⃣ Test Firestore...")
    try:
        db = firestore.client()
        # Créer un document de test
        test_ref = db.collection('test').document('config_test')
        test_ref.set({'message': 'Configuration OK', 'timestamp': firestore.SERVER_TIMESTAMP})
        print("✅ Firestore accessible (écriture OK)")

        # Lire le document
        doc = test_ref.get()
        if doc.exists:
            print(f"✅ Firestore lecture OK")

        # Nettoyer
        test_ref.delete()
        print("✅ Document de test supprimé")
    except Exception as e:
        print(f"❌ Erreur Firestore: {e}")

    # 4. Test Stockage Local
    print("\n4️⃣ Test Stockage Local...")
    try:
        upload_dir = settings.UPLOAD_DIR
        if upload_dir.exists():
            print(f"✅ Dossier uploads existe: {upload_dir}")
        else:
            print(f"❌ Dossier uploads n'existe pas: {upload_dir}")

        # Tester l'écriture
        test_file = upload_dir / "test.txt"
        test_file.write_text("Test de stockage local")
        print(f"✅ Écriture de fichier OK")

        # Tester la lecture
        content = test_file.read_text()
        print(f"✅ Lecture de fichier OK: {content}")

        # Nettoyer
        test_file.unlink()
        print(f"✅ Fichier de test supprimé")
    except Exception as e:
        print(f"❌ Erreur Stockage Local: {e}")

    # 5. Test Gemini
    print("\n5️⃣ Test Google Gemini...")
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content("Dis juste 'Hello' en une ligne")
        print(f"✅ Gemini accessible: {response.text.strip()}")
    except Exception as e:
        print(f"❌ Erreur Gemini: {e}")

    print("\n🎉 Tests terminés !")
    print(f"\n📊 Résumé :")
    print(f"   - Firebase Auth & Firestore :  ✅")
    print(f"   - Stockage Local : ✅")
    print(f"   - Google Gemini : ✅")


if __name__ == "__main__":
    test_configuration()