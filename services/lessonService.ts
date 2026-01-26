import { supabase } from './supabaseClient';
import { Lesson } from '../types';

export const lessonService = {
  /**
   * Fetch all lessons from Supabase
   */
  async fetchLessons(): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('lesson_id');

    if (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }

    // Map DB structure to App structure if needed (currently mirrors it)
    return data.map(item => ({
      lesson_id: item.lesson_id,
      title: item.title,
      vocabulary: item.vocabulary,
      exercises: item.exercises,
      answers: item.answers
    })) as Lesson[];
  },

  /**
   * Fetch a single lesson by ID
   */
  async getLessonById(lessonId: string): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();

    if (error) {
      console.error(`Error fetching lesson ${lessonId}:`, error);
      return null;
    }

    return {
      lesson_id: data.lesson_id,
      title: data.title,
      vocabulary: data.vocabulary,
      exercises: data.exercises,
      answers: data.answers
    } as Lesson;
  }
};
