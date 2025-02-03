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

export interface StudyHours {
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

export interface Statistics {
  topics_progress: TopicProgress[];
  quiz_progress: QuizProgress[];
  note_progress: NoteProgress[];
  study_hours: StudyHours[];
  summary: StatisticsSummary;
}

export interface Material {
  id: string;
  topic_id: string;
  file_name: string;
  uploaded_file: string;
  file_type: string;
  file_size: number;
  createdAt: string;
  updatedAt: string;
  topic?: {
    id: string;
    title: string;
  };
  fileUrl: string;
} 