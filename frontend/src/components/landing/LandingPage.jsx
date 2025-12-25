// src/components/landing/LandingPage.jsx - VERSION BOUTON UNIQUE "COMMENCER"
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const handleStart = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header - Logo à gauche uniquement */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">StudySynergy</div>
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <Sparkles className="h-4 w-4" />
                <span>Propulsé par Gemini AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          
          {/* Titre */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Vos cours transformés en
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              outils d'apprentissage IA
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg text-gray-600 mb-12 max-w-md mx-auto">
            Importez vos fichiers et obtenez instantanément des quiz, 
            flashcards et résumés générés par intelligence artificielle.
          </p>

          {/* BOUTON UNIQUE "COMMENCER" */}
          <div className="flex justify-center">
            <button
              onClick={handleStart}
              className="px-16 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl flex items-center justify-center space-x-3 font-semibold text-lg w-full max-w-xs transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>Commencer</span>
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>

          {/* Info discrète */}
          <p className="text-sm text-gray-400 mt-10">
            Aucune carte de crédit requise • 3 sessions gratuites incluses
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-gray-400">
            © 2024 StudySynergy
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;