import { API_ENDPOINTS } from '@/config/apiConfig';
import { extractApiError } from '@/lib/apiError';
import {
  CreateQuizParams,
  QuizAnswers,
  QuizAttempt,
  QuizAttemptResult,
  QuizListResponse,
  QuizWithQuestions,
  Topic,
} from './types';

import type { Quiz } from './types';

// Re-export Quiz for use in other components
export type { Quiz } from './types';

export interface QuizzesResponse {
  quizzes: Quiz[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

// Helper function to safely get token — only runs client-side
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

class QuizzesService {
  async getTopics(): Promise<Topic[]> {
    try {
      const token = getToken();

      const response = await fetch(API_ENDPOINTS.TOPICS.LIST, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to fetch topics'));
      }

      const data = await response.json();
      return data.topics || [];
    } catch (error) {
      console.error('[LOG quizzes_service] ========= Error fetching topics:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async getQuizzes(page = 1, limit = 10): Promise<QuizListResponse> {
    try {
      const token = getToken();

      const response = await fetch(`${API_ENDPOINTS.QUIZZES.LIST}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to fetch quizzes'));
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG quizzes_service] ========= Error fetching quizzes:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Fetch quizzes filtered by topic.
   * Uses `topicId` (camelCase) to match the backend query param expectation.
   */
  async getQuizzesByTopic(topicId: string, page = 1, limit = 10): Promise<QuizListResponse> {
    try {
      const token = getToken();

      // FIX: backend reads req.query.topicId (camelCase), not topic_id
      const response = await fetch(`${API_ENDPOINTS.QUIZZES.LIST}?topicId=${topicId}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to fetch quizzes by topic'));
      }

      return await response.json();
    } catch (error) {
      console.error('[LOG quizzes_service] ========= Error fetching quizzes by topic:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async getQuizById(id: string): Promise<QuizWithQuestions> {
    try {
      const token = getToken();

      const response = await fetch(API_ENDPOINTS.QUIZZES.GET(id), {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to fetch quiz'));
      }

      const data = await response.json();
      return {
        ...data.quiz,
        questions: data.questions,
      };
    } catch (error) {
      console.error('[LOG quizzes_service] ========= Error fetching quiz by ID:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Creates an AI-generated quiz using RAG (Premium only).
   * Calls POST /api/quizzes/rag
   */
  async createQuiz(params: CreateQuizParams): Promise<Quiz> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.QUIZZES.CREATE_RAG, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to create quiz'));
      }

      const data = await response.json();
      return data.quiz;
    } catch (error) {
      console.error('[LOG quizzes_service] ========= Error creating quiz:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async submitQuizAttempt(quizId: string, answers: QuizAnswers): Promise<QuizAttemptResult> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.QUIZZES.SUBMIT_ATTEMPT(quizId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to submit quiz attempt'));
      }

      const data = await response.json();

      console.log('[LOG quizzes_service] ========= Quiz attempt submitted and progress updated:', {
        quizId,
        score: data.score,
        attemptId: data.attemptId,
      });

      return data;
    } catch (error) {
      console.error('[LOG quizzes_service] ========= Error submitting quiz attempt:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.QUIZZES.GET_ATTEMPTS(quizId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(extractApiError(errorData, 'Failed to fetch quiz attempts'));
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('[LOG quizzes_service] ========= Error fetching quiz attempts:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

export const quizzesService = new QuizzesService();
