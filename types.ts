
export type WordType = 'verb' | 'noun' | 'adjective' | 'adverb' | 'phrase';

export interface Vocabulary {
  word: string;
  translation: string;
  type: WordType;
}

export interface Exercise {
  title: string;
  tasks: string[];
}

export interface Answer {
  exercise: number; // index + 1
  solutions: string[];
}

export interface Lesson {
  lesson_id: string;
  title: string;
  vocabulary: Vocabulary[];
  exercises: Exercise[];
  answers: Answer[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface LessonStatistics {
  correct: number;
  incorrect: number;
  skipped: number;
  answers: Record<string, { userAnswer: string; correct: boolean }>; // key: exerciseIdx-taskIdx
}

export interface LessonProgress {
  vocabSkipped: boolean;
  vocabCompleted: boolean;
  currentExerciseIdx: number;
  currentTaskIdx: number;
  statistics: LessonStatistics;
  completed: boolean;
  lastActivityAt: string;
}

// ============================================
// НОВЫЕ ТИПЫ ДЛЯ PROGRESS SERVICE
// ============================================

export interface WordProgressRecord {
  word: string;
  translation: string;
  attempts: number;
  correctAttempts: number;
  examPassed: boolean;
  examPassedAt: number | null;
  lastAttemptAt: number;
}

export interface ExerciseProgressRecord {
  sentence: string;
  translation: string;
  attempts: number;
  correctAttempts: number;
  firstAttemptCorrect: boolean;
  correctAt: number | null;
  isLearned: boolean;
  lastAttemptAt: number;
}

export interface LessonMetricsRecord {
  totalWords: number;
  wordsLearned: number;
  totalExercises: number;
  exercisesLearned: number;
  exerciseAccuracy: number;
}

export interface LessonDataRecord {
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: number;
  vocabulary: Record<string, WordProgressRecord>;
  exercises: Record<string, ExerciseProgressRecord>;
  metrics: LessonMetricsRecord;
  completedAt: number | null;
}

export interface DashboardStatsRecord {
  totalWordsLearned: number;
  wordsLearnedThisWeek: number;
  totalExerciseAttempts: number;
  exerciseAttemptsCorrect: number;
  lessonsInProgress: number;
  lessonsCompleted: number;
}

export interface UserProgressRecord {
  stats: DashboardStatsRecord;
  lessons: Record<string, LessonDataRecord>;
  weeklyStats: Record<string, { wordsLearned: number; exerciseAttempts: number; correctAttempts: number }>;
  lastUpdated: number;
}
