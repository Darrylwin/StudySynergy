import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '../Logo';

const Login = () => {
  const { login, register, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!formData.email || !formData.password) { setLocalError('Email et mot de passe requis'); return; }
    if (!isLogin) {
      if (!formData.name) { setLocalError('Nom requis'); return; }
      if (formData.password !== formData.confirmPassword) { setLocalError('Les mots de passe ne correspondent pas'); return; }
      if (formData.password.length < 6) { setLocalError('Mot de passe trop court (min. 6 caractères)'); return; }
    }
    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await register({ email: formData.email, password: formData.password, name: formData.name });
      if (result.success) navigate('/dashboard', { replace: true });
      else setLocalError(result.error);
    } catch {
      setLocalError('Erreur de connexion au serveur');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-faint flex">

      {/* Panneau gauche */}
      <div className="hidden lg:flex lg:w-5/12 bg-ink flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="font-bold text-white text-base">StudySynergy</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
            Révisez plus vite,<br />retenez mieux.
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Importez vos cours et obtenez instantanément résumés intelligents,
            quiz personnalisés et flashcards générés par Gemini AI.
          </p>
          <div className="space-y-3">
            {[
              'Résumé complet en quelques secondes',
              'Quiz avec corrections détaillées',
              'Flashcards pour mémoriser efficacement',
              'PDF, audio, vidéo et plus encore',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">© 2024 StudySynergy</p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Logo mobile uniquement */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <Logo size="sm" />
            <span className="font-bold text-lg">StudySynergy</span>
          </div>

          <h1 className="text-2xl font-bold text-ink mb-1">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-sm text-muted mb-8">
            {isLogin
              ? 'Accédez à vos sessions et outils de révision.'
              : '3 sessions gratuites incluses, sans carte bancaire.'}
          </p>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-faint rounded-xl border border-stone mb-7">
            {[['Connexion', true], ['Inscription', false]].map(([label, val]) => (
              <button
                key={label}
                onClick={() => { setIsLogin(val); setLocalError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  isLogin === val ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Nom complet</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  className="input" placeholder="Jean Dupont" disabled={authLoading} />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="input" placeholder="vous@exemple.com" disabled={authLoading} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={formData.password} onChange={handleChange}
                  className="input pr-10" placeholder="••••••••" disabled={authLoading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Confirmer le mot de passe</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} className="input" placeholder="••••••••" disabled={authLoading} />
              </div>
            )}

            {displayError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {displayError}
              </div>
            )}

            <button type="submit" disabled={authLoading} className="btn-primary w-full justify-center py-3 mt-1">
              {authLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Connexion...' : 'Inscription...'}
                </span>
              ) : (
                isLogin ? 'Se connecter' : 'Créer mon compte'
              )}
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-6">
            En continuant, vous acceptez nos conditions d'utilisation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
