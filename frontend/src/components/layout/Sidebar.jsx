import React from 'react';
import { NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { sessionAPI } from '../../services/api';
import Logo from '../Logo';
import {
  LayoutDashboard,
  FilePlus,
  LogOut,
  X,
  HelpCircle,
  BookMarked,
  FileText,
  AlignLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ mobile = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const isSessionPage = location.pathname.includes('/session/') && !location.pathname.includes('/session/new');
  const sessionId = params.sessionId;

  // Charger les sessions pour récupérer la dernière
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionAPI.getAll(),
    staleTime: 30 * 1000,
  });

  const sessions = Array.isArray(sessionsData?.sessions)
    ? sessionsData.sessions
    : Array.isArray(sessionsData) ? sessionsData : [];

  // Dernière session disponible
  const lastSession = sessions.length > 0
    ? (sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0])
    : null;
  const lastSessionId = sessionId || lastSession?.session_id || lastSession?.id;

  const mainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Nouvelle session', href: '/session/new', icon: FilePlus },
  ];

  const sessionTools = [
    { id: 'summary', name: 'Résumé', icon: AlignLeft, href: lastSessionId ? `/session/${lastSessionId}` : null },
    { id: 'quiz', name: 'Quiz', icon: HelpCircle, href: lastSessionId ? `/session/${lastSessionId}/quiz` : null },
    { id: 'flashcards', name: 'Flashcards', icon: BookMarked, href: lastSessionId ? `/session/${lastSessionId}/flashcards` : null },
    { id: 'files', name: 'Fichiers', icon: FileText, href: lastSessionId ? `/session/${lastSessionId}/files` : null },
  ];

  const getActiveTool = () => {
    const p = location.pathname;
    if (p.includes('/quiz')) return 'quiz';
    if (p.includes('/flashcards')) return 'flashcards';
    if (p.includes('/files')) return 'files';
    if (isSessionPage) return 'summary';
    return null;
  };
  const activeTool = getActiveTool();

  const handleToolClick = (href) => {
    if (!href) {
      toast.error('Créez d\'abord une session');
      navigate('/session/new');
      return;
    }
    navigate(href);
    if (mobile && onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
      isActive
        ? 'bg-faint text-ink font-semibold'
        : 'text-muted hover:text-ink hover:bg-faint'
    }`;

  const toolClass = (id) => {
    const isActive = activeTool === id;
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-all ${
      isActive
        ? 'bg-faint text-ink font-semibold'
        : 'text-muted hover:text-ink hover:bg-faint'
    }`;
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-stone">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="font-bold text-base text-ink">StudySynergy</span>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1.5 text-muted hover:text-ink rounded-lg">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Main nav */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 mb-2">Navigation</p>
          <ul className="space-y-0.5">
            {mainNav.map(item => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={navLinkClass}
                  onClick={() => mobile && onClose && onClose()}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Session tools - toujours visibles */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Outils</p>
            {lastSession && !isSessionPage && (
              <span className="text-[10px] text-muted truncate max-w-[80px]" title={lastSession.title}>
                {lastSession.title?.slice(0, 12) || 'Dernière'}…
              </span>
            )}
          </div>
          <ul className="space-y-0.5">
            {sessionTools.map(tool => (
              <li key={tool.id}>
                <button
                  className={toolClass(tool.id)}
                  onClick={() => handleToolClick(tool.href)}
                >
                  <tool.icon className="h-4 w-4 shrink-0" />
                  {tool.name}
                  {!tool.href && (
                    <span className="ml-auto text-[10px] text-stone">...</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-stone px-3 py-3">
        <div className="flex items-center gap-3 px-1">
          <div className="h-8 w-8 bg-gray-100 text-ink rounded-xl flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{user?.name || 'Utilisateur'}</p>
            <p className="text-xs text-muted truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    return <div className="fixed inset-0 z-50 bg-white">{content}</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white border-r border-stone">
      {content}
    </div>
  );
};

export default Sidebar;
