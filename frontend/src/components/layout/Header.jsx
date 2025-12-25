// src/components/layout/Header.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Bell,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Upload,
} from 'lucide-react';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Tableau de bord';
    if (path === '/session/new') return 'Nouvelle Session';
    if (path.includes('/session/')) return 'Session d\'apprentissage';
    return 'StudySynergy';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const notifications = [
    { id: 1, title: 'Quiz généré', message: 'Votre quiz de Mathématiques est prêt', time: '5 min' },
    { id: 2, title: 'Nouvelle fonctionnalité', message: 'Chat IA maintenant disponible', time: '1 h' },
    { id: 3, title: 'Session complète', message: 'Tous vos fichiers ont été traités', time: '2 h' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          {location.pathname.includes('/session/') && (
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              <Sparkles className="h-3 w-3" />
              IA Active
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm"
          />
        </div>
      </form>

      <div className="flex items-center gap-x-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-gray-100 relative"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {/* Contenu notifications inchangé */}
            </div>
          )}
        </div>

        <div className="relative">
          <button 
             onClick={() => navigator.clipboard.writeText(window.location.href)}
             className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <span className="sr-only">Copier le lien</span>
            {/* Action silencieuse sans toast */}
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Handle Share Link" /></svg>
          </button>
        </div>

        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Header;