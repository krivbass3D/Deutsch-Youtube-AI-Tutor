import { create } from 'zustand';
import { Lesson, LessonProgress } from '../types';
import { SRState } from '../services/spacedRepetition';
import { VocabStatsState } from '../services/vocabularyStatistics';
import { DifficultyState } from '../services/difficultyTracker';

interface ActiveLessonState {
  progress: LessonProgress;
  srState: SRState;
  vocabStats: VocabStatsState;
  difficultWords: DifficultyState;
}

interface LessonStore {
  lesson: Lesson | null;
  state: ActiveLessonState | null;
  expandedVocabulary: boolean;
  showStatistics: 'lesson' | 'stats' | 'vocab';
  
  setLesson: (lesson: Lesson | null) => void;
  setLessonState: (state: ActiveLessonState | null) => void;
  updateProgress: (newProgress: Partial<LessonProgress>) => void;
  updateSRState: (newSR: SRState) => void;
  updateVocabStats: (newStats: VocabStatsState) => void;
  updateDifficultWords: (newWords: DifficultyState) => void;
  
  setExpandedVocabulary: (expanded: boolean) => void;
  setShowStatistics: (view: 'lesson' | 'stats' | 'vocab') => void;
  
  resetLesson: () => void;
}

const initializeProgress = (): LessonProgress => ({
  vocabSkipped: false,
  vocabCompleted: false,
  currentExerciseIdx: 0,
  currentTaskIdx: 0,
  statistics: { correct: 0, incorrect: 0, skipped: 0, answers: {} },
  completed: false,
  lastActivityAt: new Date().toISOString(),
  learnedTasks: []
});

export const useLessonStore = create<LessonStore>((set, get) => ({
  lesson: null,
  state: null,
  expandedVocabulary: false,
  showStatistics: 'lesson',

  setLesson: (lesson) => set({ lesson }),
  
  setLessonState: (state) => set({ state }),

  updateProgress: (newProgress) => set((s) => ({
    state: s.state ? { ...s.state, progress: { ...s.state.progress, ...newProgress } } : null
  })),

  updateSRState: (newSR) => set((s) => ({
    state: s.state ? { ...s.state, srState: newSR } : null
  })),

  updateVocabStats: (newStats) => set((s) => ({
    state: s.state ? { ...s.state, vocabStats: newStats } : null
  })),

  updateDifficultWords: (newWords) => set((s) => ({
    state: s.state ? { ...s.state, difficultWords: newWords } : null
  })),

  setExpandedVocabulary: (expanded) => set({ expandedVocabulary: expanded }),
  
  setShowStatistics: (view) => set({ showStatistics: view }),

  resetLesson: () => {
    const { state } = get();
    if (!state) return;
    
    set({
      state: {
        ...state,
        progress: initializeProgress()
      },
      showStatistics: 'lesson'
    });
  }
}));
