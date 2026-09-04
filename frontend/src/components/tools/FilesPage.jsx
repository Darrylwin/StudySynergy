import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sessionAPI, fileAPI } from '../../services/api';
import { ChevronLeft, AlertCircle, FileText, Download, Eye } from 'lucide-react';

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
        <span className="h-6 w-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto py-20 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-ink mb-4">Session non trouvée</h2>
        <button onClick={() => navigate('/')} className="btn-secondary">← Retour</button>
      </div>
    );
  }

  const sessionData = session?.data || session;
  const files = sessionData?.files || [];

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const units = ['o', 'Ko', 'Mo'];
    const i = Math.min(2, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
  };

  const handleView = (file) => {
    const name = file.filename || file.fileName;
    if (name) window.open(fileAPI.getFileUrl(sessionId, name), '_blank');
  };

  const handleDownload = (file) => {
    const name = file.filename || file.fileName;
    if (!name) return;
    const a = document.createElement('a');
    a.href = fileAPI.getFileUrl(sessionId, name);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate(`/session/${sessionId}`)}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour à la session
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{sessionData.title || 'Sans titre'} · Fichiers</h1>
        <p className="text-sm text-muted mt-1">{files.length} fichier{files.length !== 1 ? 's' : ''}</p>
      </div>

      {files.length === 0 ? (
        <div className="card text-center py-16 text-muted">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun fichier uploadé pour cette session.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li key={i} className="card flex items-center gap-3 px-4 py-3">
              <FileText className="h-4 w-4 text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{file.filename || file.fileName || 'Sans nom'}</p>
                <p className="text-xs text-muted">{file.mime_type || file.mimeType || ''} {formatFileSize(file.size) && `· ${formatFileSize(file.size)}`}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleView(file)} className="btn-secondary py-1 px-2.5 text-xs gap-1">
                  <Eye className="h-3.5 w-3.5" /> Voir
                </button>
                <button onClick={() => handleDownload(file)} className="btn-secondary py-1 px-2.5 text-xs gap-1">
                  <Download className="h-3.5 w-3.5" /> Télécharger
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilesPage;
