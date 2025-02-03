'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quizzesService } from '../quizzes.service';
import { QuizWithQuestions, QuizQuestion, QuizAnswers, QuizAttemptResult } from '../types';
import { 
  PiExam, 
  PiArrowLeft, 
  PiArrowRight, 
  PiClock, 
  PiBookOpen, 
  PiTrophy, 
  PiSpinner, 
  PiCheckCircle, 
  PiXCircle,
  PiInfo,
  PiTimer,
  PiLightbulb,
  PiBrain,
  PiCheck,
  PiX,
  PiGraduationCap,
  PiWarningCircle,
  PiHourglassHigh,
  PiArrowsCounterClockwise,
  PiListChecks
} from "react-icons/pi";
import { useTranslation } from "react-i18next";

export default function QuizDetailsPage() {
  const params = useParams();
  const quizId = params?.id as string;
  
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<QuizAnswers>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const { t } = useTranslation();
  
  // Timer state
  const [timeSpent, setTimeSpent] = useState<number>(0);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await quizzesService.getQuizById(quizId);
        setQuiz(data);
      } catch (err) {
        console.error('[LOG quiz_details] ========= Error loading quiz:', err);
        setError(t('quizzes.errorLoadingQuiz'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (quizStarted && !quizCompleted) {
      timer = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizStarted, quizCompleted]);
  
  const handleStartQuiz = () => {
    setQuizStarted(true);
    setTimeSpent(0);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };
  
  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };
  
  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };
  
  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    const questionIds = quiz.questions.map(q => q.id);
    const isAllAnswered = questionIds.every(id => selectedAnswers[id]);
    
    if (!isAllAnswered) {
      const confirmed = window.confirm(t('quizzes.unansweredConfirm'));
      if (!confirmed) return;
    }
    
    try {
      setSubmitting(true);
      const response = await quizzesService.submitQuizAttempt(quiz.id, selectedAnswers);
      setResult(response);
      setQuizCompleted(true);
    } catch (err) {
      console.error('[LOG quiz_details] ========= Error submitting quiz:', err);
      setError(t('quizzes.failedToLoad') || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-successColor/20 text-successColor';
      case 'medium': return 'bg-warningColor/20 text-warningColor';
      case 'hard': return 'bg-errorColor/20 text-errorColor';
      default: return 'bg-primaryColor/20 text-primaryColor';
    }
  };
  
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <PiLightbulb className="size-4 mr-1.5" />;
      case 'medium': return <PiBrain className="size-4 mr-1.5" />;
      case 'hard': return <PiGraduationCap className="size-4 mr-1.5" />;
      default: return <PiInfo className="size-4 mr-1.5" />;
    }
  };
  
  const getCurrentQuestion = (): QuizQuestion | null => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;
    return quiz.questions[currentQuestionIndex];
  };
  
  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-[1200px] mx-auto">
        <div className="mb-8 flex items-center gap-2">
          <button className="p-2 border border-primaryColor/20 rounded-lg flex items-center justify-center opacity-50">
            <PiArrowLeft className="size-4" />
          </button>
          <div className="h-8 w-32 bg-primaryColor/10 animate-pulse rounded-lg"></div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-primaryColor/20 animate-pulse">
          <div className="h-8 w-3/4 bg-primaryColor/10 rounded-lg mb-4"></div>
          <div className="h-4 w-1/2 bg-primaryColor/10 rounded-lg mb-6"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-primaryColor/10 rounded-lg"></div>
            ))}
          </div>
          
          <div className="h-24 w-full bg-primaryColor/10 rounded-lg mb-6"></div>
          
          <div className="space-y-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 w-full bg-primaryColor/10 rounded-lg"></div>
            ))}
          </div>
          
          <div className="h-12 w-full bg-primaryColor/10 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  if (error || !quiz) {
    return (
      <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/quizzes')}
            className="py-2.5 px-4 border border-primaryColor/20 rounded-lg flex items-center gap-2 hover:bg-primaryColor/5 transition-colors"
          >
            <PiArrowLeft className="size-4" />
            <span>{t('quizzes.backToQuizzes')}</span>
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-primaryColor/20">
          <div className="flex items-center gap-3 mb-6 text-errorColor">
            <PiWarningCircle className="size-8" />
            <h2 className="text-xl font-semibold">{t('quizzes.errorLoadingQuiz')}</h2>
          </div>
          
          <p className="text-n300 dark:text-n400 mb-4">
            {t('quizzes.problemLoadingQuiz')}
          </p>
          
          <div className="p-4 bg-errorColor/10 border border-errorColor/20 rounded-lg mb-6">
            <p className="text-errorColor text-sm">{error || t('quizzes.failedToLoad')}</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="py-2.5 px-6 bg-primaryColor text-white rounded-lg hover:bg-primaryColor/90 transition-colors flex items-center gap-2"
            >
              <PiArrowsCounterClockwise className="size-4" />
              <span>{t('quizzes.tryAgain')}</span>
            </button>
            
            <button 
              onClick={() => router.push('/quizzes')}
              className="py-2.5 px-6 border border-primaryColor/20 text-primaryColor rounded-lg hover:bg-primaryColor/5 transition-colors"
            >
              {t('quizzes.returnToQuizzes')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Quiz completed - show results
  if (quizCompleted && result) {
    const correctPercentage = (result.correctAnswers / result.totalQuestions) * 100;
    const isPassing = correctPercentage >= 70;
    
    return (
      <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/quizzes')}
            className="py-2.5 px-4 border border-primaryColor/20 rounded-lg flex items-center gap-2 hover:bg-primaryColor/5 transition-colors"
          >
            <PiArrowLeft className="size-4" />
            <span>{t('quizzes.backToQuizzes')}</span>
          </button>
        </div>
        
        <div className="bg-white rounded-xl border border-primaryColor/20 overflow-hidden">
          <div className={`py-5 px-6 border-b ${isPassing ? 'bg-successColor/10 border-successColor/20' : 'bg-errorColor/10 border-errorColor/20'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {isPassing ? (
                  <div className="size-10 rounded-full bg-successColor/20 flex items-center justify-center">
                    <PiCheckCircle className="size-6 text-successColor" />
                  </div>
                ) : (
                  <div className="size-10 rounded-full bg-errorColor/20 flex items-center justify-center">
                    <PiXCircle className="size-6 text-errorColor" />
                  </div>
                )}
                
                <div>
                  <h1 className="text-xl font-semibold">
                    {isPassing ? t('quizzes.quizCompletedSuccess') : t('quizzes.quizCompleted')}
                  </h1>
                  <p className="text-sm text-n300 dark:text-n400">
                    {quiz.topic_title} • {t('quizzes.totalTime', { time: formatTime(timeSpent) })}
                  </p>
                </div>
              </div>
              
              <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                isPassing ? 'bg-successColor/20 text-successColor' : 'bg-errorColor/20 text-errorColor'
              }`}>
                {isPassing ? t('quizzes.passed') : t('quizzes.failed')}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
              <p className="text-n300 dark:text-n400 mb-6 max-w-md mx-auto">
                {t('quizzes.resultsSubtitle')}
              </p>
              
              <div className="inline-block relative mb-2">
                <div className="size-40 sm:size-48 rounded-full flex items-center justify-center bg-n30 dark:bg-n700">
                  <div className={`size-32 sm:size-40 rounded-full flex flex-col items-center justify-center ${
                    isPassing ? 'bg-successColor/10' : 'bg-errorColor/10'
                  }`}>
                    <div className={`text-4xl sm:text-5xl font-bold ${
                      isPassing ? 'text-successColor' : 'text-errorColor'
                    }`}>
                      {correctPercentage.toFixed(0)}%
                    </div>
                    <div className="text-sm mt-1">{t('quizzes.score')}</div>
                  </div>
                </div>
                
                <div className="absolute top-0 left-0 w-full h-full">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className={`${isPassing ? 'text-successColor/40' : 'text-errorColor/40'}`}
                      strokeDasharray={`calc(${correctPercentage} * 2.83) 283`}
                    />
                  </svg>
                </div>
              </div>
              
              <div className={`text-xl font-semibold ${isPassing ? 'text-successColor' : 'text-errorColor'}`}>
                {result.correctAnswers} of {result.totalQuestions} correct
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className={`p-4 rounded-lg border ${isPassing ? 'border-successColor/30 bg-successColor/5' : 'border-primaryColor/20'}`}>
                <div className="text-sm text-n300 dark:text-n400 mb-1">{t('quizzes.correctAnswers')}</div>
                <div className="font-medium flex items-center text-successColor">
                  <PiCheck className="size-4 mr-2" />
                  {t('quizzes.correctQuestions', { count: result.correctAnswers })}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${!isPassing ? 'border-errorColor/30 bg-errorColor/5' : 'border-primaryColor/20'}`}>
                <div className="text-sm text-n300 dark:text-n400 mb-1">{t('quizzes.incorrectAnswers')}</div>
                <div className="font-medium flex items-center text-errorColor">
                  <PiX className="size-4 mr-2" />
                  {t('quizzes.incorrectQuestions', { count: result.totalQuestions - result.correctAnswers })}
                </div>
              </div>
              
              <div className="p-4 rounded-lg border border-primaryColor/20">
                <div className="text-sm text-n300 dark:text-n400 mb-1">{t('quizzes.timeTaken')}</div>
                <div className="font-medium flex items-center text-primaryColor">
                  <PiClock className="size-4 mr-2" />
                  {formatTime(timeSpent)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="py-2.5 px-6 border border-primaryColor/20 text-primaryColor rounded-lg hover:bg-primaryColor/5 transition-colors flex-1 flex items-center justify-center gap-2"
                onClick={() => router.push('/quizzes')}
              >
                <PiArrowLeft className="size-4" />
                <span>{t('quizzes.backToQuizzes')}</span>
              </button>
              
              <button 
                className="py-2.5 px-6 bg-primaryColor text-white rounded-lg hover:bg-primaryColor/90 transition-colors flex-1 flex items-center justify-center gap-2"
                onClick={() => {
                  setQuizCompleted(false);
                  setQuizStarted(false);
                  setResult(null);
                }}
              >
                <PiArrowsCounterClockwise className="size-4" />
                <span>{t('quizzes.takeAgain')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Quiz not started
  if (!quizStarted) {
    return (
      <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/quizzes')}
            className="py-2.5 px-4 border border-primaryColor/20 rounded-lg flex items-center gap-2 hover:bg-primaryColor/5 transition-colors"
          >
            <PiArrowLeft className="size-4" />
            <span>{t('quizzes.backToQuizzes')}</span>
          </button>
        </div>
        
        <div className="bg-white rounded-xl border border-primaryColor/20 overflow-hidden">
          <div className="py-5 px-6 border-b border-primaryColor/10 bg-primaryColor/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primaryColor/20 flex items-center justify-center">
                  <PiExam className="size-6 text-primaryColor" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">{quiz.title}</h1>
                  <p className="text-sm text-n300 dark:text-n400">
                    {quiz.topic_title}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getDifficultyColor(quiz.difficulty)}`}>
                  {getDifficultyIcon(quiz.difficulty)}
                  {quiz.difficulty === 'easy' ? t('quizzes.easy') : quiz.difficulty === 'medium' ? t('quizzes.medium') : t('quizzes.hard')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              {quiz.description && (
                <div className="bg-primaryColor/5 p-4 rounded-lg mb-6">
                  <p className="text-n500 dark:text-n100">{quiz.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-primaryColor/20 bg-white">
                  <div className="text-sm text-n300 dark:text-n400 mb-1">{t('quizzes.selectTopicLabel')}</div>
                  <div className="font-medium flex items-center text-primaryColor">
                    <PiBookOpen className="size-4 mr-2" />
                    {quiz.topic_title}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-primaryColor/20 bg-white">
                  <div className="text-sm text-n300 dark:text-n400 mb-1">{t('quizzes.questionsLabel')}</div>
                  <div className="font-medium flex items-center text-primaryColor">
                    <PiListChecks className="size-4 mr-2" />
                    {t('quizzes.numQuestions', { count: quiz.question_count })}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-primaryColor/20 bg-white">
                  <div className="text-sm text-n300 dark:text-n400 mb-1">{t('quizzes.attemptsLabel')}</div>
                  <div className="font-medium flex items-center text-primaryColor">
                    <PiTrophy className="size-4 mr-2" />
                    {t('quizzes.numAttempts', { count: quiz.attempt_count })}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-primaryColor/20 mb-8">
                <h3 className="flex items-center gap-2 font-semibold text-primaryColor mb-4">
                  <PiInfo className="size-5" />
                  <span>{t('quizzes.quizInstructions')}</span>
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="size-5 rounded-full bg-primaryColor/10 flex-shrink-0 flex items-center justify-center mt-0.5 text-primaryColor text-xs font-bold">1</div>
                    <span>{t('quizzes.instr1', { count: quiz.question_count }) || `This quiz contains ${quiz.question_count} multiple-choice questions.`}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="size-5 rounded-full bg-primaryColor/10 flex-shrink-0 flex items-center justify-center mt-0.5 text-primaryColor text-xs font-bold">2</div>
                    <span>{t('quizzes.instr2') || 'Select the best answer for each question.'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="size-5 rounded-full bg-primaryColor/10 flex-shrink-0 flex items-center justify-center mt-0.5 text-primaryColor text-xs font-bold">3</div>
                    <span>{t('quizzes.instr3') || 'You can navigate between questions using the previous and next buttons.'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="size-5 rounded-full bg-primaryColor/10 flex-shrink-0 flex items-center justify-center mt-0.5 text-primaryColor text-xs font-bold">4</div>
                    <span>{t('quizzes.instr4') || 'You can review and change your answers before final submission.'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="size-5 rounded-full bg-primaryColor/10 flex-shrink-0 flex items-center justify-center mt-0.5 text-primaryColor text-xs font-bold">5</div>
                    <span>{t('quizzes.instr5') || 'Once you submit, you\'ll see your score and correct answers.'}</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <button 
                  className="py-3 px-8 bg-primaryColor text-white rounded-lg font-medium hover:bg-primaryColor/90 transition-colors inline-flex items-center gap-2"
                  onClick={handleStartQuiz}
                >
                  <PiTimer className="size-5" />
                  <span>{t('quizzes.startQuiz')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Taking the quiz
  const currentQuestion = getCurrentQuestion();
  
  if (!currentQuestion) {
    return (
      <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push('/quizzes')}
            className="py-2.5 px-4 border border-primaryColor/20 rounded-lg flex items-center gap-2 hover:bg-primaryColor/5 transition-colors"
          >
            <PiArrowLeft className="size-4" />
            <span>{t('quizzes.backToQuizzes')}</span>
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-primaryColor/20">
          <div className="flex items-center gap-3 mb-6 text-errorColor">
            <PiWarningCircle className="size-8" />
            <h2 className="text-xl font-semibold">{t('quizzes.errorLoadingQuiz')}</h2>
          </div>
          
          <p className="text-n300 dark:text-n400 mb-4">
            {t('quizzes.noQuizQuestions') || 'No questions were found for this quiz. Please try another quiz or contact support.'}
          </p>
          
          <button 
            onClick={() => router.push('/quizzes')}
            className="py-2.5 px-6 bg-primaryColor text-white rounded-lg hover:bg-primaryColor/90 transition-colors flex items-center gap-2"
          >
            <PiArrowLeft className="size-4" />
            <span>{t('quizzes.returnToQuizzes')}</span>
          </button>
        </div>
      </div>
    );
  }
  
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnsweredCurrent = !!selectedAnswers[currentQuestion.id];
  
  return (
    <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-[1200px] mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => {
            if (window.confirm(t('quizzes.exitConfirm'))) {
              router.push('/quizzes');
            }
          }}
          className="py-2.5 px-4 border border-primaryColor/20 rounded-lg flex items-center gap-2 hover:bg-primaryColor/5 transition-colors"
        >
          <PiArrowLeft className="size-4" />
          <span>{t('quizzes.exitQuiz')}</span>
        </button>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${getDifficultyColor(quiz.difficulty)}`}>
            {getDifficultyIcon(quiz.difficulty)}
            <span className="font-medium text-sm">{quiz.difficulty === 'easy' ? t('quizzes.easy') : quiz.difficulty === 'medium' ? t('quizzes.medium') : t('quizzes.hard')}</span>
          </div>
          <div className="flex items-center bg-primaryColor/10 px-3 py-1.5 rounded-lg text-primaryColor">
            <PiClock className="size-4 mr-1.5" />
            <span className="font-medium text-sm">{formatTime(timeSpent)}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-primaryColor/20 overflow-hidden">
        <div className="py-5 px-6 border-b border-primaryColor/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{t('quizzes.questionProgress', { current: currentQuestionIndex + 1, total: quiz.questions.length })}</span>
              <span>{t('quizzes.completedProgress', { percentage: Math.round(progress) })}</span>
            </div>
            <div className="w-full h-2 bg-primaryColor/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primaryColor transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <div className="text-lg font-medium p-4 bg-primaryColor/5 rounded-lg mb-6 border border-primaryColor/10">
              {currentQuestion.question}
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index} 
                  onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                  className={`p-4 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                    selectedAnswers[currentQuestion.id] === option
                      ? 'border-primaryColor bg-primaryColor/5 text-primaryColor shadow-sm'
                      : 'border-primaryColor/20 hover:border-primaryColor/40 hover:bg-primaryColor/5'
                  }`}
                >
                  <div className={`size-5 rounded-full flex items-center justify-center ${
                    selectedAnswers[currentQuestion.id] === option
                      ? 'bg-primaryColor text-white'
                      : 'border border-n300 dark:border-n500'
                  }`}>
                    {selectedAnswers[currentQuestion.id] === option && <div className="size-2 bg-white rounded-full"></div>}
                  </div>
                  <span>{option}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`py-2.5 px-6 border rounded-lg flex items-center gap-2 ${
                currentQuestionIndex === 0 
                  ? 'opacity-50 cursor-not-allowed border-n300/30 text-n300' 
                  : 'border-primaryColor/20 text-primaryColor hover:bg-primaryColor/5 transition-colors'
              }`}
            >
              <PiArrowLeft className="size-4" />
              <span>{t('quizzes.previous')}</span>
            </button>
            
            {isLastQuestion ? (
              <button 
                onClick={handleSubmitQuiz}
                disabled={submitting || Object.keys(selectedAnswers).length === 0}
                className={`py-2.5 px-6 bg-primaryColor text-white rounded-lg flex items-center gap-2 ${
                  submitting || Object.keys(selectedAnswers).length === 0 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:bg-primaryColor/90 transition-colors'
                }`}
              >
                {submitting ? (
                  <>
                    <PiSpinner className="size-4 animate-spin" />
                    <span>{t('quizzes.submitting')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('quizzes.submitQuiz')}</span>
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handleNextQuestion}
                disabled={!hasAnsweredCurrent}
                className={`py-2.5 px-6 bg-primaryColor text-white rounded-lg flex items-center gap-2 ${
                  !hasAnsweredCurrent 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:bg-primaryColor/90 transition-colors'
                }`}
              >
                <span>{t('quizzes.next')}</span>
                <PiArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 