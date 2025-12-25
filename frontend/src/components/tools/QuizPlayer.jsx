// src/components/tools/QuizPlayer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sessionAPI } from '../../services/api';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Trophy,
  RefreshCw,
  Clock,
  ChevronRight,
  ChevronLeft,
  Award,
  Download,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuizPlayer = ({ sessionId, quizData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [timerActive, setTimerActive] = useState(true);
  const [questions, setQuestions] = useState([]);
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

  // Mutation pour générer un quiz
  const generateQuizMutation = useMutation({
    mutationFn: () => sessionAPI.generateTool(sessionId, 'quiz'),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (responseData) => {
      const extractedQuestions = extractAndNormalizeQuestions(responseData);
      
      if (extractedQuestions.length > 0) {
        setQuestions(extractedQuestions);
        setAnswers(new Array(extractedQuestions.length).fill(null));
        toast.success(`${extractedQuestions.length} questions générées !`);
      } else {
        toast.error('Format de réponse non reconnu');
      }
      
      refetchArtifacts();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Fonction pour extraire et normaliser les questions
  const extractAndNormalizeQuestions = (responseData) => {
    if (!responseData) return [];
    
    let rawQuestions = [];
    
    if (responseData?.content?.questions) {
      rawQuestions = responseData.content.questions;
    } else if (responseData?.questions) {
      rawQuestions = responseData.questions;
    } else if (Array.isArray(responseData?.content)) {
      rawQuestions = responseData.content;
    } else if (Array.isArray(responseData)) {
      rawQuestions = responseData;
    }
    
    return rawQuestions.map((q, index) => {
      let correctAnswerIndex = null;
      
      if (q.answer_index !== undefined) {
        correctAnswerIndex = parseInt(q.answer_index);
      } else if (q.answerIndex !== undefined) {
        correctAnswerIndex = parseInt(q.answerIndex);
      } else if (q.correct_answer !== undefined) {
        correctAnswerIndex = parseInt(q.correct_answer);
      } else if (q.correctAnswer !== undefined) {
        correctAnswerIndex = parseInt(q.correctAnswer);
      } else if (q.correct !== undefined) {
        correctAnswerIndex = parseInt(q.correct);
      }
      
      if (correctAnswerIndex === null || isNaN(correctAnswerIndex)) {
        correctAnswerIndex = 0;
      }
      
      if (q.options && Array.isArray(q.options)) {
        if (correctAnswerIndex < 0 || correctAnswerIndex >= q.options.length) {
          correctAnswerIndex = 0;
        }
      }
      
      return {
        id: q.id || index,
        question: q.question || q.text || `Question ${index + 1}`,
        options: q.options || q.choices || q.answers || [],
        correctAnswer: correctAnswerIndex,
        explanation: q.explanation || q.reason || '',
      };
    });
  };

  // Charger les questions
  useEffect(() => {
    let loadedQuestions = [];
    
    if (quizData) {
      loadedQuestions = extractAndNormalizeQuestions(quizData);
    } else if (artifactsData?.artifacts?.quiz) {
      loadedQuestions = extractAndNormalizeQuestions(artifactsData.artifacts.quiz);
    }
    
    if (loadedQuestions.length > 0) {
      setQuestions(loadedQuestions);
      setAnswers(new Array(loadedQuestions.length).fill(null));
    }
  }, [quizData, artifactsData]);

  // Timer et logique de quiz
  const finishQuiz = useCallback(() => {
    setTimerActive(false);
    setQuizCompleted(true);
    
    const correctAnswers = questions.reduce((acc, question, index) => {
      return acc + (answers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    setScore(correctAnswers);
    
    const percentage = (correctAnswers / questions.length) * 100;
    if (percentage >= 80) {
      toast.success(`Excellent ! ${percentage.toFixed(0)}%`);
    } else if (percentage >= 60) {
      toast.success(`Bien joué ! ${percentage.toFixed(0)}%`);
    } else {
      toast.error(`Continuez à réviser ! ${percentage.toFixed(0)}%`);
    }
  }, [questions, answers]);

  useEffect(() => {
    let timer;
    if (timerActive && !quizCompleted && questions.length > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          const next = prev - 1;
          if (next <= 0 && !quizCompleted) {
            finishQuiz();
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, quizCompleted, finishQuiz, questions.length]);

  // Gestion des réponses
  const handleAnswerSelect = (answerIndex) => {
    if (answers[currentQuestion] !== null || quizCompleted) return;
    
    setSelectedAnswer(answerIndex);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    
    const isCorrect = answerIndex === questions[currentQuestion]?.correctAnswer;
    if (isCorrect) {
      toast.success('Bonne réponse !');
    } else {
      toast.error('Mauvaise réponse');
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(answers[currentQuestion + 1]);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers(new Array(questions.length).fill(null));
    setScore(0);
    setQuizCompleted(false);
    setTimeRemaining(600);
    setTimerActive(true);
    toast.success('Quiz redémarré !');
  };

  const handleDownloadQuiz = () => {
    const exportData = {
      session_id: sessionId,
      questions: questions,
      user_answers: answers,
      score: score,
      total_questions: questions.length,
      completed: quizCompleted,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-session-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Quiz téléchargé !');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionIndex) => {
    if (answers[questionIndex] === null) return 'unanswered';
    return answers[questionIndex] === questions[questionIndex]?.correctAnswer ? 'correct' : 'incorrect';
  };

  const calculateCurrentScore = () => {
    return answers.reduce((acc, answer, index) => {
      return acc + (answer === questions[index]?.correctAnswer ? 1 : 0);
    }, 0);
  };

  const handleGenerateQuiz = () => {
    generateQuizMutation.mutate();
  };

  const isLoading = isLoadingArtifacts || isGenerating;

  // Écran de chargement avec spinner amélioré
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="relative">
          {/* Spinner extérieur */}
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          {/* Spinner intérieur animé */}
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          {/* Point central */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">
          {isGenerating ? 'Génération du quiz en cours...' : 'Chargement...'}
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
          {artifactsError.message || 'Impossible de charger le quiz'}
        </p>
        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Génération...' : 'Générer un quiz'}
        </button>
      </div>
    );
  }

  // Écran "aucun quiz"
  if (questions.length === 0) {
    return (
      <div className="text-center py-16 p-4">
        <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <HelpCircle className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Aucun quiz disponible
        </h3>
        <p className="text-gray-600 mb-6">
          {artifactsData?.artifacts 
            ? 'Le quiz existe mais format non reconnu.'
            : 'Aucun quiz n\'a été généré pour cette session.'
          }
        </p>
        
        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 mx-auto"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Génération...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Générer un quiz</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Écran de résultats
  if (quizCompleted) {
    const percentage = (score / questions.length) * 100;
    
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz Terminé !
          </h2>
          <p className="text-gray-600">
            {percentage >= 80 ? 'Excellent !' : 
             percentage >= 60 ? 'Bien joué !' : 
             'Continuez à réviser !'}
          </p>
        </div>

        {/* Statistiques */}
        <div className="flex justify-center items-center gap-3 md:gap-6 mb-8">
          <div className="text-center flex-1 max-w-[120px]">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {score}/{questions.length}
            </div>
            <p className="text-sm text-gray-600">Score</p>
          </div>
          
          <div className="text-center flex-1 max-w-[120px]">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {percentage.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-600">Taux</p>
          </div>
          
          <div className="text-center flex-1 max-w-[120px]">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatTime(600 - timeRemaining)}
            </div>
            <p className="text-sm text-gray-600">Temps</p>
          </div>
        </div>

        {/* Révision des questions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Révision
          </h3>
          <div className="space-y-3">
            {questions.map((question, index) => {
              const isCorrect = getQuestionStatus(index) === 'correct';
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border text-sm ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        Q{index + 1}
                      </span>
                      {isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  </div>
                  
                  <p className="font-medium text-gray-800 mb-2 text-sm">
                    {question.question}
                  </p>
                  
                  {!isCorrect && question.explanation && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <p className="text-blue-700">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRestartQuiz}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Recommencer</span>
          </button>
          
          <button
            onClick={handleDownloadQuiz}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger</span>
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header compact */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <span>Quiz de Révision</span>
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {questions.length} questions
            </p>
          </div>
          
          {/* Timer et Score */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 rounded-lg">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="font-mono font-bold text-red-700 text-sm">
                {formatTime(timeRemaining)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 rounded-lg">
              <Award className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-blue-700 text-sm">
                {calculateCurrentScore()}/{questions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Q{currentQuestion + 1}/{questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Navigation des questions */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {questions.map((_, index) => {
            const status = getQuestionStatus(index);
            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentQuestion(index);
                  setSelectedAnswer(answers[index]);
                }}
                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                  currentQuestion === index
                    ? 'bg-blue-600 text-white'
                    : status === 'correct'
                    ? 'bg-green-100 text-green-700'
                    : status === 'incorrect'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-6">
        <div className="mb-4">
          <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-3">
            Question {currentQuestion + 1}
          </span>
          <h3 className="text-lg font-bold text-gray-900">
            {currentQ?.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {currentQ?.options?.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQ.correctAnswer;
            const showResult = selectedAnswer !== null;
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 disabled:cursor-not-allowed ${
                  showResult && isCorrect
                    ? 'border-green-500 bg-green-50'
                    : showResult && isSelected && !isCorrect
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border mr-3 flex items-center justify-center text-sm ${
                    showResult && isCorrect
                      ? 'border-green-500 bg-green-500 text-white'
                      : showResult && isSelected && !isCorrect
                      ? 'border-red-500 bg-red-500 text-white'
                      : isSelected
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-400'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explication */}
        {selectedAnswer !== null && currentQ?.explanation && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <h4 className="font-medium text-blue-900 mb-1">
              Explication :
            </h4>
            <p className="text-blue-700">{currentQ.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Précédent</span>
        </button>
        
        <button
          onClick={handleNextQuestion}
          disabled={currentQuestion === questions.length - 1}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <span>Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default QuizPlayer;