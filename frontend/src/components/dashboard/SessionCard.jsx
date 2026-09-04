import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import { MoreHorizontal, Trash2, Clock, HelpCircle, BookMarked, AlignLeft } from 'lucide-react';

const SessionCard = ({ session }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => sessionAPI.delete(session.session_id || session.id),
    onSuccess: () => queryClient.invalidateQueries(['sessions']),
  });

  const formatDate = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const id = session.session_id || session.id;
  const status = session.status || 'ready';

  const statusConfig = {
    processing: { label: 'En cours', cls: 'bg-amber-100 text-amber-700' },
    error:      { label: 'Erreur',   cls: 'bg-red-100 text-red-600' },
    ready:      { label: 'Prête',    cls: 'bg-emerald-100 text-emerald-700' },
  };
  const st = statusConfig[status] || statusConfig.ready;

  const tools = [
    { icon: AlignLeft, label: 'Résumé', path: `/session/${id}` },
    { icon: HelpCircle, label: 'Quiz', path: `/session/${id}/quiz` },
    { icon: BookMarked, label: 'Flashcards', path: `/session/${id}/flashcards` },
  ];

  return (
    <div className="card hover:shadow-md transition-all group flex flex-col overflow-hidden">
      {/* Main click area */}
      <div
        className="p-5 flex-1 cursor-pointer"
        onClick={() => navigate(`/session/${id}`)}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2 flex-1">
            {session.title || 'Sans titre'}
          </h3>
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-faint"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-stone shadow-float z-20">
                <button
                  onClick={() => {
                    if (window.confirm('Supprimer cette session ?')) deleteMutation.mutate();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 className="h-4 w-4" />Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary preview */}
        {session.summary && (
          <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">
            {session.summary}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3 w-3" />
            {formatDate(session.created_at)}
          </div>
          <span className={`tag text-[11px] font-medium ${st.cls}`}>{st.label}</span>
        </div>
      </div>

      {/* Quick tools footer */}
      <div className="border-t border-stone px-3 py-2 flex items-center gap-1 bg-faint/50">
        {tools.map(t => (
          <button
            key={t.label}
            onClick={() => navigate(t.path)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-ink hover:bg-faint transition-colors font-medium"
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SessionCard;
