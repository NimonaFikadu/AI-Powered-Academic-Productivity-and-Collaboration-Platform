import { API_ENDPOINTS } from '@/config/apiConfig';

export interface TopicProgress {
  topicId: string;
  topicTitle: string;
  progress: number;
  materialsCount: number;
  updatedAt: string;
}

export interface QuizProgress {
  quizId: string;
  quizTitle: string;
  progress: number;
  bestScore: number;
  attemptsCount: number;
  updatedAt: string;
}

export interface NoteProgress {
  noteId: string;
  noteTitle: string;
  progress: number;
  updatedAt: string;
}

export interface StudySession {
  date: string;
  hours: number;
  productivityScore: number;
  productivityChange: number;
  updatedAt: string;
}

export interface StatisticsSummary {
  total_topics_studied: number;
  total_quizzes_attempted: number;
  total_notes_read: number;
  total_study_hours: number;
  avg_topic_progress: string;
  avg_quiz_progress: string;
  avg_quiz_score: string;
  total_materials: string;
}

export interface StatisticsResponse {
  topics_progress: TopicProgress[];
  quiz_progress: QuizProgress[];
  note_progress: NoteProgress[];
  study_hours: StudySession[];
  summary: StatisticsSummary;
}

export interface QuizPerformanceResponse {
  quiz_progress: QuizProgress[];
  summary: {
    total_quizzes_attempted: number;
    avg_quiz_progress: string;
    avg_quiz_score: string;
    highest_score: number;
    lowest_score: number;
  };
}

export interface NoteProgressResponse {
  note_progress: NoteProgress[];
  summary: {
    total_notes_read: number;
    avg_note_progress: string;
  };
}

export interface StudySessionsResponse {
  study_hours: StudySession[];
  summary: {
    total_study_hours: number;
    avg_daily_hours: string;
    avg_productivity_score: string;
    total_sessions: number;
  };
}

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

export const getStatistics = async (): Promise<StatisticsResponse> => {
  try {
    const response = await fetch(API_ENDPOINTS.STATISTICS.GET, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    const data = await response.json();
    console.log('[LOG statistics_service] ========= Fetched comprehensive statistics:', data);
    
    return data;
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error fetching statistics:', error);
    throw error;
  }
};

export const getQuizPerformance = async (): Promise<QuizPerformanceResponse> => {
  try {
    const response = await fetch(API_ENDPOINTS.STATISTICS.QUIZ_PERFORMANCE, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quiz performance');
    }

    const data = await response.json();
    console.log('[LOG statistics_service] ========= Fetched quiz performance:', data);
    
    return data;
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error fetching quiz performance:', error);
    throw error;
  }
};

export const getNoteProgress = async (): Promise<NoteProgressResponse> => {
  try {
    const response = await fetch(API_ENDPOINTS.STATISTICS.NOTE_PROGRESS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch note progress');
    }

    const data = await response.json();
    console.log('[LOG statistics_service] ========= Fetched note progress:', data);
    
    return data;
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error fetching note progress:', error);
    throw error;
  }
};

export const getStudySessions = async (days?: number): Promise<StudySessionsResponse> => {
  try {
    const url = days ? `${API_ENDPOINTS.STATISTICS.STUDY_SESSIONS}?days=${days}` : API_ENDPOINTS.STATISTICS.STUDY_SESSIONS;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch study sessions');
    }

    const data = await response.json();
    console.log('[LOG statistics_service] ========= Fetched study sessions:', data);
    
    return data;
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error fetching study sessions:', error);
    throw error;
  }
};

export const updateTopicProgress = async (topicId: string, progress: number, materialsCount?: number): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.STATISTICS.UPDATE_TOPIC_PROGRESS, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        topicId,
        progress,
        materialsCount
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update topic progress');
    }

    console.log('[LOG statistics_service] ========= Updated topic progress for:', topicId);
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error updating topic progress:', error);
    throw error;
  }
};

export const updateQuizProgress = async (quizId: string, progress: number, score?: number): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.STATISTICS.UPDATE_QUIZ_PROGRESS, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        quizId,
        progress,
        score
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update quiz progress');
    }

    console.log('[LOG statistics_service] ========= Updated quiz progress for:', quizId);
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error updating quiz progress:', error);
    throw error;
  }
};

export const updateNoteProgress = async (noteId: string, progress: number, lastReadPosition?: number): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.STATISTICS.UPDATE_NOTE_PROGRESS, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        noteId,
        progress,
        lastReadPosition
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update note progress');
    }

    console.log('[LOG statistics_service] ========= Updated note progress for:', noteId);
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error updating note progress:', error);
    throw error;
  }
};

export const logStudySession = async (hours: number, date?: string, productivityScore?: number, notes?: string): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.STATISTICS.LOG_STUDY_SESSION, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        hours,
        date,
        productivityScore,
        notes
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to log study session');
    }

    console.log('[LOG statistics_service] ========= Logged study session:', { hours, date });
  } catch (error) {
    console.error('[LOG statistics_service] ========= Error logging study session:', error);
    throw error;
  }
}; 