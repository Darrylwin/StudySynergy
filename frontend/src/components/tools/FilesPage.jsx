// src/components/tools/FilesPage.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sessionAPI, fileAPI } from '../../services/api';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  Download,
  Eye
} from 'lucide-react';

const FilesPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionAPI.get(sessionId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Session non trouvée
        </h2>
        <button
          onClick={() => navigate('/')}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Retour au tableau de bord</span>
        </button>
      </div>
    );
  }

  const sessionData = session?.data || session;
  const files = sessionData?.files || [];

  const getFileIcon = (file) => {
    const mimeType = file.mime_type || file.mimeType || '';
    const fileName = file.filename || file.fileName || '';
    
    if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.includes('audio') || fileName.endsWith('.mp3')) {
      return <Music className="h-5 w-5 text-green-500" />;
    }
    if (mimeType.includes('image') || fileName.endsWith('.jpg')) {
      return <ImageIcon className="h-5 w-5 text-purple-500" />;
    }
    if (mimeType.includes('video') || fileName.endsWith('.mp4')) {
      return <Video className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Taille inconnue';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewFile = (file) => {
    const fileName = file.filename || file.fileName;
    if (fileName) {
      const fileUrl = fileAPI.getFileUrl(sessionId, fileName);
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownloadFile = (file) => {
    const fileName = file.filename || file.fileName;
    if (fileName) {
      const fileUrl = fileAPI.getFileUrl(sessionId, fileName);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/session/${sessionId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Retour à la session</span>
        </button>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {sessionData.title || 'Sans titre'} - Fichiers
        </h1>
        <p className="text-gray-600">
          {files.length} fichier{files.length > 1 ? 's' : ''} analysé{files.length > 1 ? 's' : ''} par l'IA
        </p>
      </div>

      {files.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun fichier
          </h3>
          <p className="text-gray-500">
            Aucun fichier n'a été uploadé pour cette session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="card flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {file.filename || file.fileName || 'Fichier sans nom'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{file.mime_type || file.mimeType || 'Type inconnu'}</span>
                    <span>•</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewFile(file)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Voir</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilesPage;