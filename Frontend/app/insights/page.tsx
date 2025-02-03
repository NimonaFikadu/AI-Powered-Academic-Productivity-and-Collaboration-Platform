"use client";

import React, { useState, useEffect } from "react";
import { PiChartLine, PiChartBar, PiChartPie, PiCalendar, PiTrophy, PiBookOpen, PiFileText, PiClock } from "react-icons/pi";
import { getStatistics, StatisticsResponse } from "../notes-materials/statistics.service";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const Insights = () => {
  const [timeframe, setTimeframe] = useState("weekly");
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await getStatistics();
        setStatistics(data);
        console.log('[LOG insights] ========= Statistics data:', data);
      } catch (err) {
        console.error('[LOG insights] ========= Error fetching statistics:', err);
        setError(t('insights.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, []);
  
  if (loading) {
    return (
      <div className="w-full max-w-[1070px] mx-auto flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryColor"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full max-w-[1070px] mx-auto">
        <div className="bg-errorColor/10 text-errorColor p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }
  
  // Calculate the total study hours based on timeframe
  const calculateStudyHours = () => {
    if (!statistics?.study_hours || statistics.study_hours.length === 0) {
      return 0;
    }
    
    return statistics.summary.total_study_hours;
  };
  
  // Generate study hours data based on timeframe
  const generateStudyHoursData = () => {
    if (!statistics?.study_hours) {
      return { labels: [], values: [] };
    }

    const today = new Date();
    
    if (timeframe === "weekly") {
      const labels = [
        t('calendar.mon'),
        t('calendar.tue'),
        t('calendar.wed'),
        t('calendar.thu'),
        t('calendar.fri'),
        t('calendar.sat'),
        t('calendar.sun')
      ];
      const values = Array(7).fill(0);
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayOfWeek = date.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const session = statistics.study_hours.find(s => {
          const sessionDate = new Date(s.date);
          return sessionDate.toDateString() === date.toDateString();
        });
        
        if (session) {
          values[dayIndex] = session.hours;
        }
      }
      
      const maxHours = Math.max(...values, 1);
      return { labels, values: values.map(h => Math.round((h / maxHours) * 100)) };
    }
    
    if (timeframe === "monthly") {
      const labels = [
        t('insights.weekNum', { num: 1 }),
        t('insights.weekNum', { num: 2 }),
        t('insights.weekNum', { num: 3 }),
        t('insights.weekNum', { num: 4 })
      ];
      const values = Array(4).fill(0);
      
      statistics.study_hours.forEach(session => {
        const sessionDate = new Date(session.date);
        const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 28) {
          const weekIndex = 3 - Math.floor(diffDays / 7);
          if (weekIndex >= 0) values[weekIndex] += session.hours;
        }
      });
      
      const maxVal = Math.max(...values, 1);
      return { labels, values: values.map(v => Math.round((v / maxVal) * 100)) };
    }
    
    if (timeframe === "yearly") {
      const labels = [
        t('calendar.months.january').slice(0, 3),
        t('calendar.months.february').slice(0, 3),
        t('calendar.months.march').slice(0, 3),
        t('calendar.months.april').slice(0, 3),
        t('calendar.months.may').slice(0, 3),
        t('calendar.months.june').slice(0, 3),
        t('calendar.months.july').slice(0, 3),
        t('calendar.months.august').slice(0, 3),
        t('calendar.months.september').slice(0, 3),
        t('calendar.months.october').slice(0, 3),
        t('calendar.months.november').slice(0, 3),
        t('calendar.months.december').slice(0, 3)
      ];
      const values = Array(12).fill(0);
      
      statistics.study_hours.forEach(session => {
        const sessionDate = new Date(session.date);
        if (sessionDate.getFullYear() === today.getFullYear()) {
          values[sessionDate.getMonth()] += session.hours;
        }
      });
      
      const maxVal = Math.max(...values, 1);
      return { labels, values: values.map(v => Math.round((v / maxVal) * 100)) };
    }

    return { labels: [], values: [] };
  };
  
  // Format topics for pie chart
  const formatTopicsData = () => {
    if (!statistics?.topics_progress || statistics.topics_progress.length === 0) {
      return [
        { title: t('insights.noData'), percentage: 100, color: "bg-n300/20" }
      ];
    }
    
    // Use actual topic data
    const colors = ["bg-primaryColor", "bg-secondaryColor", "bg-errorColor", "bg-warningColor"];
    
    return statistics.topics_progress.map((topic, index) => ({
      title: topic.topicTitle,
      percentage: topic.progress,
      color: colors[index % colors.length]
    }));
  };
  
  const topicsData = formatTopicsData();
  const studyHoursData = generateStudyHoursData();
  const totalStudyHours = calculateStudyHours();
  const productivityScore = statistics?.study_hours?.[0]?.productivityScore || 0;
  const productivityChange = statistics?.study_hours?.[0]?.productivityChange || 0;

  return (
    <div className="w-full max-w-[1070px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('insights.title')}</h1>
        <p className="text-n300 dark:text-n400">
          {t('insights.subtitle')}
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          {["weekly", "monthly", "yearly"].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
                  ? "bg-primaryColor text-white"
                  : "bg-n300/10 text-n300 hover:bg-n300/20"
              }`}
            >
              {period === "weekly" ? t('insights.weekly') : period === "monthly" ? t('insights.monthly') : t('insights.yearly')}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-n300 dark:text-n400">{t('insights.totalStudyHours')}</p>
              <p className="text-2xl font-bold">{totalStudyHours}h</p>
            </div>
            <PiClock className="text-primaryColor size-8" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-n300 dark:text-n400">{t('insights.topicsStudied')}</p>
              <p className="text-2xl font-bold">{statistics?.summary.total_topics_studied || 0}</p>
            </div>
            <PiBookOpen className="text-secondaryColor size-8" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-n300 dark:text-n400">{t('insights.quizzesCompleted')}</p>
              <p className="text-2xl font-bold">{statistics?.summary.total_quizzes_attempted || 0}</p>
            </div>
            <PiTrophy className="text-warningColor size-8" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-n300 dark:text-n400">{t('insights.notesRead')}</p>
              <p className="text-2xl font-bold">{statistics?.summary.total_notes_read || 0}</p>
            </div>
            <PiFileText className="text-errorColor size-8" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Study Hours Chart */}
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <PiChartBar className="text-primaryColor" />
            {t('insights.last7Days')}
          </h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {studyHoursData.labels.map((label, index) => (
              <div key={label + index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-primaryColor/10 rounded-t flex items-end justify-center relative h-24">
                  <div
                    className="w-full bg-primaryColor rounded-t transition-all duration-300"
                    style={{ height: `${studyHoursData.values[index]}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-n300 dark:text-n400 mt-1 whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Progress Pie Chart */}
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <PiChartPie className="text-primaryColor" />
            {t('insights.topicProgressDistribution')}
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              {topicsData.length > 0 && topicsData[0].title !== t('insights.noData') ? (
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 42 42">
                    {/* Background circle */}
                    <circle
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke="#f3f4f6"
                      strokeWidth="3"
                    />
                    {/* Progress segments */}
                    {topicsData.map((topic, index) => {
                      const previousPercentage = topicsData.slice(0, index).reduce((sum, t) => sum + t.percentage, 0);
                      const circumference = 2 * Math.PI * 15.915;
                      const strokeDasharray = `${(topic.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((previousPercentage / 100) * circumference);
                      
                      const colors = {
                        'bg-primaryColor': '#3B82F6',
                        'bg-secondaryColor': '#10B981', 
                        'bg-errorColor': '#EF4444',
                        'bg-warningColor': '#F59E0B'
                      };
                      
                      const color = colors[topic.color as keyof typeof colors] || '#6B7280';
                      
                      return (
                        <circle
                          key={index}
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke={color}
                          strokeWidth="3"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-n900 leading-none">
                      {Math.round(parseFloat(statistics?.summary.avg_topic_progress || "0"))}%
                    </span>
                    <span className="text-[8px] text-n300 uppercase tracking-tighter">{t('insights.avgProgress')}</span>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-gray-100 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-400">0%</span>
                  <span className="text-[8px] text-gray-400 uppercase">{t('insights.noProgress')}</span>
                </div>
              )}
            </div>
            <div className="ml-4 space-y-2">
              {topicsData.slice(0, 4).map((topic, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: topic.color === 'bg-primaryColor' ? '#3B82F6' :
                                     topic.color === 'bg-secondaryColor' ? '#10B981' :
                                     topic.color === 'bg-errorColor' ? '#EF4444' :
                                     topic.color === 'bg-warningColor' ? '#F59E0B' : '#6B7280'
                    }}
                  ></div>
                  <span className="text-sm">{topic.title}</span>
                  <span className="text-sm text-n300 dark:text-n400">{topic.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Performance */}
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <PiTrophy className="text-primaryColor" />
            {t('insights.quizPerformance')}
          </h3>
          <div className="space-y-4">
            {statistics?.quiz_progress && statistics.quiz_progress.length > 0 ? (
              statistics.quiz_progress.map((quiz, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{quiz.quizTitle}</div>
                    <div className="text-xs text-n300 dark:text-n400 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <PiCalendar />
                        {quiz.updatedAt ? format(new Date(quiz.updatedAt), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                      <span>{t('insights.attempts')} {quiz.attemptsCount}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-primaryColor">{quiz.bestScore}%</div>
                    <div className="text-xs text-n300 dark:text-n400">{t('insights.bestScore')}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-n300 py-8">
                {t('insights.noQuizData')}
              </div>
            )}
          </div>
        </div>
        
        {/* Note Progress */}
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <PiFileText className="text-primaryColor" />
            {t('insights.noteReadingProgress')}
          </h3>
          <div className="space-y-4">
            {statistics?.note_progress && statistics.note_progress.length > 0 ? (
              statistics.note_progress.map((note, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{note.noteTitle}</div>
                    <div className="text-xs text-n300 dark:text-n400 flex items-center gap-1">
                      <PiCalendar />
                      <span>{note.updatedAt ? format(new Date(note.updatedAt), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="w-28 flex items-center">
                    <div className="w-full bg-n300/20 rounded-full h-2 mr-2">
                      <div 
                        className="bg-primaryColor h-2 rounded-full" 
                        style={{ width: `${note.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{note.progress}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-n300 py-8">
                {t('insights.noNoteData')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Study Sessions */}
      <div className="mt-6">
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <PiClock className="text-primaryColor" />
            {t('insights.allStudySessions')}
          </h3>
          <div className="space-y-3">
            {statistics?.study_hours && statistics.study_hours.length > 0 ? (
              statistics.study_hours.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-n300/5 rounded-lg">
                  <div>
                    <div className="font-medium">{format(new Date(session.date), 'EEEE, MMM dd, yyyy')}</div>
                    <div className="text-sm text-n300 dark:text-n400">
                      {t('insights.productivityScore')} {session.productivityScore}%
                      {session.productivityChange !== 0 && (
                        <span className={`ml-2 ${session.productivityChange > 0 ? 'text-successColor' : 'text-errorColor'}`}>
                          ({session.productivityChange > 0 ? '+' : ''}{session.productivityChange}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-primaryColor">{session.hours}h</div>
                    <div className="text-xs text-n300 dark:text-n400">{t('insights.studyTime')}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-n300 py-8">
                {t('insights.noStudySessions')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6">
        <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
          <h3 className="font-medium mb-4">{t('insights.performanceSummary')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primaryColor">{statistics?.summary.avg_topic_progress}%</div>
              <div className="text-sm text-n300 dark:text-n400">{t('insights.avgTopicProgress')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondaryColor">{statistics?.summary.avg_quiz_progress}%</div>
              <div className="text-sm text-n300 dark:text-n400">{t('insights.avgQuizProgress')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warningColor">{statistics?.summary.avg_quiz_score}%</div>
              <div className="text-sm text-n300 dark:text-n400">{t('insights.avgQuizScore')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-errorColor">{statistics?.summary.total_materials}</div>
              <div className="text-sm text-n300 dark:text-n400">{t('insights.totalMaterials')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights; 