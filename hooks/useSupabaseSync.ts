import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useLessonStore } from '../store/useLessonStore';
import { supabase } from '../services/supabaseClient';
import { userStateService } from '../services/userStateService';
import { lessonService } from '../services/lessonService';
import { INITIAL_LESSONS } from '../constants';
import { LessonProgress, SRState, VocabStatsState, DifficultyState } from '../types';

export const useSupabaseSync = () => {
  const { user, profile, setAllUserStates, updateUserState, setAuth } = useAppStore();
  const { lesson, state, setLessonState } = useLessonStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Lessons and User States
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      
      try {
        // Load all lessons
        const allLessons = await lessonService.fetchLessons();
        
        // Load all user progress states
        const states = await userStateService.getAllUserLessonStates(user.id);
        setAllUserStates(states);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    
    loadInitialData();
  }, [user, setAllUserStates]);

  // 2. Load Specific Lesson State when lesson changes
  const loadLessonState = useCallback(async (lessonId: string) => {
    if (!user) return;
    
    try {
      const data = await userStateService.getUserLessonState(user.id, lessonId);
      if (data) {
        setLessonState({
          progress: {
            ...data.progress,
            learnedTasks: (data.progress as any).learnedTasks || [],
            statistics: (data.progress as any).statistics || { correct: 0, incorrect: 0, skipped: 0, answers: {} }
          } as LessonProgress,
          srState: (data.spaced_repetition || {}) as SRState,
          vocabStats: (data.vocabulary_stats || {}) as VocabStatsState,
          difficultWords: (data.difficult_words || []) as DifficultyState
        });
      } else {
        // Initialize new progress if not found
        setLessonState({
          progress: {
            vocabSkipped: false,
            vocabCompleted: false,
            currentExerciseIdx: 0,
            currentTaskIdx: 0,
            statistics: { correct: 0, incorrect: 0, skipped: 0, answers: {} },
            completed: false,
            lastActivityAt: new Date().toISOString(),
            learnedTasks: []
          },
          srState: {},
          vocabStats: {},
          difficultWords: []
        });
      }
    } catch (err) {
      console.error('Error loading lesson state:', err);
    }
  }, [user, setLessonState]);

  // 3. Auto-Save Lesson State (Debounced)
  useEffect(() => {
    if (!user || !lesson || !state) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await userStateService.saveUserLessonState(user.id, lesson.lesson_id, {
          progress: state.progress,
          spaced_repetition: state.srState,
          vocabulary_stats: state.vocabStats,
          difficult_words: state.difficultWords
        });
        
        // Update local allUserStates in useAppStore
        updateUserState(lesson.lesson_id, {
            progress: state.progress,
            spaced_repetition: state.srState,
            vocabulary_stats: state.vocabStats,
            difficult_words: state.difficultWords
        });
      } catch (err) {
        console.error('Error saving state:', err);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [user, lesson, state, updateUserState]);

  return { loadLessonState };
};
