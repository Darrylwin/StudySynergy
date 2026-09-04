import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import SessionCard from './SessionCard';
import { sessionAPI } from '../../services/api';
import Logo from '../Logo';
import { Plus, Search, RefreshCw, BookOpen, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionAPI.getAll(),
  });

  const sessions = Array.isArray(sessionsData?.sessions)
    ? sessionsData.sessions
    : Array.isArray(sessionsData) ? sessionsData : [];

  const sorted = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filtered = sorted.filter(s => {
    const status = s?.status || 'ready';
    if (filter === 'ready' && status !== 'ready') return false;
    if (filter === 'processing' && status !== 'processing') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s?.title?.toLowerCase().includes(q) || s?.summary?.toLowerCase().includes(q);
    }
    return true;
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="h-6 w-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Greeting header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {sessions.length === 0
              ? 'Créez votre première session pour commencer.'
              : `${sessions.length} session${sessions.length > 1 ? 's' : ''} · Dernière mise à jour ${
                  sessions.length > 0
                    ? new Date(sorted[0].created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                    : ''
                }`}
          </p>
        </div>
        <button
          onClick={() => navigate('/session/new')}
          className="btn-accent shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nouvelle session
        </button>
      </div>

      {/* Quick stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Sessions', val: sessions.length, icon: BookOpen, color: 'text-gray-600 bg-gray-100' },
            { label: 'Prêtes', val: sessions.filter(s => !s.status || s.status === 'ready').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'En cours', val: sessions.filter(s => s.status === 'processing').length, icon: RefreshCw, color: 'text-amber-600 bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-ink leading-none">{s.val}</p>
                  <p className="text-xs text-muted mt-0.5">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher une session..."
            className="input pl-9"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">Toutes</option>
          <option value="ready">Prêtes</option>
          <option value="processing">En traitement</option>
        </select>
        <button onClick={refetch} className="btn-secondary p-2.5" title="Actualiser">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Sessions */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          {sessions.length === 0 ? (
            <>
              <div className="h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                <Logo size="xl" />
              </div>
              <h2 className="text-lg font-semibold text-ink mb-2">Aucune session</h2>
              <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
                Importez vos premiers fichiers de cours pour générer résumé, quiz et flashcards automatiquement.
              </p>
              <button onClick={() => navigate('/session/new')} className="btn-accent">
                <Plus className="h-4 w-4" />
                Créer ma première session
              </button>
            </>
          ) : (
            <p className="text-muted">Aucun résultat pour "{searchQuery}"</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(session => (
            <SessionCard key={session.session_id || session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
