/**
 * Сервис трекинга прогресса (Refactored to be Pure)
 */

import { Lesson, LessonProgress } from '../types';
import { calculateAggregateStats, VocabStatsState } from './vocabularyStatistics';
import { getSpacedRepetitionStats, SRState } from './spacedRepetition';

export interface LessonMetrics {
  lessonId: string;
  title: string;
  totalVocab: number;
  learnedWords: number;
  dueWords: number;
  wordsLearnedThisWeek: number;
  difficultWordsCount: number;
  averageTimePerWord: number;
  lastStudiedAt: string | null;
  daysSinceLastStudy: number;
  exercisesCompleted: number;
  exerciseAccuracy: number; // 0-100%
  grammarMastery: number; // 0-100%
  overallProgress: number; // 0-100%
  difficultyLevel: 'easy' | 'medium' | 'hard'; // based on accuracy
}

/**
 * Получить метрики одного урока (Pure)
 */
export const getLessonMetrics = (
  lesson: Lesson,
  progress: LessonProgress | null,
  vocabStats: VocabStatsState,
  srState: SRState,
  difficultWords: Set<string>
): LessonMetrics => {
  // Aggregate stats
  const aggStats = calculateAggregateStats(vocabStats);
  const srStats = getSpacedRepetitionStats(lesson.vocabulary || [], srState, difficultWords);
  
  // Упражнения
  const exerciseStats = progress?.statistics || { correct: 0, incorrect: 0 };
  const totalAttempts = (exerciseStats.correct || 0) + (exerciseStats.incorrect || 0);
  const exerciseAccuracy = totalAttempts > 0 ? Math.round((exerciseStats.correct / totalAttempts) * 100) : 0;

  // Слова, выученные на этой неделе
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const wordsLearnedThisWeek = Object.values(vocabStats).filter(w => {
    const seenDate = new Date(w.lastSeenAt);
    return seenDate >= oneWeekAgo && w.repeatCount >= 5;
  }).length;

  // Последнее изучение
  const lastStudied = aggStats.lastStudiedAt ? new Date(aggStats.lastStudiedAt) : null;
  const daysSinceLastStudy = lastStudied 
    ? Math.floor((Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Среднее время на слово
  const totalTime = Object.values(vocabStats).reduce((sum, w) => sum + (w.totalTimeSpent || 0), 0);
  const totalWords = Object.keys(vocabStats).length;
  const avgTimePerWord = totalWords > 0 ? totalTime / totalWords : 0;

  // Грамматика мастерство (на основе точности упражнений)
  const grammarMastery = exerciseAccuracy;

  // Общий прогресс
  const overallProgress = Math.round(
    (srStats.learnedWords / (lesson.vocabulary?.length || 1)) * 100
  );

  // Уровень сложности
  let difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';
  if (exerciseAccuracy >= 80) difficultyLevel = 'easy';
  if (exerciseAccuracy < 60) difficultyLevel = 'hard';

  return {
    lessonId: lesson.lesson_id,
    title: lesson.title,
    totalVocab: lesson.vocabulary?.length || 0,
    learnedWords: srStats.learnedWords,
    dueWords: srStats.dueWords,
    wordsLearnedThisWeek,
    difficultWordsCount: srStats.difficultWords,
    averageTimePerWord: avgTimePerWord,
    lastStudiedAt: aggStats.lastStudiedAt || null,
    daysSinceLastStudy,
    exercisesCompleted: totalAttempts,
    exerciseAccuracy,
    grammarMastery,
    overallProgress,
    difficultyLevel
  };
};
