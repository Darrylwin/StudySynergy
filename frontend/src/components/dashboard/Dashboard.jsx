// src/components/dashboard/Dashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SessionCard from './SessionCard';
import { sessionAPI } from '../../services/api';
import { Plus, Search, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const { 
    data: sessionsData, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionAPI.getAll(),
  });

  // Assurer que sessions est toujours un tableau
  const sessions = Array.isArray(sessionsData?.sessions) 
    ? sessionsData.sessions 
    : Array.isArray(sessionsData) 
      ? sessionsData 
      : [];

  const handleCreateSession = () => {
    navigate('/session/new');
  };

  const filteredSessions = sessions.filter(session => {
    const status = session?.status || 'ready';
    
    if (filter === 'ready' && status !== 'ready') return false;
    if (filter === 'processing' && status !== 'processing') return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return session?.title?.toLowerCase().includes(query) || 
             session?.summary?.toLowerCase().includes(query);
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Vos Sessions</h1>
            <p className="text-gray-600">Gérez vos cours</p>
          </div>
          <button
            onClick={handleCreateSession}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle Session
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes</option>
              <option value="ready">Prêtes</option>
              <option value="processing">En traitement</option>
            </select>
            
            <button
              onClick={refetch}
              className="p-2 border rounded-lg hover:bg-gray-50"
              title="Actualiser"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? `Aucun résultat pour "${searchQuery}"`
              : sessions.length === 0 
                ? 'Aucune session disponible' 
                : 'Aucune session ne correspond au filtre'
            }
          </p>
          <button
            onClick={handleCreateSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer une session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard 
              key={session.session_id || session.id} 
              session={session} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;