import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { sessionAPI } from './services/api';

import LandingPage from './components/landing/LandingPage';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import SessionSetup from './components/session/SessionSetup';
import SessionLanding from './components/session/SessionLanding';
import QuizPlayer from './components/tools/QuizPlayer';
import FlashcardDeck from './components/tools/FlashcardDeck';
import FilesPage from './components/tools/FilesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return !token ? children : <Navigate to="/dashboard" />;
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

// Redirige vers la dernière session de l'utilisateur
const LastSessionRedirect = ({ tool }) => {
  const navigate = useNavigate();
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionAPI.getAll(),
  });

  useEffect(() => {
    if (isLoading) return;
    const sessions = Array.isArray(sessionsData?.sessions)
      ? sessionsData.sessions
      : Array.isArray(sessionsData) ? sessionsData : [];
    
    if (sessions.length > 0) {
      const last = sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const id = last.session_id || last.id;
      navigate(`/session/${id}${tool ? `/${tool}` : ''}`, { replace: true });
    } else {
      navigate('/session/new', { replace: true });
    }
  }, [sessionsData, isLoading, navigate, tool]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="h-5 w-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
    </div>
  );
};

const QuizPlayerWrapper = () => {
  const { sessionId } = useParams();
  return <QuizPlayer sessionId={sessionId} />;
};

const FlashcardWrapper = () => {
  const { sessionId } = useParams();
  return <FlashcardDeck sessionId={sessionId} />;
};

const FilesWrapper = () => {
  const { sessionId } = useParams();
  return <FilesPage sessionId={sessionId} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/login" element={
              <PublicRoute><Login /></PublicRoute>
            } />

            <Route path="/" element={
              <PrivateRoute><Layout /></PrivateRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="session/new" element={<SessionSetup />} />
              <Route path="session/:sessionId" element={<SessionLanding />} />
              <Route path="session/:sessionId/quiz" element={<QuizPlayerWrapper />} />
              <Route path="session/:sessionId/flashcards" element={<FlashcardWrapper />} />
              <Route path="session/:sessionId/files" element={<FilesWrapper />} />

              {/* Routes sans sessionId → redirige vers la dernière session */}
              <Route path="quiz" element={<LastSessionRedirect tool="quiz" />} />
              <Route path="flashcards" element={<LastSessionRedirect tool="flashcards" />} />
              <Route path="files" element={<LastSessionRedirect tool="files" />} />
            </Route>

            <Route path="/app" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#111',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '13px',
              padding: '10px 14px',
            },
            success: { iconTheme: { primary: '#7c3aed', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
