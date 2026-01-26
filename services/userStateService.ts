import { supabase } from './supabaseClient';
import { LessonProgress, WordProgressRecord, ExerciseProgressRecord, LessonMetricsRecord, DashboardStatsRecord, UserProgressRecord } from '../types';

interface DBUserLessonState {
  progress: LessonProgress;
  spaced_repetition: Record<string, any>; // Using any to avoid complex TS for now
  vocabulary_stats: Record<string, any>;
  difficult_words: string[];
}

export const userStateService = {
  /**
   * Get consolidated state for a lesson
   */
  async getUserLessonState(userId: string, lessonId: string) {
    const { data, error } = await supabase
      .from('user_lesson_state')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching state for lesson ${lessonId}:`, error);
      return null;
    }

    return data;
  },

  /**
   * Get ALL lesson states for a user
   */
  async getAllUserLessonStates(userId: string) {
    const { data, error } = await supabase
      .from('user_lesson_state')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching all user states:', error);
      return [];
    }

    return data;
  },

  /**
   * Save consolidated state for a lesson
   * This handles UPSERT based on user_id + lesson_id UNIQUE constraint
   */
  async saveUserLessonState(
    userId: string,
    lessonId: string,
    state: {
      progress?: LessonProgress,
      spaced_repetition?: Record<string, any>,
      vocabulary_stats?: Record<string, any>,
      difficult_words?: string[]
    }
  ) {
    if (!userId) return;

    // First, fetch existing to merge if partial update
    const { data: existing } = await supabase
      .from('user_lesson_state')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      lesson_id: lessonId,
      updated_at: new Date().toISOString(),
      progress: state.progress || existing?.progress || {},
      spaced_repetition: state.spaced_repetition || existing?.spaced_repetition || {},
      vocabulary_stats: state.vocabulary_stats || existing?.vocabulary_stats || {},
      difficult_words: state.difficult_words || existing?.difficult_words || []
    };

    const { error } = await supabase
      .from('user_lesson_state')
      .upsert(payload, { onConflict: 'user_id, lesson_id' });

    if (error) {
      console.error(`Error saving state for lesson ${lessonId}:`, error);
      throw error;
    }
  }
};
