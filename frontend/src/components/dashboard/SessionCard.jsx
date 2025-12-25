// src/components/dashboard/SessionCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import { MoreVertical, Clock, Trash2 } from 'lucide-react';

const SessionCard = ({ session }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);

  // Mutation pour supprimer une session
  const deleteMutation = useMutation({
    mutationFn: () => sessionAPI.delete(session.session_id || session.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return '';
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Supprimer cette session ?')) {
      deleteMutation.mutate();
    }
    setShowMenu(false);
  };

  const handleCardClick = () => {
    navigate(`/session/${session.session_id || session.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white"
    >
      {/* En-tête avec menu */}
      <div className="flex justify-between items-start mb-4">
        {/* Titre complet - bien visible */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 break-words">
            {session.title || 'Sans titre'}
          </h3>
        </div>
        
        {/* Menu simplifié */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
          
          {showMenu && (
            <div 
              className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Informations minimales */}
      <div className="space-y-4">
        {/* Date */}
        <div className="flex items-center text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span>{formatDate(session.created_at)}</span>
        </div>

        {/* Statut simple */}
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${
            session.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
            session.status === 'error' ? 'bg-red-500' : 'bg-green-500'
          }`} />
          <span className="text-gray-700">
            {session.status === 'processing' ? 'En traitement' :
             session.status === 'error' ? 'Erreur' : 'Prête à utiliser'}
          </span>
        </div>

        {/* Matière si disponible */}
        {session.subject && (
          <div className="text-gray-700">
            <span className="text-gray-500">Matière: </span>
            <span className="font-medium">{session.subject}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCard;