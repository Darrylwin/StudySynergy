import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import GlobalSummary from '../tools/GlobalSummary';
import ChatInput from '../tools/ChatInput';
import {
  ChevronLeft,
  FileText,
  Clock,
  Share2,
  AlertCircle,
  Brain,
  Copy,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';

const SessionLanding = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { 
    data: sessionData, 
    isLoading: sessionLoading,
    error: sessionError 
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionAPI.get(sessionId),
  });

  const chatMutation = useMutation({
    mutationFn: (message) => sessionAPI.chat(sessionId, message),
    
    onMutate: async (message) => {
      const userMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date(),
      };
      
      const typingIndicator = {
        id: Date.now() + 1,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isLoading: true,
      };
      
      setMessages(prev => [...prev, userMessage, typingIndicator]);
    },
    
    onSuccess: (data) => {
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      const aiMessage = {
        id: Date.now() + 2,
        text: data.response || data.message || "Désolé, je n'ai pas pu générer de réponse.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    
    onError: () => {
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      const errorMessage = {
        id: Date.now() + 3,
        text: "Une erreur est survenue. Veuillez réessayer.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = (message) => {
    if (!message.trim() || chatMutation.isLoading) return;
    chatMutation.mutate(message.trim());
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // Notification retirée
  };

  const handleFeedback = (messageId, type) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: type } : msg
    ));
    // Notification retirée
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement...</p>
      </div>
    );
  }

  if (sessionError || !sessionData) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Session inaccessible</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const session = sessionData?.data || sessionData;
  const files = session?.files || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Retour</span>
            </button>
            
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="p-2 hover:bg-white rounded-full shadow-sm transition-all text-gray-600"
              title="Copier le lien"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {session.title || 'Session'}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(session.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{files.length} document{files.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </header>

        <main className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <GlobalSummary 
            content={session.summary || session.global_summary}
            sessionId={sessionId}
          />
        </main>

        {messages.length > 0 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-4">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Assistant IA</h3>
            </div>
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%] group">
                  <div className={`rounded-2xl p-4 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : message.isError
                      ? 'bg-red-50 border border-red-100 text-red-800 rounded-bl-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {message.isLoading ? (
                      <div className="flex space-x-1 py-1">
                        <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    )}
                  </div>
                  
                  {!message.isLoading && !message.isError && message.sender === 'ai' && (
                    <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleCopy(message.text)} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-400"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => speakText(message.text)} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-400"><Volume2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleFeedback(message.id, 'like')} className={`p-1.5 rounded-md ${message.feedback === 'like' ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`}><ThumbsUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleFeedback(message.id, 'dislike')} className={`p-1.5 rounded-md ${message.feedback === 'dislike' ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:bg-gray-200'}`}><ThumbsDown className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-10 pb-6">
        <div className="max-w-4xl mx-auto px-4">
          <ChatInput 
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isLoading}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionLanding;