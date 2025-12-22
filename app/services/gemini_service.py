"""
Service pour interagir avec Google Gemini AI.
"""
import google.generativeai as genai
from app.config import settings
import json
import re
from typing import List, Dict

# Configurer Gemini avec la clé API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Modèle à utiliser (selon le cahier des charges)
model = genai.GenerativeModel('gemini-2.5-flash')


class GeminiService:
    """
    Service centralisé pour Google Gemini.
    """

    @staticmethod
    def upload_file(file_path: str, mime_type: str) -> str:
        """
        Upload un fichier vers Gemini File API.
        Retourne le gemini_uri.
        """
        uploaded_file = genai.upload_file(path=file_path, mime_type=mime_type)
        return uploaded_file.uri

    @staticmethod
    def _prepare_files_for_gemini(gemini_files: List[Dict[str, str]]) -> List:
        """
        Prépare les fichiers au bon format pour l'API Gemini.
        Convertit les URIs en objets File.
        """
        files = []
        for f in gemini_files:
            # Récupérer le fichier depuis son URI
            file_obj = genai.get_file(name=f["file_uri"].split('/')[-1])
            files.append(file_obj)
        return files

    @staticmethod
    def generate_title_and_summary(gemini_files: List[Dict[str, str]]) -> tuple[str, str]:
        """
        Génère un TITRE et un résumé global introductif des documents.
        """
        prompt = """
        Tu es un assistant pédagogique expert.  Analyse ces documents de cours.  
        
        Ta tâche :  
        1. Génère un TITRE court et descriptif pour ce cours (max 60 caractères)
        2. Génère un résumé global introductif
        
        FORMAT DE SORTIE (JSON UNIQUEMENT) :
        {
            "title": "Titre du cours",
            "summary": "Résumé détaillé ici..."
        }
        
        Le résumé doit :  
        - Présenter les concepts principaux abordés
        - Être structuré et facile à lire
        - Faire environ 200-300 mots
        - Donner une vue d'ensemble pour orienter l'étudiant
        
        IMPORTANT : 
        - Retourne UNIQUEMENT du JSON valide
        - Échappe correctement les guillemets dans le texte avec \\\"
        - N'utilise PAS de markdown (pas de ```)
        - Vérifie que toutes les virgules et accolades sont bien placées
        """

        files = GeminiService._prepare_files_for_gemini(gemini_files)
        content = files + [prompt]

        response = model.generate_content(content)
        clean_json = GeminiService._clean_json_response(response.text)

        try:
            data = json.loads(clean_json)
            return data['title'], data['summary']
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON (titre/résumé): {str(e)}\nContenu reçu: {clean_json[: 500]}")

    @staticmethod
    def generate_quiz(gemini_files: List[Dict[str, str]], focus_section: str = None) -> dict:
        """
        Génère un quiz QCM au format JSON.
        """
        focus_instruction = f"\nConcentre-toi particulièrement sur la section : {focus_section}" if focus_section else ""

        prompt = f"""
        Tu es un assistant pédagogique.  Génère un quiz de 10 questions QCM basé sur ces documents.{focus_instruction}
        
        FORMAT DE SORTIE (JSON UNIQUEMENT) :
        {{
            "questions": [
                {{
                    "question": "Question ici ? ",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer_index": 2,
                    "explanation": "Courte explication de la bonne réponse"
                }}
            ]
        }}
        
        RÈGLES : 
        - Exactement 10 questions
        - 4 options par question
        - answer_index commence à 0
        - Questions variées (compréhension, application, analyse)
        
        IMPORTANT POUR LE JSON :
        - Retourne UNIQUEMENT du JSON valide
        - Dans les textes, échappe les guillemets avec \\\"
        - Évite les apostrophes simples dans les textes (utilise des doubles guillemets échappés)
        - N'utilise PAS de markdown
        - Vérifie que toutes les virgules sont présentes entre les éléments
        - Assure-toi que le JSON est bien formaté avant de répondre
        """

        files = GeminiService._prepare_files_for_gemini(gemini_files)
        content = files + [prompt]

        response = model.generate_content(content)
        clean_json = GeminiService._clean_json_response(response.text)

        try:
            return json.loads(clean_json)
        except json.JSONDecodeError as e:
            # Tenter une correction automatique
            fixed_json = GeminiService._try_fix_json(clean_json)
            try:
                return json.loads(fixed_json)
            except:
                raise ValueError(f"Erreur de parsing JSON (quiz): {str(e)}\nContenu reçu: {clean_json[:500]}")

    @staticmethod
    def generate_flashcards(gemini_files: List[Dict[str, str]], focus_section: str = None) -> dict:
        """
        Génère des flashcards au format JSON.
        """
        focus_instruction = f"\nConcentre-toi particulièrement sur la section : {focus_section}" if focus_section else ""

        prompt = f"""
        Tu es un assistant pédagogique. Génère 15 flashcards de révision basées sur ces documents.{focus_instruction}
        
        FORMAT DE SORTIE (JSON UNIQUEMENT) :
        {{
            "flashcards": [
                {{
                    "front": "Concept ou question",
                    "back": "Définition ou réponse détaillée"
                }}
            ]
        }}
        
        RÈGLES :
        - Exactement 15 flashcards
        - Couvrir les concepts clés
        - front:  court et clair
        - back: complet mais concis (2-3 phrases max)
        
        IMPORTANT POUR LE JSON :
        - Retourne UNIQUEMENT du JSON valide
        - Échappe les guillemets avec \\\"
        - N'utilise PAS de markdown
        - Vérifie la syntaxe JSON avant de répondre
        """

        files = GeminiService._prepare_files_for_gemini(gemini_files)
        content = files + [prompt]

        response = model.generate_content(content)
        clean_json = GeminiService._clean_json_response(response.text)

        try:
            return json.loads(clean_json)
        except json.JSONDecodeError as e:
            fixed_json = GeminiService._try_fix_json(clean_json)
            try:
                return json.loads(fixed_json)
            except:
                raise ValueError(f"Erreur de parsing JSON (flashcards): {str(e)}\nContenu reçu: {clean_json[:500]}")

    @staticmethod
    def generate_detailed_notes(gemini_files: List[Dict[str, str]], focus_section: str = None) -> dict:
        """
        Génère des notes détaillées structurées.
        """
        focus_instruction = f"\nConcentre-toi particulièrement sur la section : {focus_section}" if focus_section else ""

        prompt = f"""
        Tu es un assistant pédagogique. Génère des notes de cours détaillées et structurées basées sur ces documents.{focus_instruction}
        
        FORMAT DE SORTIE (JSON UNIQUEMENT) :
        {{
            "sections": [
                {{
                    "title": "Titre de la section",
                    "content":  "Contenu détaillé en markdown",
                    "key_points": ["Point clé 1", "Point clé 2"]
                }}
            ]
        }}
        
        RÈGLES :
        - Structurer en sections logiques
        - Utiliser du markdown dans content (listes, gras, etc.)
        - 3-5 key_points par section
        - Être exhaustif mais pédagogique
        
        IMPORTANT POUR LE JSON :
        - Retourne UNIQUEMENT du JSON valide
        - Échappe les guillemets avec \\\"
        - Échappe les retours à la ligne dans content avec \\n
        - Vérifie la syntaxe JSON avant de répondre
        """

        files = GeminiService._prepare_files_for_gemini(gemini_files)
        content = files + [prompt]

        response = model.generate_content(content)
        clean_json = GeminiService._clean_json_response(response.text)

        try:
            return json.loads(clean_json)
        except json.JSONDecodeError as e:
            fixed_json = GeminiService._try_fix_json(clean_json)
            try:
                return json.loads(fixed_json)
            except:
                raise ValueError(f"Erreur de parsing JSON (notes): {str(e)}\nContenu reçu:  {clean_json[:500]}")

    @staticmethod
    def chat_about_course(gemini_files: List[Dict[str, str]], user_message: str) -> str:
        """
        Répond à une question de l'étudiant sur le cours.
        """
        prompt = f"""
        Tu es un tuteur pédagogique. L'étudiant te pose une question sur le cours.  
        
        IMPORTANT :  Tu ne dois répondre QU'aux questions liées au contenu des documents fournis.
        Si la question est hors sujet, réponds poliment que tu ne peux traiter que les questions sur ce cours.
        
        Question de l'étudiant : 
        {user_message}
        
        Réponds de manière claire, pédagogique et complète.
        """

        files = GeminiService._prepare_files_for_gemini(gemini_files)
        content = files + [prompt]

        response = model.generate_content(content)
        return response.text

    @staticmethod
    def _clean_json_response(text: str) -> str:
        """
        Nettoie la réponse Gemini pour extraire le JSON pur.
        """
        # Enlever les balises markdown
        json_match = re.search(r'```json\s*(.*? )\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()

        json_match = re.search(r'```\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()

        return text.strip()

    @staticmethod
    def _try_fix_json(json_str: str) -> str:
        """
        Tente de corriger les erreurs JSON courantes.
        """
        # Remplacer les apostrophes simples par des doubles guillemets
        json_str = json_str.replace("'", '"')

        # Supprimer les virgules avant les accolades/crochets fermants
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)

        # Supprimer les commentaires (// et /* */)
        json_str = re.sub(r'//.*?\n', '\n', json_str)
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)

        return json_str


gemini_service = GeminiService()
