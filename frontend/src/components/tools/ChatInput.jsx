import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff, Paperclip, X, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import toast from 'react-hot-toast';

const convertDocxToText = async (file) => {
  const n = file.name.toLowerCase();
  if (!n.endsWith('.docx') && !n.endsWith('.doc')) return file;
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return new File([result.value], `${file.name.replace(/\.[^/.]+$/, '')}.txt`, { type: 'text/plain' });
  } catch {
    toast.error(`Impossible de convertir ${file.name}`);
    return null;
  }
};

const ChatInput = ({ onSendMessage, isLoading, sessionId }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const addFileMutation = useMutation({
    mutationFn: async (file) => {
      setIsConverting(true);
      try {
        const converted = await convertDocxToText(file);
        if (!converted) throw new Error('Conversion échouée');
        return sessionAPI.addFile(sessionId, converted);
      } finally {
        setIsConverting(false);
      }
    },
    onSuccess: (data) => {
      toast.success('Fichier ajouté');
      setSelectedFile(null);
      if (!input.trim()) setInput(`Parle-moi de "${data.file_name}"...`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'ajout du fichier');
    },
  });

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    if (selectedFile) {
      try { await addFileMutation.mutateAsync(selectedFile); } catch { return; }
    }
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
    if (file.size > 50 * 1024 * 1024) { toast.error(`Fichier trop volumineux (max 50 Mo)`); return; }
    setSelectedFile(file);
    e.target.value = '';
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Reconnaissance vocale non supportée');
      return;
    }
    if (!recognitionRef.current) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const r = new SR();
      r.lang = 'fr-FR';
      r.onresult = (e) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
      r.onerror = () => setIsRecording(false);
      r.onend = () => setIsRecording(false);
      recognitionRef.current = r;
    }
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else { recognitionRef.current.start(); setIsRecording(true); }
  };

  const busy = isLoading || addFileMutation.isLoading || isConverting;
  const canSend = (input.trim() || selectedFile) && !busy;

  return (
    <div>
      {/* File preview */}
      {selectedFile && (
        <div className="flex items-center gap-3 bg-white border border-stone rounded-lg px-3 py-2 mb-2 text-sm">
          <span className="text-muted truncate flex-1">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="text-muted hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 bg-white border border-stone rounded-xl px-3 py-2 shadow-sm">
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="p-1.5 text-muted hover:text-ink disabled:opacity-40 transition-colors shrink-0"
          title="Joindre un fichier"
        >
          {busy && addFileMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.mp4,.webm"
          onChange={handleFileSelect}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyPress={handleKeyPress}
          placeholder="Posez une question sur vos cours..."
          className="flex-1 resize-none bg-transparent text-sm text-ink placeholder-muted outline-none min-h-[36px] max-h-[120px] py-1"
          rows={1}
          disabled={busy}
        />

        {/* Mic */}
        <button
          onClick={handleVoiceInput}
          disabled={busy}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            isRecording ? 'text-red-500 bg-red-50' : 'text-muted hover:text-ink disabled:opacity-40'
          }`}
          title="Dictée vocale"
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            canSend ? 'text-white bg-ink hover:bg-gray-800' : 'text-muted bg-faint cursor-not-allowed'
          }`}
        >
          {busy && isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
