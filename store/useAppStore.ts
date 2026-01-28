import { create } from 'zustand';
import { AppState, ViewType, Lesson, UserState } from '../types';
import { supabase } from '../services/supabaseClient';
import { INITIAL_LESSONS } from '../constants';

interface AppStore extends AppState {
  setAuth: (user: any, profile: any) => void;
  setView: (view: ViewType) => void;
  setSelectedLesson: (lesson: Lesson | null) => void;
  setAllUserStates: (states: UserState[]) => void;
  updateUserState: (lessonId: string, newState: Partial<UserState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  selectedModel: 'gpt-4o' | 'gemini-1.5-pro';
  setModel: (model: 'gpt-4o' | 'gemini-1.5-pro') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  profile: null,
  currentView: 'dashboard',
  selectedLesson: null,
  allUserStates: [],
  selectedModel: (localStorage.getItem('selected_ai_model') as any) || 'gpt-4o',
  loading: true,
  error: null,

  setAuth: (user, profile) => set({ user, profile, loading: false }),
  setView: (view) => set({ currentView: view }),
  setSelectedLesson: (lesson) => set({ selectedLesson: lesson }),
  setAllUserStates: (states) => set({ allUserStates: states }),
  
  updateUserState: (lessonId, newState) => set((state) => {
    const existingIdx = state.allUserStates.findIndex(s => s.lesson_id === lessonId);
    let newStates = [...state.allUserStates];
    
    if (existingIdx !== -1) {
      newStates[existingIdx] = { ...newStates[existingIdx], ...newState, updated_at: new Date().toISOString() };
    } else if (newState.progress) {
      // Create new state if it doesn't exist
      newStates.push({
        lesson_id: lessonId,
        progress: newState.progress,
        spaced_repetition: newState.spaced_repetition || {},
        vocabulary_stats: newState.vocabulary_stats || {},
        difficult_words: newState.difficult_words || [],
        updated_at: new Date().toISOString()
      });
    }
    
    return { allUserStates: newStates };
  }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, currentView: 'dashboard', allUserStates: [] });
  },

  setModel: (model) => {
    localStorage.setItem('selected_ai_model', model);
    set({ selectedModel: model });
  }
}));
