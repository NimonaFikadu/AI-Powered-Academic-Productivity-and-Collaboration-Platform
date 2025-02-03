export interface Topic {
  id: string;
  title: string;
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface CreateQuizParams {
  title: string;
  topicId: string;
  difficulty: QuizDifficulty;
  numQuestions: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'multiple_choice';
  quiz_id: string;
  options: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions?: {
    type: string;
    count: number;
  };
  difficulty: QuizDifficulty;
  time_limit: number | null;
  topic_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_ai_generated: number;
  is_public: number;
  topic_title: string;
  creator_name: string;
  question_count: number;
  attempt_count: number;
}

export interface QuizWithQuestions extends Omit<Quiz, 'questions'> {
  questions: QuizQuestion[];
}

export interface QuizAnswers {
  [questionId: string]: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed: number;
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  answers: QuizAnswers;
  completed_at: string;
  username: string;
}

export interface QuizAttemptResult {
  message: string;
  attemptId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface QuizListResponse {
  quizzes: Quiz[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
} 