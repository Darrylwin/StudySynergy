// src/components/session/ChatInput.jsx 
import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff, Paperclip, X, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ChatInput = ({ onSendMessage, isLoading, sessionId }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fonction pour convertir DOCX en texte
  const convertDocxToText = async (file) => {
    if (file.name.toLowerCase().endsWith('.docx') || 
        file.name.toLowerCase().endsWith('.doc')) {
      try {
        setIsConverting(true);
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        const newFile = new File(
          [result.value],
          `${file.name.replace(/\.[^/.]+$/, "")}.txt`,
          { type: 'text/plain' }
        );
        
        setIsConverting(false);
        return newFile;
      } catch (error) {
        setIsConverting(false);
        toast.error(`Impossible de convertir ${file.name}. Le fichier sera ignoré.`);
        return null;
      }
    }
    return file;
  };

  // Mutation pour ajouter un fichier à la session
  const addFileMutation = useMutation({
    mutationFn: async (file) => {
      const convertedFile = await convertDocxToText(file);
      if (!convertedFile) {
        throw new Error('Conversion échouée');
      }
      return sessionAPI.addFile(sessionId, convertedFile);
    },
    onSuccess: (data) => {
      toast.success('Fichier ajouté avec succès à la session !');
      setSelectedFile(null);
      setFilePreview(null);
      
      if (input.trim() === '') {
        setInput(`Parle-moi de ce fichier "${data.file_name}"...`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout du fichier');
    },
  });

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    
    if (selectedFile) {
      try {
        await addFileMutation.mutateAsync(selectedFile);
      } catch (error) {
        return;
      }
    }
    
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max 50MB) : ${file.name}`);
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'video/mp4',
      'video/mpeg',
      'video/webm'
    ];

    const validExtensions = /\.(pdf|doc|docx|txt|md|csv|json|jpg|jpeg|png|gif|webp|mp3|wav|mp4|webm)$/i;

    if (!validTypes.includes(file.type) && !file.name.match(validExtensions)) {
      toast.error(`Type de fichier non supporté : ${file.name}`);
      return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    e.target.value = '';
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Reconnaissance vocale non supportée');
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'fr-FR';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = () => {
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognitionInstance;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    const fileName = selectedFile.name.toLowerCase();
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) return '📋';
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) return '🖼️';
    if (fileName.endsWith('.mp3') || fileName.endsWith('.wav')) return '🎵';
    if (fileName.endsWith('.mp4') || fileName.endsWith('.webm')) return '🎬';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isUploading = addFileMutation.isLoading;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-full ml-0 lg:ml-64 transition-all duration-300">
        <div className="p-4">
          {/* Prévisualisation du fichier */}
          {selectedFile && (
            <div className="max-w-3xl mx-auto mb-3">
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">{getFileIcon()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {selectedFile.name}
                      {(selectedFile.name.toLowerCase().endsWith('.docx') || 
                        selectedFile.name.toLowerCase().endsWith('.doc')) && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          sera converti en .txt
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                  disabled={isUploading || isConverting}
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                </button>
              </div>
              
              {filePreview && (
                <div className="mt-2 flex justify-center">
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="max-h-32 rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Conteneur principal aligné */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center space-x-3">
              {/* Bouton d'ajout de fichier - centré verticalement */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isLoading || isConverting}
                  className={`p-3 rounded-xl transition-colors ${
                    isUploading || isLoading || isConverting
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title="Ajouter un fichier"
                >
                  {isUploading || isConverting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.mp4,.webm"
                />
              </div>
              
              {/* Zone de texte - prend tout l'espace */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyPress={handleKeyPress}
                  placeholder={selectedFile ? 
                    "Ajoutez un message avec votre fichier (optionnel)..." : 
                    "Posez une question ou décrivez votre besoin..."
                  }
                  className="w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none p-4 pr-24 min-h-[56px] max-h-[120px]"
                  rows="1"
                  disabled={isUploading || isConverting}
                />
                
                {/* Bouton microphone aligné à droite */}
                <div className="absolute right-3 bottom-3">
                  <button
                    onClick={handleVoiceInput}
                    disabled={isUploading || isLoading || isConverting}
                    className={`p-2 rounded-lg transition-colors ${
                      isRecording
                        ? 'bg-red-100 text-red-600'
                        : 'text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    title="Dictée vocale"
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Bouton d'envoi - centré verticalement */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedFile) || isLoading || isUploading || isConverting}
                  className={`p-4 rounded-xl transition-all ${
                    (input.trim() || selectedFile) && !isLoading && !isUploading && !isConverting
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading || isUploading || isConverting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Indicateurs d'état - centrés */}
          {(isUploading || isConverting) && (
            <div className="max-w-3xl mx-auto mt-3 text-center space-y-2">
              {isConverting && (
                <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Conversion du fichier DOCX en texte...</span>
                </div>
              )}
              {isUploading && (
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Ajout du fichier à la session...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;