
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
