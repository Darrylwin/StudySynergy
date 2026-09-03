import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/session/new': 'Nouvelle session',
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname === path) return { title, back: null };
    }
    if (location.pathname.includes('/quiz')) return { title: 'Quiz', back: true };
    if (location.pathname.includes('/flashcards')) return { title: 'Flashcards', back: true };
    if (location.pathname.includes('/files')) return { title: 'Fichiers', back: true };
    if (location.pathname.includes('/session/')) return { title: 'Session', back: true };
    return { title: 'StudySynergy', back: null };
  };

  const { title, back } = getTitle();

  return (
    <header className="h-14 flex items-center px-6 bg-white border-b border-stone gap-3">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-faint transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <h1 className="text-sm font-semibold text-ink">{title}</h1>
    </header>
  );
};

export default Header;
