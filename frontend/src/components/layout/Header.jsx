import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { sessionAPI } from '../../services/api';

const staticTitles = {
  '/dashboard': 'Mes sessions',
  '/session/new': 'Nouvelle session',
};

const toolLabels = {
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  files: 'Fichiers',
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  // Charger les infos de la session pour afficher son vrai titre
  const { data: sessionData } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionAPI.get(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });

  const sessionTitle = sessionData?.data?.title || sessionData?.title;

  const getInfo = () => {
    const path = location.pathname;

    // Pages statiques
    for (const [p, label] of Object.entries(staticTitles)) {
      if (path === p) return { title: label, sub: null, back: false };
    }

    // Outils de session
    for (const [key, label] of Object.entries(toolLabels)) {
      if (path.includes(`/${key}`)) {
        return {
          title: label,
          sub: sessionTitle || null,
          back: true,
        };
      }
    }

    // Page session principale
    if (path.includes('/session/') && sessionId) {
      return {
        title: sessionTitle || 'Session',
        sub: null,
        back: true,
      };
    }

    return { title: 'StudySynergy', sub: null, back: false };
  };

  const { title, sub, back } = getInfo();

  return (
    <header className="h-14 flex items-center px-5 bg-white border-b border-stone gap-3 shrink-0">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-faint transition-colors shrink-0"
          aria-label="Retour"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink truncate leading-none">{title}</p>
        {sub && (
          <p className="text-xs text-muted truncate mt-0.5">{sub}</p>
        )}
      </div>
    </header>
  );
};

export default Header;
