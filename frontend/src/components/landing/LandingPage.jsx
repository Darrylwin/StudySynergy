import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Zap, Brain, BookOpen, ChevronDown } from 'lucide-react';
import Logo from '../Logo';

const features = [
  {
    icon: Brain,
    title: 'Résumé intelligent',
    desc: "L'IA analyse l'ensemble de vos documents et génère une synthèse structurée, prête à réviser.",
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: Zap,
    title: 'Quiz automatique',
    desc: 'Des questions générées depuis votre cours. Chronomètre, score, corrections détaillées.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: BookOpen,
    title: 'Flashcards',
    desc: 'Mémorisez les concepts clés avec des cartes recto/verso générées à partir de votre contenu.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: FileText,
    title: 'Tous les formats',
    desc: 'PDF, Word, images, audio, vidéo. Importez n\'importe quel support de cours.',
    color: 'bg-blue-100 text-blue-600',
  },
];

const steps = [
  { num: '01', title: 'Importez vos fichiers', desc: 'Glissez-déposez vos cours, peu importe le format.' },
  { num: '02', title: "L'IA analyse tout", desc: 'Gemini 1.5 Pro lit, comprend et structure votre contenu.' },
  { num: '03', title: 'Révisez efficacement', desc: 'Quiz, flashcards et résumé sont prêts instantanément.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleStart = () => navigate(token ? '/dashboard' : '/login');

  return (
    <div className="min-h-screen bg-faint text-ink">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-stone shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-lg tracking-tight">StudySynergy</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden md:block text-sm text-muted hover:text-ink transition-colors">
              Fonctionnalités
            </a>
            <a href="#how" className="hidden md:block text-sm text-muted hover:text-ink transition-colors">
              Comment ça marche
            </a>
            <button
              onClick={handleStart}
              className="btn-primary text-sm px-5 py-2"
            >
              {token ? 'Dashboard' : 'Commencer'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-xs font-semibold text-violet-700 mb-8">
            <Logo size="sm" className="h-4 w-4 rounded-md" />
            Propulsé par Gemini 1.5 Pro
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-ink leading-[1.05] tracking-tight mb-6">
            Vos cours,{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-violet-600">transformés</span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" aria-hidden>
                <path d="M2 9C50 3 150 1 298 9" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </span>
            {' '}en outils de révision.
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Importez n'importe quel fichier — PDF, audio, vidéo, images — 
            et obtenez <strong className="text-ink font-semibold">résumé, quiz et flashcards</strong> en quelques secondes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleStart}
              className="btn-accent text-base px-8 py-3.5 text-white font-semibold shadow-lg hover:shadow-violet-200"
            >
              {token ? 'Accéder à mon dashboard' : 'Créer mon compte gratuit'}
              <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="#how"
              className="btn-secondary text-sm px-6 py-3.5"
            >
              Voir comment ça marche
            </a>
          </div>

          <p className="text-xs text-muted mt-5">
            Gratuit · Aucune carte de crédit · 3 sessions incluses
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16 animate-bounce">
          <a href="#features" className="text-muted hover:text-ink transition-colors">
            <ChevronDown className="h-6 w-6" />
          </a>
        </div>
      </section>

      {/* ── MOCKUP / VISUAL ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="card shadow-float overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#f0ede8] border-b border-stone">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-lg px-3 py-1 text-xs text-muted text-center">
                  studysynergy.app/session/mon-cours
                </div>
              </div>
            </div>
            {/* Fake content */}
            <div className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Brain className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <div className="h-3.5 w-48 bg-gray-900 rounded-full" />
                  <div className="h-2.5 w-28 bg-gray-200 rounded-full mt-1.5" />
                </div>
                <div className="ml-auto flex gap-2">
                  {['Quiz', 'Flashcards', 'Fichiers'].map(t => (
                    <div key={t} className="px-3 py-1 bg-faint rounded-lg text-xs text-muted font-medium border border-stone">{t}</div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-100 rounded-full w-full" />
                <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                <div className="h-3 bg-violet-100 rounded-full w-2/3" />
                <div className="h-3 bg-gray-100 rounded-full w-5/6" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: 'Résumé', val: '✓ Généré', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { label: 'Quiz', val: '12 questions', color: 'bg-violet-50 text-violet-700 border-violet-200' },
                  { label: 'Flashcards', val: '24 cartes', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
                    <p className="text-xs font-medium opacity-70">{s.label}</p>
                    <p className="text-sm font-bold mt-0.5">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 py-20 bg-white border-y border-stone">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-violet-600 uppercase mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-bold text-ink">Tout ce dont vous avez besoin</h2>
            <p className="text-muted mt-3 max-w-lg mx-auto">
              De l'import de fichier à la révision complète, tout est automatisé.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map(f => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-ink mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-violet-600 uppercase mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-bold text-ink">Simple comme bonjour</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-px bg-stone" />
                )}
                <div className="text-4xl font-black text-stone mb-4">{s.num}</div>
                <h3 className="font-semibold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-10 shadow-float bg-gradient-to-br from-violet-600 to-violet-700 border-violet-500">
            <h2 className="text-3xl font-bold text-white mb-3">Prêt à réviser intelligemment ?</h2>
            <p className="text-violet-200 mb-8 leading-relaxed">
              Rejoignez des milliers d'étudiants qui utilisent StudySynergy pour optimiser leurs révisions.
            </p>
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 active:scale-95 transition-all shadow-sm text-base"
            >
              {token ? 'Accéder au dashboard' : 'Créer mon compte — c\'est gratuit'}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-8 border-t border-stone">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" className="h-6 w-6 rounded-lg" />
            <span className="font-semibold text-sm">StudySynergy</span>
          </div>
          <p className="text-xs text-muted">© 2024 StudySynergy · Propulsé par Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
