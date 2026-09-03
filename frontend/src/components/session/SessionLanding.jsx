import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import GlobalSummary from '../tools/GlobalSummary';
import ChatInput from '../tools/ChatInput';
import { ChevronLeft, Share2, AlertCircle, Copy, Volume2, ThumbsUp, ThumbsDown } from 'lucide-react';

const SessionLanding = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionAPI.get(sessionId),
  });

  const chatMutation = useMutation({
    mutationFn: (message) => sessionAPI.chat(sessionId, message),
    onMutate: (message) => {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), text: message, sender: 'user', timestamp: new Date() },
        { id: Date.now() + 1, sender: 'ai', isLoading: true, timestamp: new Date() },
      ]);
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        { id: Date.now() + 2, text: data.response || data.message || 'Désolé, pas de réponse.', sender: 'ai', timestamp: new Date() },
      ]);
    },
    onError: () => {
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        { id: Date.now() + 3, text: 'Une erreur est survenue. Réessayez.', sender: 'ai', isError: true, timestamp: new Date() },
      ]);
    },
  });

  const handleCopy = (text) => navigator.clipboard.writeText(text);
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      window.speechSynthesis.speak(u);
    }
  };
  const handleFeedback = (id, type) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: type } : m));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="h-6 w-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="max-w-md mx-auto py-20 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-ink mb-2">Session inaccessible</h2>
        <button onClick={() => navigate('/')} className="btn-secondary">← Retour</button>
      </div>
    );
  }

  const session = sessionData?.data || sessionData;

  return (
    <div className="min-h-screen bg-faint">
      <div className="max-w-3xl mx-auto px-4 py-6 pb-36">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-3 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Dashboard
            </button>
            <h1 className="text-2xl font-bold text-ink">{session.title || 'Session'}</h1>
            <p className="text-sm text-muted mt-1">
              {new Date(session.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {session.files?.length > 0 && ` · ${session.files.length} document${session.files.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="btn-secondary p-2 shrink-0"
            title="Copier le lien"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="card p-6 mb-8">
          <GlobalSummary content={session.summary || session.global_summary} sessionId={sessionId} />
        </div>

        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Conversation</p>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[82%] group">
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    message.sender === 'user'
                      ? 'bg-ink text-white'
                      : message.isError
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-white border border-stone text-ink'
                  }`}>
                    {message.isLoading ? (
                      <div className="flex gap-1 py-0.5">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
                  </div>

                  {/* AI actions */}
                  {!message.isLoading && !message.isError && message.sender === 'ai' && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleCopy(message.text)} className="p-1 text-muted hover:text-ink rounded">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => speakText(message.text)} className="p-1 text-muted hover:text-ink rounded">
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, 'like')}
                        className={`p-1 rounded ${message.feedback === 'like' ? 'text-green-600' : 'text-muted hover:text-ink'}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, 'dislike')}
                        className={`p-1 rounded ${message.feedback === 'dislike' ? 'text-red-500' : 'text-muted hover:text-ink'}`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Fixed chat input */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-56 bg-faint border-t border-stone py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={(msg) => chatMutation.mutate(msg)}
            isLoading={chatMutation.isLoading}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionLanding;
