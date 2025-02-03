"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { quizzesService } from './quizzes.service';
import { Quiz, Topic, QuizDifficulty, CreateQuizParams } from './types';
import PremiumGate from "@/components/ui/PremiumGate";
import { authService } from '../auth/authService';
import {
  PiExam,
  PiPlus,
  PiMagnifyingGlass,
  PiBookOpen,
  PiTrophy,
  PiArrowRight,
  PiSpinner,
  PiListChecks,
  PiChartLineUp,
  PiLightbulb,
  PiTimer,
  PiInfo,
  PiArrowsCounterClockwise
} from "react-icons/pi";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function QuizzesPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  // Premium check — resolved from stored user object
  const [isPremium, setIsPremium] = useState<boolean>(true); // optimistic default
  
  // Form state
  const [title, setTitle] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filtered quizzes
  const filteredQuizzes = recentQuizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.topic_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Resolve premium status from stored user
    const user = authService.getUser();
    setIsPremium(user?.subscription_status === 'premium');

    const fetchData = async () => {
      try {
        setLoading(true);
        const [topicsData, quizzesData] = await Promise.all([
          quizzesService.getTopics(),
          quizzesService.getQuizzes(1, 10)
        ]);
        
        setTopics(topicsData);
        setRecentQuizzes(quizzesData.quizzes);
      } catch (err) {
        console.error('[LOG quizzes_page] ========= Error loading data:', err);
        setError(t('quizzes.errorLoadingQuiz'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedTopic) {
      setError(t('quizzes.errorGeneric') || 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const params: CreateQuizParams = {
        title,
        topicId: selectedTopic,
        difficulty,
        numQuestions,
      };
      
      const newQuiz = await quizzesService.createQuiz(params);
      router.push(`/quizzes/${newQuiz.id}`);
    } catch (err) {
      console.error('[LOG quizzes_page] ========= Error creating quiz:', err);
      setError(t('quizzes.failedToLoad') || 'Failed to create quiz. Please try again.');
      setCreating(false);
    }
  };

  const getDifficultyBadge = (diff: QuizDifficulty) => {
    switch (diff) {
      case 'easy': return <span className="text-xs bg-successColor/20 text-successColor px-2 py-0.5 rounded-full">{t('quizzes.easy')}</span>;
      case 'medium': return <span className="text-xs bg-warningColor/20 text-warningColor px-2 py-0.5 rounded-full">{t('quizzes.medium')}</span>;
      case 'hard': return <span className="text-xs bg-errorColor/20 text-errorColor px-2 py-0.5 rounded-full">{t('quizzes.hard')}</span>;
      default: return <span className="text-xs bg-primaryColor/20 text-primaryColor px-2 py-0.5 rounded-full">{diff}</span>;
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 pb-10 max-w-[1200px] mx-auto">
      {/* Hero Section */}
      <div className="mb-8 bg-white rounded-xl p-6 border border-primaryColor/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{t('quizzes.heroTitle')}</h1>
            <p className="text-n300 dark:text-n400 mb-6">
              {t('quizzes.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => document.getElementById('create-quiz')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-primaryColor text-white py-2.5 px-5 rounded-lg flex items-center gap-2 hover:bg-primaryColor/90 transition-colors"
              >
                <PiPlus className="size-5" />
                {t('quizzes.createBtn')}
              </button>
              <button 
                className="border border-primaryColor/20 text-primaryColor py-2.5 px-5 rounded-lg flex items-center gap-2 hover:bg-primaryColor/5 transition-colors"
              >
                <PiTrophy className="size-5" />
                {t('quizzes.myQuizzesBtn')}
              </button>
            </div>
          </div>
          <div className="w-full md:w-auto flex justify-center">
            <div className="relative w-60 h-60">
              <div className="absolute inset-0 bg-primaryColor/20 rounded-full circle"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <PiExam className="text-primaryColor size-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Create Quiz */}
        <div className="lg:col-span-1 space-y-6">
          <PremiumGate isBlocked={!isPremium} featureName={t('quizzes.aiQuizGenerator')}
            description={t('quizzes.aiQuizGeneratorDesc')}
          >
          <div id="create-quiz" className="bg-white rounded-xl border border-primaryColor/20 p-6 sticky top-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <PiPlus className="text-primaryColor size-5" />
                {t('quizzes.createQuizTitle')}
              </h2>
              <div className="text-xs bg-primaryColor/10 text-primaryColor px-2 py-1 rounded-full">
                {t('quizzes.aiPowered')}
              </div>
            </div>
            
            <form onSubmit={handleCreateQuiz} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('quizzes.quizTitleLabel')}</label>
                <input
                  type="text"
                  placeholder={t('quizzes.quizTitlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-lg border border-primaryColor/30 bg-transparent dark:bg-n700/10 focus:outline-none focus:ring-2 focus:ring-primaryColor/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('quizzes.selectTopicLabel')}</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-lg border border-primaryColor/30 bg-transparent dark:bg-n700/10 focus:outline-none focus:ring-2 focus:ring-primaryColor/50 appearance-none"
                  required
                >
                  <option value="">{t('quizzes.selectTopicPlaceholder')}</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('quizzes.difficultyLabel')}</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                    className="w-full py-2.5 px-4 rounded-lg border border-primaryColor/30 bg-transparent dark:bg-n700/10 focus:outline-none focus:ring-2 focus:ring-primaryColor/50 appearance-none"
                  >
                    <option value="easy">{t('quizzes.easy')}</option>
                    <option value="medium">{t('quizzes.medium')}</option>
                    <option value="hard">{t('quizzes.hard')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('quizzes.questionsLabel')}</label>
                  <select
                    value={numQuestions.toString()}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full py-2.5 px-4 rounded-lg border border-primaryColor/30 bg-transparent dark:bg-n700/10 focus:outline-none focus:ring-2 focus:ring-primaryColor/50 appearance-none"
                  >
                    <option value="3">{t('quizzes.threeQuestions')}</option>
                    <option value="5">{t('quizzes.fiveQuestions')}</option>
                    <option value="10">{t('quizzes.tenQuestions')}</option>
                    <option value="15">{t('quizzes.fifteenQuestions')}</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="text-errorColor text-sm p-3 bg-errorColor/10 rounded-lg flex items-start">
                  <PiInfo className="size-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <button 
                type="submit"
                className={`w-full py-3 bg-primaryColor text-white rounded-lg font-medium flex items-center justify-center gap-2 ${
                  creating || !selectedTopic || !title.trim() ? "opacity-70 cursor-not-allowed" : "hover:bg-primaryColor/90 transition-colors"
                }`}
                disabled={creating || !selectedTopic || !title.trim()}
              >
                {creating ? (
                  <>
                    <PiSpinner className="animate-spin size-5" />
                    <span>{t('quizzes.generatingQuiz')}</span>
                  </>
                ) : (
                  <>
                    <PiLightbulb className="size-5" />
                    <span>{t('quizzes.generateQuizBtn')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
          </PremiumGate>
        </div>
        
        {/* Right Column - Quizzes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Quizzes */}
          <div className="bg-white rounded-xl border border-primaryColor/20 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <PiArrowsCounterClockwise className="text-primaryColor size-5" />
                {t('quizzes.recentQuizzesTitle')}
              </h2>
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={t('quizzes.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 py-2 pl-9 pr-4 border border-primaryColor/30 rounded-lg text-sm bg-transparent dark:bg-n700/10 focus:outline-none focus:ring-2 focus:ring-primaryColor/50"
                />
                <PiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-n300 size-4" />
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border border-primaryColor/10 p-5 rounded-lg animate-pulse">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="h-5 w-40 bg-primaryColor/10 rounded mb-2"></div>
                        <div className="h-4 w-24 bg-primaryColor/10 rounded mb-3"></div>
                      </div>
                      <div className="h-5 w-16 bg-primaryColor/10 rounded"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-primaryColor/10 rounded"></div>
                      <div className="h-4 w-20 bg-primaryColor/10 rounded"></div>
                      <div className="h-4 w-20 bg-primaryColor/10 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredQuizzes.length > 0 ? (
              <div className="space-y-4">
                {filteredQuizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    className="border border-primaryColor/20 p-5 rounded-lg hover:border-primaryColor/40 hover:bg-primaryColor/5 cursor-pointer transition-all duration-200 group"
                    onClick={() => router.push(`/quizzes/${quiz.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primaryColor transition-colors">{quiz.title}</h3>
                        <p className="text-sm text-n300 dark:text-n400">{quiz.topic_title}</p>
                      </div>
                      {getDifficultyBadge(quiz.difficulty)}
                    </div>
                    <div className="flex flex-wrap justify-between text-sm">
                      <div className="flex items-center mr-4 mb-2 sm:mb-0">
                        <PiBookOpen className="mr-1.5 text-primaryColor size-4" />
                        <span>{t('quizzes.numQuestions', { count: quiz.question_count })}</span>
                      </div>
                      <div className="flex items-center mr-4 mb-2 sm:mb-0">
                        <PiTimer className="mr-1.5 text-primaryColor size-4" />
                        <span>{t('quizzes.minutes', { count: Math.ceil(quiz.question_count * 0.5) })}</span>
                      </div>
                      <div className="flex items-center mb-2 sm:mb-0">
                        <PiTrophy className="mr-1.5 text-primaryColor size-4" />
                        <span>{t('quizzes.numAttempts', { count: quiz.attempt_count })}</span>
                      </div>
                      <button 
                        onClick={() => router.push(`/quizzes/${quiz.id}`)}
                        className="text-primaryColor font-medium hover:underline flex items-center mt-2 sm:mt-0 sm:ml-auto"
                      >
                        <span>{t('quizzes.takeQuizBtn')}</span>
                        <PiArrowRight className="ml-1 size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-10 border border-dashed border-primaryColor/20 rounded-lg">
                <PiBookOpen className="size-16 mx-auto text-n300 mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('quizzes.noQuizzesFound')}</h3>
                <p className="text-n300 dark:text-n400 mb-6 max-w-md mx-auto">
                  {searchTerm ? 
                    t('quizzes.noQuizzesMatch', { searchTerm }) : 
                    t('quizzes.createFirstQuiz')
                  }
                </p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="bg-primaryColor/10 text-primaryColor py-2 px-4 rounded-lg hover:bg-primaryColor/20 transition-colors"
                  >
                    {t('quizzes.clearSearch')}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Features */}
          <div className="bg-white rounded-xl border border-primaryColor/20 p-6">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <PiChartLineUp className="text-primaryColor size-5" />
              {t('quizzes.featuresTitle')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-primaryColor/20 rounded-lg hover:border-primaryColor/40 transition-colors">
                <div className="flex items-center gap-3 text-primaryColor font-medium mb-2">
                  <div className="size-8 flex items-center justify-center bg-primaryColor/10 rounded-full">
                    <PiListChecks className="size-4" />
                  </div>
                  <span>{t('quizzes.aiPoweredQuestions')}</span>
                </div>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('quizzes.aiPoweredQuestionsDesc')}
                </p>
              </div>
              
              <div className="p-4 border border-primaryColor/20 rounded-lg hover:border-primaryColor/40 transition-colors">
                <div className="flex items-center gap-3 text-primaryColor font-medium mb-2">
                  <div className="size-8 flex items-center justify-center bg-primaryColor/10 rounded-full">
                    <PiBookOpen className="size-4" />
                  </div>
                  <span>{t('quizzes.topicBasedLearning')}</span>
                </div>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('quizzes.topicBasedLearningDesc')}
                </p>
              </div>
              
              <div className="p-4 border border-primaryColor/20 rounded-lg hover:border-primaryColor/40 transition-colors">
                <div className="flex items-center gap-3 text-primaryColor font-medium mb-2">
                  <div className="size-8 flex items-center justify-center bg-primaryColor/10 rounded-full">
                    <PiTrophy className="size-4" />
                  </div>
                  <span>{t('quizzes.performanceTracking')}</span>
                </div>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('quizzes.performanceTrackingDesc')}
                </p>
              </div>
              
              <div className="p-4 border border-primaryColor/20 rounded-lg hover:border-primaryColor/40 transition-colors">
                <div className="flex items-center gap-3 text-primaryColor font-medium mb-2">
                  <div className="size-8 flex items-center justify-center bg-primaryColor/10 rounded-full">
                    <PiTimer className="size-4" />
                  </div>
                  <span>{t('quizzes.timedQuizzes')}</span>
                </div>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('quizzes.timedQuizzesDesc')}
                </p>
              </div>
            </div>
          </div>
          
          {/* How It Works */}
          <div className="bg-primaryColor/5 rounded-xl border border-primaryColor/20 p-6">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <PiInfo className="text-primaryColor size-5" />
              {t('quizzes.howItWorksTitle')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-primaryColor/20 hover:border-primaryColor/40 transition-colors">
                <div className="size-10 flex items-center justify-center bg-primaryColor/20 text-primaryColor rounded-full mb-4 font-bold">
                  1
                </div>
                <h3 className="font-medium text-lg mb-2">{t('quizzes.step1Title')}</h3>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('quizzes.step1Desc')}
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-primaryColor/20 hover:border-primaryColor/40 transition-colors">
                <div className="size-10 flex items-center justify-center bg-primaryColor/20 text-primaryColor rounded-full mb-4 font-bold">
                  2
                </div>
                <h3 className="font-medium text-lg mb-2">{t('quizzes.step2Title')}</h3>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('quizzes.step2Desc')}
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-primaryColor/20 hover:border-primaryColor/40 transition-colors">
                <div className="size-10 flex items-center justify-center bg-primaryColor/20 text-primaryColor rounded-full mb-4 font-bold">
                  3
                </div>
                <h3 className="font-medium text-lg mb-2">{t('quizzes.step3Title')}</h3>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('quizzes.step3Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 