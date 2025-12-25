// src/App.jsx 
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Pages publiques
import LandingPage from './components/landing/LandingPage';
import Login from './components/auth/Login';

// Layout and main components (protégés)
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import SessionSetup from './components/session/SessionSetup';
import SessionLanding from './components/session/SessionLanding';

// Tool components
import QuizPlayer from './components/tools/QuizPlayer';
import FlashcardDeck from './components/tools/FlashcardDeck';
import ChatTool from './components/tools/ChatInput';
import FilesPage from './components/tools/FilesPage';

// Créer le client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// PublicRoute - Empêche l'accès à /login si déjà connecté
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return !token ? children : <Navigate to="/dashboard" />;
};

// PrivateRoute - Protège les routes nécessitant authentification
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

// Wrapper pour QuizPlayer
const QuizPlayerWrapper = () => {
  const { sessionId } = useParams();
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <QuizPlayer sessionId={sessionId} />
    </div>
  );
};

// Wrapper pour FlashcardDeck
const FlashcardDeckWrapper = () => {
  const { sessionId } = useParams();
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <FlashcardDeck sessionId={sessionId} />
    </div>
  );
};

// Wrapper pour ChatTool
const ChatToolWrapper = () => {
  const { sessionId } = useParams();
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <ChatTool sessionId={sessionId} />
    </div>
  );
};

// Wrapper pour FilesPage
const FilesPageWrapper = () => {
  const { sessionId } = useParams();
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <FilesPage sessionId={sessionId} />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Page d'accueil publique */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Page de login (accessible seulement si non connecté) */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* Application protégée - TOUTES LES ROUTES DANS LE LAYOUT */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="session/new" element={<SessionSetup />} /> {/* CHANGÉ : route directe */}
              <Route path="session/:sessionId" element={<SessionLanding />} />
              <Route path="session/:sessionId/quiz" element={<QuizPlayerWrapper />} />
              <Route path="session/:sessionId/flashcards" element={<FlashcardDeckWrapper />} />
              <Route path="session/:sessionId/chat" element={<ChatToolWrapper />} />
              <Route path="session/:sessionId/files" element={<FilesPageWrapper />} />
            </Route>
            
            {/* Redirections pour compatibilité */}
            <Route path="/app" element={<Navigate to="/dashboard" />} />
            <Route path="/home" element={<Navigate to="/" />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
