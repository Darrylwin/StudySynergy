import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import { Upload, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.wav', '.mp4', '.webm'];

const getFileType = (name) => {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return 'word';
  if (/\.(mp3|wav)$/.test(n)) return 'audio';
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(n)) return 'image';
  if (/\.(mp4|webm)$/.test(n)) return 'video';
  if (/\.(txt|md|csv)$/.test(n)) return 'text';
  return 'other';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  const units = ['o', 'Ko', 'Mo'];
  const i = Math.min(2, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
};

const convertDocxToText = async (file) => {
  const n = file.name.toLowerCase();
  if (!n.endsWith('.docx') && !n.endsWith('.doc')) return file;
  try {
    const mammoth = (await import('mammoth')).default;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return new File([result.value], `${file.name.replace(/\.[^/.]+$/, '')}.txt`, { type: 'text/plain' });
  } catch (err) {
    throw new Error(`Impossible de convertir ${file.name}`);
  }
};

const SessionSetup = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (rawFiles) => {
      const converted = [];
      for (const f of rawFiles) {
        try {
          converted.push(await convertDocxToText(f));
        } catch (err) {
          toast.error(err.message);
          converted.push(f);
        }
      }
      return sessionAPI.create(converted);
    },
    onSuccess: (data) => {
      toast.success('Session créée');
      setTimeout(() => navigate(`/session/${data.session_id}`), 1000);
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : err.message || 'Erreur lors de la création';
      toast.error(msg);
    },
  });

  const addFiles = useCallback((fileList) => {
    const valid = Array.from(fileList).filter(f => {
      const ext = f.name.toLowerCase().match(/\.[^/.]+$/)?.[0] || '';
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        toast.error(`Format non supporté : ${f.name}`);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`Fichier trop volumineux (max 50 Mo) : ${f.name}`);
        return false;
      }
      return true;
    });
    setFiles(prev => [
      ...prev,
      ...valid.map(f => ({ file: f, id: Math.random().toString(36).slice(2), name: f.name, size: f.size, type: getFileType(f.name) }))
    ]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const hasWord = files.some(f => f.type === 'word');

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Nouvelle session</h1>
        <p className="text-sm text-muted mt-1">
          Importez vos fichiers de cours. L'IA génère résumé, quiz et flashcards automatiquement.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all mb-6 cursor-pointer ${
          dragActive
            ? 'border-ink bg-gray-50'
            : 'border-stone hover:border-gray-400 hover:bg-gray-50/50'
        }`}
      >
        <div className="h-14 w-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className="h-7 w-7 text-gray-600" />
        </div>
        <p className="text-sm font-semibold text-ink mb-1">Déposez vos fichiers ici</p>
        <p className="text-xs text-muted mb-5">PDF, Word, images, audio, vidéo · Max 50 Mo</p>
        <label className="btn-secondary cursor-pointer">
          Parcourir les fichiers
          <input
            type="file"
            multiple
            className="hidden"
            accept={SUPPORTED_EXTENSIONS.join(',')}
            onChange={e => addFiles(e.target.files)}
          />
        </label>
        <p className="text-xs text-muted mt-3">
          {SUPPORTED_EXTENSIONS.join(' · ')}
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-ink mb-3">{files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}</p>
          <ul className="space-y-2">
            {files.map(f => (
              <li key={f.id} className="card flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate font-medium">{f.name}</p>
                  <p className="text-xs text-muted">
                    {formatSize(f.size)}
                    {f.type === 'word' && <span className="ml-2 text-amber-600">sera converti en .txt</span>}
                  </p>
                </div>
                <button
                  onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                  disabled={createMutation.isLoading}
                  className="p-1 text-muted hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {hasWord && (
            <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3" />
              Les fichiers Word sont convertis en texte avant analyse.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {createMutation.isError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Une erreur est survenue. Vérifiez les formats de fichiers et réessayez.</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={() => createMutation.mutate(files.map(f => f.file))}
        disabled={files.length === 0 || createMutation.isLoading}
        className="btn-accent w-full justify-center py-3"
      >
        {createMutation.isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          'Créer la session'
        )}
      </button>

      {createMutation.isLoading && (
        <p className="text-xs text-center text-muted mt-3">
          L'IA analyse vos fichiers, cela peut prendre quelques minutes.
        </p>
      )}
    </div>
  );
};

export default SessionSetup;
