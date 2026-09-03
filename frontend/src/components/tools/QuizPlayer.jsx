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
  Download,
  Wand2,
  AlertCircle,
  Loader2
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

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">{isGenerating ? 'Génération du quiz...' : 'Chargement...'}</p>
      </div>
    );
  }

  // Error
  if (artifactsError) {
    return (
      <div className="text-center py-16 px-4">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-muted mb-4">{artifactsError.message || 'Impossible de charger le quiz'}</p>
        <button onClick={handleGenerateQuiz} disabled={isGenerating} className="btn-primary">
          Générer un quiz
        </button>
      </div>
    );
  }

  // Empty
  if (questions.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <HelpCircle className="h-10 w-10 text-muted mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-ink mb-2">Aucun quiz disponible</h3>
        <p className="text-sm text-muted mb-6">
          {artifactsData?.artifacts ? 'Format non reconnu.' : 'Aucun quiz généré pour cette session.'}
        </p>
        <button onClick={handleGenerateQuiz} disabled={isGenerating} className="btn-primary gap-2">
          {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Génération...</> : <><Wand2 className="h-4 w-4" />Générer un quiz</>}
        </button>
      </div>
    );
  }

  // Results
  if (quizCompleted) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-ink">Quiz terminé</h2>
          <p className="text-muted text-sm mt-1">
            {percentage >= 80 ? 'Excellent travail !' : percentage >= 60 ? 'Bien joué !' : 'Continuez à réviser.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Score', value: `${score}/${questions.length}` },
            { label: 'Réussite', value: `${percentage.toFixed(0)}%` },
            { label: 'Temps', value: formatTime(600 - timeRemaining) },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Review */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Révision</p>
          <div className="space-y-2">
            {questions.map((question, index) => {
              const correct = getQuestionStatus(index) === 'correct';
              return (
                <div key={index} className={`card px-4 py-3 text-sm ${correct ? 'border-green-200' : 'border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {correct
                      ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                    <p className="font-medium text-ink">{question.question}</p>
                  </div>
                  {!correct && question.explanation && (
                    <p className="text-xs text-muted ml-6">{question.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={handleRestartQuiz} className="btn-primary gap-2">
            <RefreshCw className="h-4 w-4" />Recommencer
          </button>
          <button onClick={handleDownloadQuiz} className="btn-secondary gap-2">
            <Download className="h-4 w-4" />Télécharger
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Quiz</p>
          <p className="text-sm text-ink font-medium mt-0.5">{questions.length} questions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-mono">
            <Clock className="h-4 w-4 text-muted" />
            <span className={timeRemaining < 60 ? 'text-red-500 font-bold' : 'text-ink'}>{formatTime(timeRemaining)}</span>
          </div>
          <div className="text-sm font-medium text-ink">
            {calculateCurrentScore()}<span className="text-muted">/{questions.length}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="w-full bg-stone rounded-full h-1">
          <div
            className="bg-ink h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>{currentQuestion + 1} / {questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
        </div>
      </div>

      {/* Question nav dots */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {questions.map((_, i) => {
          const s = getQuestionStatus(i);
          return (
            <button
              key={i}
              onClick={() => { setCurrentQuestion(i); setSelectedAnswer(answers[i]); }}
              className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                i === currentQuestion ? 'bg-ink text-white'
                  : s === 'correct' ? 'bg-green-100 text-green-700'
                  : s === 'incorrect' ? 'bg-red-100 text-red-600'
                  : 'bg-faint text-muted hover:bg-stone'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <div className="card p-5 mb-5">
        <span className="tag bg-faint text-muted mb-3 inline-block">Question {currentQuestion + 1}</span>
        <h3 className="text-base font-semibold text-ink mb-4">{currentQ?.question}</h3>

        <div className="space-y-2">
          {currentQ?.options?.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQ.correctAnswer;
            const showResult = selectedAnswer !== null;
            let cls = 'border-stone hover:border-ink';
            if (showResult && isCorrect) cls = 'border-green-500 bg-green-50';
            else if (showResult && isSelected && !isCorrect) cls = 'border-red-400 bg-red-50';
            else if (isSelected) cls = 'border-ink bg-faint';

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors disabled:cursor-not-allowed ${cls}`}
              >
                <span className="inline-flex items-center gap-3">
                  <span className={`h-5 w-5 rounded-full border text-xs flex items-center justify-center shrink-0 font-medium ${
                    showResult && isCorrect ? 'border-green-500 bg-green-500 text-white'
                      : showResult && isSelected && !isCorrect ? 'border-red-400 bg-red-400 text-white'
                      : isSelected ? 'border-ink bg-ink text-white'
                      : 'border-muted text-muted'
                  }`}>{String.fromCharCode(65 + index)}</span>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && currentQ?.explanation && (
          <div className="mt-4 p-3 bg-faint rounded-lg border border-stone text-xs text-muted">
            <span className="font-medium text-ink">Explication : </span>{currentQ.explanation}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
          className="btn-secondary gap-1.5 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />Précédent
        </button>
        <button
          onClick={handleNextQuestion}
          disabled={currentQuestion === questions.length - 1}
          className="btn-secondary gap-1.5 disabled:opacity-40"
        >
          Suivant<ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default QuizPlayer;
