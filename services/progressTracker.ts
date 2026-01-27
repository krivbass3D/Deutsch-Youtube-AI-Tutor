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

  // ОБЩИЙ ПРОГРЕСС
  // 1. Прогресс слов (SR)
  const vocabProgress = lesson.vocabulary?.length 
    ? srStats.learnedWords / lesson.vocabulary.length 
    : 0;
  
  // 2. Прогресс упражнений (Завершенность)
  // Считаем общее количество задач в уроке
  const totalTasks = lesson.exercises?.reduce((acc, ex) => acc + (ex.tasks?.length || 0), 0) || 0;
  // Считаем сколько задач решено (есть в ответах)
  const solvedTasksCount = progress?.statistics?.answers 
    ? Object.keys(progress.statistics.answers).length 
    : 0;
  const exerciseProgress = totalTasks > 0 ? solvedTasksCount / totalTasks : 0;

  // Среднее арифметическое (50% слова, 50% упражнения)
  // Если упражнений нет, то 100% слова
  let rawProgress = 0;
  if (totalTasks === 0) {
    rawProgress = vocabProgress;
  } else {
    rawProgress = (vocabProgress + exerciseProgress) / 2;
  }
  
  let overallProgress = Math.round(rawProgress * 100);

  // Если есть хоть какая-то активность (просмотр слов или попытки), но прогресс 0 - ставим 1%,
  // чтобы карточка не была "серой" (Не начинали)
  const hasActivity = aggStats.lastStudiedAt || totalAttempts > 0 || Object.keys(vocabStats).length > 0;
  if (overallProgress === 0 && hasActivity) {
    overallProgress = 1;
  }

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
    exercisesCompleted: solvedTasksCount, // Используем уникальные решенные задачи (или totalAttempts если важно количество попыток)
    exerciseAccuracy,
    grammarMastery,
    overallProgress,
    difficultyLevel
  };
};
