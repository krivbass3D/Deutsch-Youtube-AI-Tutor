
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
  tags?: string[];
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
  learnedTasks?: string[]; // Array of "exerciseIdx_taskIdx"
}

// Types for Spaced Repetition and Statistics
export type SRState = Record<string, any>;
export type VocabStatsState = Record<string, any>;
export type DifficultyState = string[];

// User Profile / State in DB
export interface UserState {
    lesson_id: string;
    progress: LessonProgress;
    spaced_repetition: SRState;
    vocabulary_stats: VocabStatsState;
    difficult_words: DifficultyState;
    updated_at: string;
}

export type ViewType = 'dashboard' | 'lesson_overview' | 'vocabulary' | 'practice' | 'exam' | 'stats' | 'vocab' | 'summary';

export interface AppState {
    user: any | null; // Supabase User
    profile: any | null;
    currentView: ViewType;
    selectedLesson: Lesson | null;
    allUserStates: UserState[];
    selectedModel: 'gpt-4o' | 'gemini-1.5-pro';
    loading: boolean;
    error: string | null;
}
