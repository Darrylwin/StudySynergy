// src/components/tools/FlashcardDeck.jsx 
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  BookOpen,
  CheckCircle,
  XCircle,
  Download,
  Volume2,
  Wand2,
  AlertCircle,
  HelpCircle,
  Zap,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const FlashcardDeck = ({ sessionId, flashcardsData }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const [difficulty, setDifficulty] = useState({});
  const [deck, setDeck] = useState([]);
  const [filter, setFilter] = useState('all');
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Charger les artefacts existants
  const { 
    data: artifactsData, 
    isLoading: isLoadingArtifacts,
    error: artifactsError,
    refetch: refetchArtifacts 
  } = useQuery({
    queryKey: ['artifacts', sessionId],
    queryFn: () => sessionAPI.getArtifacts(sessionId),
  });

  // Mutation pour générer des flashcards
  const generateFlashcardsMutation = useMutation({
    mutationFn: () => sessionAPI.generateTool(sessionId, 'flashcards'),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (responseData) => {
      let extractedDeck = [];
      
      if (responseData?.content?.flashcards) {
        extractedDeck = extractFlashcardsFromArray(responseData.content.flashcards);
      }
      else if (responseData?.flashcards) {
        extractedDeck = extractFlashcardsFromArray(responseData.flashcards);
      }
      else if (Array.isArray(responseData?.content)) {
        extractedDeck = extractFlashcardsFromArray(responseData.content);
      }
      else if (responseData) {
        extractedDeck = extractFlashcardsFromObject(responseData);
      }
      
      if (extractedDeck.length > 0) {
        setDeck(extractedDeck);
        setKnownCards(new Set());
        setDifficulty({});
        setCurrentCard(0);
        toast.success(`${extractedDeck.length} flashcards générées !`);
      } else {
        toast.error('Flashcards générées mais format non reconnu');
      }
      
      refetchArtifacts();
    },
    onError: (error) => {
      let errorMessage = 'Erreur lors de la génération des flashcards';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(d => d.msg).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Erreur: ${errorMessage}`);
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Fonctions d'extraction
  const extractFlashcardsFromArray = (array) => {
    if (!Array.isArray(array)) return [];
    
    return array.map((item, index) => {
      if (item.front && item.back) {
        return {
          id: item.id || index,
          front: item.front,
          back: item.back,
          category: item.category,
          explanation: item.explanation,
          difficulty: item.difficulty,
          tags: item.tags,
          raw: item
        };
      }
      
      if (item.question && (item.answer || item.options)) {
        return {
          id: item.id || index,
          front: item.question,
          back: item.answer || (item.options ? `Options: ${item.options.join(', ')}` : 'Réponse'),
          category: 'Quiz converti',
          explanation: item.explanation,
          difficulty: 'medium',
          raw: item
        };
      }
      
      if (typeof item === 'object') {
        return {
          id: index,
          front: Object.keys(item)[0] || `Concept ${index + 1}`,
          back: Object.values(item)[0] || JSON.stringify(item),
          raw: item
        };
      }
      
      return {
        id: index,
        front: `Point ${index + 1}`,
        back: item,
        raw: item
      };
    });
  };

  const extractFlashcardsFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    
    const flashcards = [];
    
    const findFlashcards = (data) => {
      if (!data) return;
      
      if (Array.isArray(data)) {
        const extracted = extractFlashcardsFromArray(data);
        flashcards.push(...extracted);
        return;
      }
      
      if (typeof data === 'object') {
        if (data.flashcards && Array.isArray(data.flashcards)) {
          const extracted = extractFlashcardsFromArray(data.flashcards);
          flashcards.push(...extracted);
        }
        
        if (data.questions && Array.isArray(data.questions)) {
          const extracted = extractFlashcardsFromArray(data.questions);
          flashcards.push(...extracted);
        }
        
        Object.values(data).forEach((value) => {
          findFlashcards(value);
        });
      }
    };
    
    findFlashcards(obj);
    return flashcards;
  };

  // Fonction pour convertir un quiz en flashcards
  const convertQuizToFlashcards = (quizData) => {
    let questions = [];
    
    if (quizData.questions && Array.isArray(quizData.questions)) {
      questions = quizData.questions;
    } else if (Array.isArray(quizData)) {
      questions = quizData;
    } else if (quizData.content?.questions) {
      questions = quizData.content.questions;
    } else if (quizData.content && Array.isArray(quizData.content)) {
      questions = quizData.content;
    }
    
    if (questions.length === 0) {
      toast.error('Aucune question trouvée dans le quiz');
      return;
    }
    
    const flashcards = questions.map((q, index) => {
      let correctAnswer = '';
      if (q.options && q.answer_index !== undefined) {
        correctAnswer = q.options[q.answer_index] || `Option ${q.answer_index + 1}`;
      } else if (q.correct_answer !== undefined) {
        correctAnswer = q.options?.[q.correct_answer] || `Réponse ${q.correct_answer + 1}`;
      } else if (q.answer) {
        correctAnswer = q.answer;
      }
      
      return {
        id: index,
        front: q.question || `Question ${index + 1}`,
        back: correctAnswer || q.explanation || "Réponse disponible",
        explanation: q.explanation,
        category: "Quiz converti",
        difficulty: "medium",
        options: q.options,
        answerIndex: q.answer_index,
        raw: q
      };
    });
    
    setDeck(flashcards);
    setKnownCards(new Set());
    setDifficulty({});
    setCurrentCard(0);
    toast.success(`${flashcards.length} flashcards créées depuis le quiz !`);
  };

  // Mettre à jour le deck
  useEffect(() => {
    let extractedDeck = [];
    
    if (flashcardsData) {
      if (Array.isArray(flashcardsData)) {
        extractedDeck = extractFlashcardsFromArray(flashcardsData);
      } else {
        extractedDeck = extractFlashcardsFromObject(flashcardsData);
      }
      setDeck(extractedDeck);
      return;
    }
    
    if (artifactsData) {
      const artifacts = artifactsData.artifacts || {};
      
      if (artifacts.flashcards) {
        if (Array.isArray(artifacts.flashcards)) {
          extractedDeck = extractFlashcardsFromArray(artifacts.flashcards);
        } else {
          extractedDeck = extractFlashcardsFromObject(artifacts.flashcards);
        }
      }
      else if (artifacts.quiz && !hasShownNotification) {
        setTimeout(() => {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <HelpCircle className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Aucune flashcard trouvée
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Vous avez un quiz disponible. Voulez-vous le convertir en flashcards ?
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          convertQuizToFlashcards(artifacts.quiz);
                          toast.dismiss(t.id);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Convertir le quiz
                      </button>
                      <button
                        onClick={() => {
                          generateFlashcardsMutation.mutate();
                          toast.dismiss(t.id);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-ink hover:bg-gray-800"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Générer de nouvelles
                      </button>
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Ignorer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ), {
            duration: 10000,
          });
        }, 1000);
        
        setHasShownNotification(true);
      }
      
      setDeck(extractedDeck);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashcardsData, artifactsData, hasShownNotification]);

  const handleGenerateFlashcards = () => {
    generateFlashcardsMutation.mutate();
  };

  const handleForceConvertQuiz = () => {
    if (artifactsData?.artifacts?.quiz) {
      convertQuizToFlashcards(artifactsData.artifacts.quiz);
    } else {
      toast.error('Aucun quiz disponible pour conversion');
    }
  };

  // Navigation et autres fonctions
  const handleNext = () => {
    if (currentCard < deck.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    setDeck(newDeck);
    setCurrentCard(0);
    toast.success('Deck mélangé !');
  };

  const handleReset = () => {
    setCurrentCard(0);
    setKnownCards(new Set());
    setDifficulty({});
    setIsFlipped(false);
    toast.success('Progression réinitialisée');
  };

  // CORRECTION : Fonction corrigée pour marquer une carte comme connue
  const markAsKnown = (cardIndex) => {
    const cardId = deck[cardIndex]?.id || cardIndex;
    setKnownCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
    
    const isNowKnown = !knownCards.has(cardId);
    if (isNowKnown) {
      toast.success('Carte marquée comme connue !');
    } else {
      toast.success('Carte retirée des cartes connues');
    }
  };

  const setCardDifficulty = (cardIndex, level) => {
    const cardId = deck[cardIndex]?.id || cardIndex;
    setDifficulty(prev => {
      const newDifficulty = { ...prev };
      if (newDifficulty[cardId] === level) {
        delete newDifficulty[cardId];
      } else {
        newDifficulty[cardId] = level;
      }
      return newDifficulty;
    });
  };

  const handleTextToSpeech = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    } else {
      toast.error('La synthèse vocale n\'est pas supportée');
    }
  };

  const handleExport = () => {
    const exportData = {
      session_id: sessionId,
      deck: deck,
      user_stats: {
        known_cards: Array.from(knownCards),
        difficulty_levels: difficulty,
        total_cards: deck.length,
        known_count: knownCards.size
      },
      metadata: {
        export_date: new Date().toISOString(),
        source: 'flashcards_component'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Flashcards exportées !');
  };

  const filteredDeck = deck.filter(card => {
    const cardId = card.id || deck.indexOf(card);
    if (filter === 'all') return true;
    if (filter === 'known') return knownCards.has(cardId);
    if (filter === 'difficult') return difficulty[cardId] === 'hard';
    return true;
  });

  const currentCardData = deck[currentCard];
  const currentCardId = currentCardData?.id || currentCard;

  const isLoading = isLoadingArtifacts || isGenerating;

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">{isGenerating ? 'Génération des flashcards...' : 'Chargement...'}</p>
      </div>
    );
  }

  // Error
  if (artifactsError) {
    return (
      <div className="text-center py-16 px-4">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-muted mb-4">{artifactsError.message || 'Impossible de charger les flashcards'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => refetchArtifacts()} className="btn-secondary gap-2">
            <RotateCw className="h-4 w-4" />Réessayer
          </button>
          <button onClick={handleGenerateFlashcards} disabled={isGenerating} className="btn-primary gap-2">
            <Wand2 className="h-4 w-4" />Générer des flashcards
          </button>
        </div>
      </div>
    );
  }

  // Écran principal
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {deck.length === 0 ? (
        // Écran vide
        <div className="text-center py-20">
          <BookOpen className="h-10 w-10 text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-ink mb-2">Aucune flashcard disponible</h3>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            {artifactsData?.artifacts?.quiz
              ? 'Un quiz est disponible. Convertissez-le ou générez de nouvelles flashcards.'
              : 'Générez des flashcards pour commencer à réviser.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleGenerateFlashcards} disabled={isGenerating} className="btn-primary gap-2">
              {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Génération...</> : <><Wand2 className="h-4 w-4" />Générer des flashcards</>}
            </button>
            {artifactsData?.artifacts?.quiz && (
              <button onClick={handleForceConvertQuiz} className="btn-secondary gap-2">
                <Zap className="h-4 w-4" />Convertir le quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        // Écran avec flashcards
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Flashcards</p>
              <p className="text-sm text-ink mt-0.5">
                {deck.length} cartes · {knownCards.size} connues · {deck.length > 0 ? Math.round((knownCards.size / deck.length) * 100) : 0}% maîtrisé
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentCard(0); }}
                className="input w-auto text-xs py-1.5"
              >
                <option value="all">Toutes</option>
                <option value="known">Connues</option>
                <option value="difficult">Difficiles</option>
              </select>
              <button onClick={handleShuffle} className="p-1.5 text-muted hover:text-ink transition-colors" title="Mélanger">
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={handleReset} className="p-1.5 text-muted hover:text-ink transition-colors" title="Réinitialiser">
                <RotateCw className="h-4 w-4" />
              </button>
              <button onClick={handleExport} className="p-1.5 text-muted hover:text-ink transition-colors" title="Exporter">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-muted mb-4">
            <span>Carte {currentCard + 1} sur {filteredDeck.length > 0 ? filteredDeck.length : deck.length}</span>
            <span>{isFlipped ? 'Verso' : 'Recto'}</span>
          </div>

          {/* Card */}
          <div
            className="card mb-5 cursor-pointer select-none min-h-[260px] flex flex-col items-center justify-center p-8 text-center transition-all hover:shadow-md"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1000px' }}
          >
            {!isFlipped ? (
              <div className="w-full">
                <span className="tag bg-faint text-muted mb-4 inline-block">Recto · cliquez pour retourner</span>
                <h3 className="text-xl font-semibold text-ink whitespace-pre-wrap">{currentCardData?.front || 'Question'}</h3>
                {currentCardData?.category && (
                  <span className="tag bg-faint text-muted mt-4 inline-block">{currentCardData.category}</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleTextToSpeech(currentCardData?.front || ''); }}
                  className="mt-4 p-1.5 text-muted hover:text-ink transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-full">
                <span className="tag bg-faint text-muted mb-4 inline-block">Verso · cliquez pour retourner</span>
                <p className="text-base text-ink whitespace-pre-wrap">
                  {typeof currentCardData?.back === 'string' ? currentCardData.back : JSON.stringify(currentCardData?.back, null, 2)}
                </p>
                {currentCardData?.explanation && (
                  <p className="text-xs text-muted mt-4 border-t border-stone pt-3">{currentCardData.explanation}</p>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleTextToSpeech(typeof currentCardData?.back === 'string' ? currentCardData.back : ''); }}
                  className="mt-4 p-1.5 text-muted hover:text-ink transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevious} disabled={currentCard === 0} className="btn-secondary gap-1.5 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />Préc.
              </button>
              <button onClick={handleNext} disabled={currentCard >= deck.length - 1} className="btn-secondary gap-1.5 disabled:opacity-40">
                Suiv.<ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => markAsKnown(currentCard)}
                className={`btn gap-1.5 text-sm border ${knownCards.has(currentCardId) ? 'border-green-300 bg-green-50 text-green-700' : 'border-stone bg-white text-muted hover:text-ink'}`}
              >
                <CheckCircle className="h-4 w-4" />
                {knownCards.has(currentCardId) ? 'Connue' : 'Je connais'}
              </button>
              <button
                onClick={() => setCardDifficulty(currentCard, 'hard')}
                className={`p-2 rounded-lg border transition-colors ${difficulty[currentCardId] === 'hard' ? 'border-red-300 bg-red-50 text-red-600' : 'border-stone text-muted hover:text-ink'}`}
                title="Difficile"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-xs text-muted mb-1">Maîtrisées</p>
              <p className="text-2xl font-bold text-ink">{knownCards.size}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted mb-1">Difficiles</p>
              <p className="text-2xl font-bold text-ink">{Object.values(difficulty).filter(d => d === 'hard').length}</p>
            </div>
          </div>

          {/* Regen */}
          <div className="mt-6 pt-5 border-t border-stone flex items-center justify-between">
            <p className="text-sm text-muted">Besoin d'autres flashcards ?</p>
            <button onClick={handleGenerateFlashcards} disabled={isGenerating} className="btn-secondary gap-2 text-xs">
              {isGenerating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Génération...</> : <><Wand2 className="h-3.5 w-3.5" />Générer</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FlashcardDeck;
