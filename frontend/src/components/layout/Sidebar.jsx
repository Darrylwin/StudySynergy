// src/components/layout/Sidebar.jsx - VERSION FINALE
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FolderPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Brain,
  Users,
  HelpCircle,
  Sparkles,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ mobile = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [collapsed, setCollapsed] = useState(false);

  // Détecter si nous sommes sur une page de session
  const isSessionPage = location.pathname.includes('/session/');
  const sessionId = params.sessionId;

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Nouvelle Session', href: '/session/new', icon: FolderPlus },
  ];

  // Outils de session (seulement affichés sur une page de session)
  const sessionTools = [
    { 
      id: 'summary', 
      name: 'Résumé IA', 
      icon: Sparkles,
      href: sessionId ? `/session/${sessionId}` : '#',
      description: 'Synthèse générée par l\'IA'
    },
    { 
      id: 'quiz', 
      name: 'Quiz', 
      icon: HelpCircle,
      href: sessionId ? `/session/${sessionId}/quiz` : '#',
      description: 'Testez vos connaissances'
    },
    { 
      id: 'flashcards', 
      name: 'Flashcards', 
      icon: Users,
      href: sessionId ? `/session/${sessionId}/flashcards` : '#',
      description: 'Mémorisez les concepts'
    },
    { 
      id: 'files', 
      name: 'Fichiers', 
      icon: FileText,
      href: sessionId ? `/session/${sessionId}/files` : '#',
      description: 'Documents analysés'
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      console.error('Logout error:', error);
    }
  };

  const handleToolClick = (href) => {
    if (href === '#') {
      toast.error('Veuillez d\'abord sélectionner une session');
      return;
    }
    navigate(href);
    if (mobile && onClose) {
      onClose();
    }
  };

  const getActiveTool = () => {
    const path = location.pathname;
    if (path.includes('/quiz')) return 'quiz';
    if (path.includes('/flashcards')) return 'flashcards';
    if (path.includes('/files')) return 'files';
    if (path.includes('/session/')) return 'summary';
    return null;
  };

  const activeTool = getActiveTool();

  // mobile: render as full-screen overlay panel
  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">StudySynergy</h1>
              <p className="text-xs text-gray-500">IA Multimodale</p>
            </div>
          </div>
          <div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <nav className="flex flex-col gap-y-6">
            <div>
              <div className="text-xs font-semibold leading-6 text-gray-400">NAVIGATION</div>
              <ul className="mt-2 space-y-1">
                {mainNavigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={() => mobile && onClose && onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-x-3 rounded-lg p-2 text-sm ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Outils de session (seulement sur une page de session) */}
            {isSessionPage && (
              <div>
                <div className="text-xs font-semibold leading-6 text-gray-400">OUTILS DE SESSION</div>
                <ul className="mt-2 space-y-1">
                  {sessionTools.map((tool) => (
                    <li key={tool.id}>
                      <button 
                        onClick={() => handleToolClick(tool.href)}
                        className={`flex items-center gap-x-3 rounded-lg p-2 text-sm w-full text-left ${
                          activeTool === tool.id
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <tool.icon className="h-5 w-5" />
                        <div className="flex-1">
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-xs text-gray-500">{tool.description}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        </div>

        {/* Compte utilisateur FIXE en bas */}
        <div className="border-t border-gray-200 bg-white">
          <div className="flex items-center gap-x-3 p-4">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop sidebar avec compte fixe en bas
  return (
    <div className="flex flex-col h-screen">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
        {/* Logo */}
        <div className={`flex h-16 shrink-0 items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudySynergy</h1>
                <p className="text-xs text-gray-500">IA Multimodale</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation (contenu scrollable) */}
        <nav className="flex-1">
          <ul className="flex flex-col gap-y-7">
            <li>
              <div className={`text-xs font-semibold leading-6 text-gray-400 ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? 'NAV' : 'NAVIGATION'}
              </div>
              <ul className="-mx-2 space-y-1">
                {mainNavigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                        } ${collapsed ? 'justify-center' : ''}`
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>

            {/* Outils de session (seulement sur une page de session) */}
            {isSessionPage && (
              <li>
                <div className={`text-xs font-semibold leading-6 text-gray-400 ${collapsed ? 'text-center' : ''}`}>
                  {collapsed ? 'OUTILS' : 'OUTILS DE SESSION'}
                </div>
                <ul className="-mx-2 space-y-1">
                  {sessionTools.map((tool) => (
                    <li key={tool.id}>
                      <button
                        onClick={() => handleToolClick(tool.href)}
                        className={`group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-medium w-full text-left transition-colors ${
                          activeTool === tool.id
                            ? 'bg-purple-50 text-purple-700'
                            : 'text-gray-700 hover:text-purple-700 hover:bg-gray-50'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <tool.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <div className="flex-1 text-left">
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-xs text-gray-500 font-normal">{tool.description}</div>
                          </div>
                        )}
                        {!collapsed && activeTool === tool.id && (
                          <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* User Profile FIXE en bas */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-x-4'}`}>
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors ${collapsed ? '' : 'ml-2'}`}
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;