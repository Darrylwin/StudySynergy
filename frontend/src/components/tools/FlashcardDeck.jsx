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
  Star,
  Download,
  Volume2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Zap
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
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
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

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">
          {isGenerating ? 'Génération des flashcards...' : 'Chargement...'}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Veuillez patienter
        </p>
      </div>
    );
  }

  // Écran d'erreur
  if (artifactsError) {
    return (
      <div className="text-center py-16 p-4">
        <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {artifactsError.message || 'Impossible de charger les flashcards'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => refetchArtifacts()}
            className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RotateCw className="h-4 w-4 inline mr-2" />
            Réessayer
          </button>
          <button
            onClick={handleGenerateFlashcards}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 inline mr-2" />
            Générer des flashcards
          </button>
        </div>
      </div>
    );
  }

  // Écran principal
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* État vide ou avec flashcards */}
      {deck.length === 0 ? (
        // ÉCRAN SANS FLASHCARDS
        <div className="text-center py-12">
          <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Aucune flashcard disponible
          </h2>
          
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {artifactsData?.artifacts?.quiz 
              ? "Vous avez un quiz disponible. Vous pouvez le convertir en flashcards ou en générer de nouvelles."
              : "Générez des flashcards pour commencer à réviser votre cours."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleGenerateFlashcards}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">Génération...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Générer des flashcards</span>
                </>
              )}
            </button>
            
            {artifactsData?.artifacts?.quiz && (
              <button
                onClick={handleForceConvertQuiz}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Zap className="h-5 w-5" />
                <span className="font-medium">Convertir le quiz en flashcards</span>
              </button>
            )}
          </div>
          
          {/* Stats des artefacts disponibles */}
          {artifactsData?.artifacts && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Artefacts disponibles</h3>
              <div className="space-y-3">
                {artifactsData.artifacts.quiz && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-800">Quiz</p>
                        <p className="text-sm text-gray-600">
                          {artifactsData.artifacts.quiz.questions?.length || 10} questions disponibles
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleForceConvertQuiz}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Convertir
                    </button>
                  </div>
                )}
                
                {!artifactsData.artifacts.flashcards && !artifactsData.artifacts.quiz && (
                  <p className="text-gray-500 text-center py-4">
                    Aucun artefact pédagogique généré pour cette session.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // ÉCRAN AVEC FLASHCARDS
        <>
          {/* Badge de source */}
          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
            <CheckCircle className="h-4 w-4 mr-1" />
            {deck.length} flashcards disponibles
            {deck[0]?.category === "Quiz converti" && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                Converti depuis quiz
              </span>
            )}
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <BookOpen className="h-7 w-7 text-purple-600" />
                <span>Deck de Flashcards</span>
              </h2>
              <p className="text-gray-600 mt-1">
                {deck.length} cartes • {knownCards.size} connues • {deck.length > 0 ? Math.round((knownCards.size / deck.length) * 100) : 0}% maîtrisé
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentCard(0);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Toutes les cartes</option>
                <option value="known">Connues</option>
                <option value="difficult">Difficiles</option>
              </select>
              
              <button
                onClick={handleShuffle}
                className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mélanger"
              >
                <Shuffle className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Réinitialiser"
              >
                <RotateCw className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleExport}
                className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exporter"
              >
                <Download className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Flashcard */}
          <div className="mb-8">
            <div 
              className="relative h-96 cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`absolute inset-0 w-full h-full transition-all duration-500 preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}>
                {/* Recto */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border-2 border-purple-200 backface-hidden flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
                      <span>Recto</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 whitespace-pre-wrap">
                      {currentCardData?.front || 'Question'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Cliquez pour voir la réponse
                    </p>
                    {currentCardData?.category && (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {currentCardData.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextToSpeech(currentCardData?.front || '');
                      }}
                      className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                    >
                      <Volume2 className="h-5 w-5 text-purple-600" />
                    </button>
                  </div>
                </div>
                
                {/* Verso */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-200 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8">
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                      <span>Verso</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Réponse
                    </h3>
                    <div className="text-lg text-gray-700 mb-6 whitespace-pre-wrap">
                      {typeof currentCardData?.back === 'string' 
                        ? currentCardData.back
                        : JSON.stringify(currentCardData?.back, null, 2)
                      }
                    </div>
                    
                    {currentCardData?.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Explication :</span> {currentCardData.explanation}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500 mt-4">
                      Cliquez pour revenir à la question
                    </p>
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextToSpeech(typeof currentCardData?.back === 'string' 
                          ? currentCardData.back 
                          : 'Réponse disponible'
                        );
                      }}
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                    >
                      <Volume2 className="h-5 w-5 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4 text-gray-500 text-sm">
              <p>Carte {currentCard + 1} sur {deck.length}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                disabled={currentCard === 0}
                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Précédent</span>
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentCard >= deck.length - 1}
                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Suivant</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => markAsKnown(currentCard)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${
                  knownCards.has(currentCardId)
                    ? 'bg-green-100 text-green-700'
                    : 'hover:bg-green-50 text-gray-700'
                }`}
              >
                <CheckCircle className="h-5 w-5" />
                <span>{knownCards.has(currentCardId) ? 'Connue ✓' : 'Marquer comme connue'}</span>
              </button>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCardDifficulty(currentCard, 'easy')}
                  className={`p-2 rounded-lg ${
                    difficulty[currentCardId] === 'easy'
                      ? 'bg-blue-100 text-blue-600'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title={difficulty[currentCardId] === 'easy' ? "Facile ✓" : "Marquer comme facile"}
                >
                  <Star className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCardDifficulty(currentCard, 'hard')}
                  className={`p-2 rounded-lg ${
                    difficulty[currentCardId] === 'hard'
                      ? 'bg-red-100 text-red-600'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title={difficulty[currentCardId] === 'hard' ? "Difficile ✓" : "Marquer comme difficile"}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats - SUPPRESSION DU POURCENTAGE DE PROGRESSION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cartes maîtrisées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {knownCards.size}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cartes difficiles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(difficulty).filter(d => d === 'hard').length}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bouton pour générer de nouvelles flashcards */}
      {deck.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Besoin de plus de flashcards ?</h3>
              <p className="text-gray-600 text-sm">Générez un nouveau deck basé sur votre cours</p>
            </div>
            <button
              onClick={handleGenerateFlashcards}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Générer de nouvelles flashcards</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Styles CSS */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default FlashcardDeck;