// src/components/session/SessionSetup.jsx - VERSION CORRIGÉE
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import {
  Upload,
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  X,
  Check,
  Loader2,
  File,
  AlertCircle,
  Sparkles,
  FileWarning,
  RefreshCw,
  Brain
  } from 'lucide-react';
import toast from 'react-hot-toast';

const SessionSetup = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [convertingFiles, setConvertingFiles] = useState({});

  // Fonction pour convertir DOCX en texte
  const convertDocxToText = async (file) => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      try {
        console.log(`Conversion de ${file.name} en texte...`);
        
        // Import dynamique de mammoth
        const mammoth = (await import('mammoth')).default;
        
        // Lire le fichier comme ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Extraire le texte
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        console.log(`Conversion réussie: ${file.name} -> ${result.value.length} caractères`);
        
        // Créer un nouveau fichier texte
        const convertedFile = new File(
          [result.value],
          `${file.name.replace(/\.[^/.]+$/, "")}.txt`,
          { type: 'text/plain' }
        );
        
        return convertedFile;
      } catch (error) {
        console.error('Erreur détaillée conversion DOCX:', error);
        throw new Error(`Impossible de convertir ${file.name}: ${error.message}`);
      }
    }
    
    // Retourner le fichier tel quel si pas DOCX
    return file;
  };

  // Mutation pour créer une session
  const createSessionMutation = useMutation({
    mutationFn: async (files) => {
      console.log('Début de création de session avec fichiers:', files.map(f => f.name));
      
      // Convertir les fichiers DOCX
      const convertedFiles = [];
      const conversionErrors = [];
      
      for (const file of files) {
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          try {
            setConvertingFiles(prev => ({ ...prev, [file.name]: true }));
            const convertedFile = await convertDocxToText(file);
            convertedFiles.push(convertedFile);
            setConvertingFiles(prev => ({ ...prev, [file.name]: false }));
          } catch (error) {
            console.error('Erreur lors de la conversion:', error);
            conversionErrors.push(error.message);
            // Garder le fichier original si conversion échoue
            convertedFiles.push(file);
            setConvertingFiles(prev => ({ ...prev, [file.name]: false }));
          }
        } else {
          convertedFiles.push(file);
        }
      }
      
      // Avertir des erreurs de conversion
      if (conversionErrors.length > 0) {
        toast.error(
          <div className="space-y-1">
            <p className="font-medium">Problèmes de conversion</p>
            <ul className="text-sm">
              {conversionErrors.slice(0, 3).map((err, idx) => (
                <li key={idx}>• {err}</li>
              ))}
            </ul>
            {conversionErrors.length > 3 && (
              <p className="text-xs">Et {conversionErrors.length - 3} autres erreurs...</p>
            )}
          </div>,
          { duration: 8000 }
        );
      }
      
      console.log('Fichiers après conversion:', convertedFiles.map(f => ({ 
        name: f.name, 
        type: f.type,
        size: f.size 
      })));
      
      // Envoyer au backend
      return await sessionAPI.create(convertedFiles);
    },
    onSuccess: (data) => {
      toast.success('Session créée avec succès !');
      if (data.title) {
        toast.success(`Titre généré : ${data.title}`);
      }
      
      setTimeout(() => {
        navigate(`/session/${data.session_id}`);
      }, 1500);
    },
    onError: (error) => {
      console.error('Erreur complète:', error);
      
      let errorMessage = error.message;
      if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      }
      
      if (errorMessage.includes('Unsupported MIME type')) {
        toast.error(
          <div className="space-y-1">
            <p className="font-medium">Format non supporté</p>
            <p className="text-sm">Gemini ne supporte pas certains formats</p>
            <p className="text-xs mt-2">
              Formats acceptés: PDF, TXT, CSV, MD, JPG, PNG, WEBP, MP3, MP4
            </p>
            <p className="text-xs">Les fichiers Word sont convertis en texte automatiquement</p>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(
          <div className="space-y-1">
            <p className="font-medium">Erreur lors de la création</p>
            <p className="text-sm">{errorMessage}</p>
          </div>,
          { duration: 5000 }
        );
      }
    },
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (fileList) => {
    const validFiles = fileList.filter(file => {
      // Formats supportés
      const supportedExtensions = [
        '.pdf',
        '.doc', '.docx',
        '.txt', '.md', '.csv',
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.mp3', '.wav',
        '.mp4', '.webm'
      ];
      
      const fileExtension = file.name.toLowerCase().match(/\.[^/.]+$/)?.[0] || '';
      
      if (!supportedExtensions.includes(fileExtension)) {
        toast.error(
          <div>
            <p>Format non supporté: {file.name}</p>
            <p className="text-sm">Extensions acceptées: {supportedExtensions.join(', ')}</p>
          </div>
        );
        return false;
      }
      
      // Vérifier la taille (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Fichier trop volumineux (max 50MB): ${file.name}`);
        return false;
      }
      
      return true;
    });

    const newFiles = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: getFileType(file.name),
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const getFileType = (fileName) => {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.endsWith('.pdf')) return 'pdf';
    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return 'word';
    if (/\.(mp3|wav|flac|ogg)$/.test(lowerName)) return 'audio';
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/.test(lowerName)) return 'image';
    if (/\.(mp4|webm|mov|avi)$/.test(lowerName)) return 'video';
    if (/\.(txt|md)$/.test(lowerName)) return 'text';
    if (lowerName.endsWith('.csv')) return 'csv';
    return 'other';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      case 'audio': return <Music className="h-5 w-5 text-green-500" />;
      case 'image': return <ImageIcon className="h-5 w-5 text-purple-500" />;
      case 'video': return <Video className="h-5 w-5 text-blue-500" />;
      case 'word': 
        return (
          <div className="relative" title="Sera converti en texte">
            <FileText className="h-5 w-5 text-blue-600" />
            <RefreshCw className="h-3 w-3 text-yellow-600 absolute -top-1 -right-1" />
          </div>
        );
      case 'text': return <FileText className="h-5 w-5 text-gray-500" />;
      case 'csv': return <FileText className="h-5 w-5 text-green-600" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const removeFile = (id) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove) {
      setConvertingFiles(prev => {
        const newState = { ...prev };
        delete newState[fileToRemove.name];
        return newState;
      });
    }
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateSession = async () => {
    if (files.length === 0) {
      toast.error('Veuillez sélectionner au moins un fichier');
      return;
    }

    // Vérifier si des conversions sont en cours
    const anyConverting = Object.values(convertingFiles).some(v => v);
    if (anyConverting) {
      toast.error('Veuillez attendre la fin des conversions');
      return;
    }

    const fileObjects = files.map(f => f.file);
    
    // Mettre à jour le statut des fichiers
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));
    
    // Lancer la mutation
    createSessionMutation.mutate(fileObjects);
  };

  const canCreateSession = files.length > 0;
  const isConverting = Object.values(convertingFiles).some(v => v);
  const hasWordFiles = files.some(f => f.type === 'word');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Créer une Nouvelle Session
            </h1>
            <p className="text-gray-600">
              Les fichiers Word (.doc, .docx) sont automatiquement convertis en texte
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Zone d'upload */}
        <div className="lg:col-span-2">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-10 w-10 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Déposez vos fichiers de cours
              </h3>
              
              <p className="text-gray-600 mb-4">
                Supports: PDF, Word, images, audio, vidéo, texte
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">PDF</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded flex items-center gap-1">
                  Word <RefreshCw className="h-3 w-3" />
                </span>
                <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded">Images</span>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">Audio</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Vidéo</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Texte</span>
              </div>
              
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.mp4,.webm"
              />
              
              <label
                htmlFor="file-upload"
                className="btn-primary inline-flex items-center space-x-2 cursor-pointer"
              >
                <Upload className="h-5 w-5" />
                <span>Sélectionner des fichiers</span>
              </label>
              
    
              
              {hasWordFiles && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Les fichiers Word seront automatiquement convertis en texte
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Liste des fichiers */}
          {files.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Fichiers sélectionnés ({files.length})
                </h3>
                
                {hasWordFiles && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <RefreshCw className="h-4 w-4" />
                    <span>Conversion Word → Texte automatique</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-colors ${
                      convertingFiles[file.name]
                        ? 'border-yellow-300 bg-yellow-50'
                        : file.status === 'uploading'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
                      <div className={`p-2 rounded-lg ${
                        convertingFiles[file.name] ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {getFileIcon(file.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          {convertingFiles[file.name] && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Conversion...
                            </span>
                          )}
                          {file.type === 'word' && !convertingFiles[file.name] && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              → .txt
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="capitalize">{file.type}</span>
                          
                          {file.status === 'uploading' && (
                            <span className="text-blue-600">
                              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                              Envoi...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-2 sm:mt-0"
                      disabled={createSessionMutation.isLoading || convertingFiles[file.name]}
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Info sur la conversion */}
              {hasWordFiles && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Conversion automatique</p>
                      <p className="mt-1">
                        Les fichiers Word seront convertis en texte avant d'être analysés par l'IA.
                        Cela permet à Gemini de lire leur contenu.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div className="lg:col-span-1">
          <div className="card lg:sticky lg:top-24">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                IA Gemini 1.5 Pro
              </h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                   L'IA va automatiquement :
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Analyser le contenu de tous vos fichiers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Comprendre le sujet principal</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Générer un titre pertinent</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Créer un résumé complet</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Préparer la génération de quiz...</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleCreateSession}
                  disabled={!canCreateSession || createSessionMutation.isLoading || isConverting}
                  className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold transition-all ${
                    canCreateSession && !createSessionMutation.isLoading && !isConverting
                      ? 'btn-primary hover:shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {createSessionMutation.isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Création en cours...</span>
                    </>
                  ) : isConverting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                      <span>Conversion...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Créer la Session</span>
                    </>
                  )}
                </button>
                
                {!canCreateSession && (
                  <p className="text-sm text-yellow-600 mt-2 text-center">
                    Sélectionnez au moins un fichier
                  </p>
                )}
                
                {isConverting && (
                  <p className="text-sm text-yellow-600 mt-2 text-center">
                    Conversion des fichiers Word en cours...
                  </p>
                )}
                
                {createSessionMutation.isLoading && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-sm text-blue-700">
                        L'IA analyse vos fichiers...
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Cette opération peut prendre quelques minutes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;