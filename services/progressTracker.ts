/**
 * Сервис глобального трекинга прогресса между уроками
 * Анализирует прогресс по всем урокам и даёт рекомендации
 */

import { Lesson, LessonProgress } from '../types';
import { getLessonStatistics } from './vocabularyStatistics';
import { getSpacedRepetitionStats } from './spacedRepetition';

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

export interface GlobalProgress {
  totalWordsLearned: number;
  wordsLearnedThisWeek: number;
  totalExercisesCompleted: number;
  overallAccuracy: number;
  lessonsInProgress: number;
  lessonsCompleted: number;
  hardestLesson: LessonMetrics | null;
  easiestLesson: LessonMetrics | null;
  lessonsNeedingReview: LessonMetrics[];
  recommendedNextLesson: LessonMetrics | null;
  completionStreak: number; // дни подряд занятий
  motivationLevel: 'low' | 'medium' | 'high';
}

/**
 * Получить метрики одного урока
 */
export const getLessonMetrics = (
  lesson: Lesson,
  progress: LessonProgress | null,
  exerciseAnswers?: Record<string, { userAnswer: string; correct: boolean }>
): LessonMetrics => {
  console.log(`📈 Расчёт метрик для урока #${lesson.lesson_id}:`, {
    hasProgress: !!progress,
    vocabCompleted: progress?.vocabCompleted,
    completed: progress?.completed
  });

  const stats = getLessonStatistics(lesson.lesson_id);
  const srStats = getSpacedRepetitionStats(lesson.vocabulary || [], lesson.lesson_id);
  
  console.log(`   SR статистика:`, srStats);
  
  // Упражнения
  const answers = exerciseAnswers || {};
  const totalAnswers = Object.keys(answers).length;
  const correctAnswers = Object.values(answers).filter(a => a.correct).length;
  const exerciseAccuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  // Слова, выученные на этой неделе
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const wordsLearnedThisWeek = Array.from((stats.wordStats as any).values() || []).filter((w: any) => {
    if (!w.lastSeenAt) return false;
    const seenDate = new Date(w.lastSeenAt);
    return seenDate >= oneWeekAgo && w.repeatCount >= 5;
  }).length;

  // Последнее изучение
  const lastStudied = stats.lastStudiedAt ? new Date(stats.lastStudiedAt) : null;
  const daysSinceLastStudy = lastStudied 
    ? Math.floor((Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Среднее время на слово
  const totalTime = Array.from((stats.wordStats as any).values() || []).reduce((sum: number, w: any) => sum + (w.totalTimeSpent || 0), 0);
  const totalWords = stats.wordStats ? stats.wordStats.size : 0;
  const avgTimePerWord = totalWords > 0 ? (totalTime as number) / totalWords : 0;

  // Грамматика мастерство (на основе точности упражнений)
  const grammarMastery = exerciseAccuracy;

  // Общий прогресс
  const overallProgress = Math.round(
    (srStats.learnedWords / (lesson.vocabulary?.length || 1)) * 100
  );

  // Уровень сложности (по точности)
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
    lastStudiedAt: stats.lastStudiedAt || null,
    daysSinceLastStudy: daysSinceLastStudy || null,
    exercisesCompleted: totalAnswers,
    exerciseAccuracy,
    grammarMastery,
    overallProgress,
    difficultyLevel
  };
};

/**
 * Получить глобальный прогресс по всем урокам
 */
export const getGlobalProgress = (
  lessons: Lesson[],
  lessonsProgress: Record<string, LessonProgress>,
  exerciseAnswersMap?: Record<string, Record<string, { userAnswer: string; correct: boolean }>>
): GlobalProgress => {
  const metricsPerLesson = lessons.map(lesson => {
    const progress = lessonsProgress[`lesson_${lesson.lesson_id}_progress`] || null;
    const answers = exerciseAnswersMap?.[lesson.lesson_id] || {};
    return getLessonMetrics(lesson, progress, answers);
  });

  // Найти самый сложный и лёгкий
  const hardestLesson = metricsPerLesson.reduce((min, curr) =>
    curr.exerciseAccuracy < (min?.exerciseAccuracy || 100) ? curr : min, 
    metricsPerLesson[0] || null
  );

  const easiestLesson = metricsPerLesson.reduce((max, curr) =>
    curr.exerciseAccuracy > (max?.exerciseAccuracy || 0) ? curr : max,
    metricsPerLesson[0] || null
  );

  // Уроки, требующие повторения (не повторяли > 7 дней)
  const lessonsNeedingReview = metricsPerLesson
    .filter(m => m.daysSinceLastStudy !== null && m.daysSinceLastStudy > 7 && m.overallProgress < 100)
    .sort((a, b) => (b.daysSinceLastStudy || 0) - (a.daysSinceLastStudy || 0));

  // Общие метрики
  const totalLearned = metricsPerLesson.reduce((sum, m) => sum + m.learnedWords, 0);
  const thisWeek = metricsPerLesson.reduce((sum, m) => sum + m.wordsLearnedThisWeek, 0);
  const totalExercises = metricsPerLesson.reduce((sum, m) => sum + m.exercisesCompleted, 0);
  const avgAccuracy = metricsPerLesson.length > 0
    ? Math.round(metricsPerLesson.reduce((sum, m) => sum + m.exerciseAccuracy, 0) / metricsPerLesson.length)
    : 0;

  // Уроки в процессе (прогресс 0-99%)
  const lessonsInProgress = metricsPerLesson.filter(m => m.overallProgress > 0 && m.overallProgress < 100).length;
  const lessonsCompleted = metricsPerLesson.filter(m => m.overallProgress === 100).length;

  // Рекомендация: какой урок делать дальше
  let recommendedNextLesson: LessonMetrics | null = null;
  
  // Приоритет 1: Уроки, требующие повторения (не повторяли давно)
  if (lessonsNeedingReview.length > 0) {
    recommendedNextLesson = lessonsNeedingReview[0];
  } else {
    // Приоритет 2: Урок с наиболее низкой точностью (нужна работа)
    const needsWork = metricsPerLesson
      .filter(m => m.overallProgress > 0 && m.overallProgress < 100)
      .sort((a, b) => a.exerciseAccuracy - b.exerciseAccuracy)[0];
    
    if (needsWork) {
      recommendedNextLesson = needsWork;
    } else {
      // Приоритет 3: Первый незавершённый урок
      recommendedNextLesson = metricsPerLesson.find(m => m.overallProgress < 100) || metricsPerLesson[0] || null;
    }
  }

  // Мотивационный уровень
  let motivationLevel: 'low' | 'medium' | 'high' = 'medium';
  if (thisWeek >= 50) motivationLevel = 'high';
  if (thisWeek < 10) motivationLevel = 'low';

  return {
    totalWordsLearned: totalLearned,
    wordsLearnedThisWeek: thisWeek,
    totalExercisesCompleted: totalExercises,
    overallAccuracy: avgAccuracy,
    lessonsInProgress,
    lessonsCompleted,
    hardestLesson,
    easiestLesson,
    lessonsNeedingReview,
    recommendedNextLesson,
    completionStreak: 0, // TODO: имплементировать подсчёт
    motivationLevel
  };
};

/**
 * Получить методические рекомендации (для фронтенда)
 */
export const getPedagogicalRecommendations = (
  globalProgress: GlobalProgress,
  allMetrics: LessonMetrics[]
) => {
  const recommendations: Array<{
    type: 'warning' | 'suggestion' | 'praise';
    icon: string;
    title: string;
    description: string;
    actionLesson?: string;
  }> = [];

  // Если нужно повторить уроки
  if (globalProgress.lessonsNeedingReview.length > 0) {
    recommendations.push({
      type: 'warning',
      icon: '⏰',
      title: `Пора повторять ${globalProgress.lessonsNeedingReview.length} урок(ов)`,
      description: `Вы не занимались уроком "${globalProgress.lessonsNeedingReview[0].title}" ${globalProgress.lessonsNeedingReview[0].daysSinceLastStudy} дней. Спaced Repetition требует регулярного повторения!`,
      actionLesson: globalProgress.lessonsNeedingReview[0].lessonId
    });
  }

  // Если есть сложный урок
  if (globalProgress.hardestLesson && globalProgress.hardestLesson.exerciseAccuracy < 50) {
    recommendations.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Сложный урок требует внимания',
      description: `Урок "${globalProgress.hardestLesson.title}" имеет точность ${globalProgress.hardestLesson.exerciseAccuracy}%. Рекомендуем медленнее, с акцентом на грамматику.`,
      actionLesson: globalProgress.hardestLesson.lessonId
    });
  }

  // Если хороший прогресс
  if (globalProgress.wordsLearnedThisWeek >= 50) {
    recommendations.push({
      type: 'praise',
      icon: '🌟',
      title: 'Отличный прогресс на этой неделе!',
      description: `Вы выучили ${globalProgress.wordsLearnedThisWeek} слов! Продолжайте в том же темпе — вы на правильном пути.`
    });
  }

  // Если средний прогресс
  if (globalProgress.wordsLearnedThisWeek < 10 && globalProgress.wordsLearnedThisWeek > 0) {
    recommendations.push({
      type: 'suggestion',
      icon: '💡',
      title: 'Увеличьте интенсивность занятий',
      description: `На этой неделе выучено только ${globalProgress.wordsLearnedThisWeek} слов. Выделяйте 20-30 минут в день на практику.`
    });
  }

  // Рекомендация по грамматике
  if (globalProgress.overallAccuracy < 70) {
    recommendations.push({
      type: 'suggestion',
      icon: '📝',
      title: 'Сосредоточьтесь на грамматике в упражнениях',
      description: 'Точность упражнений ниже рекомендуемого уровня (70%). Разбирайте грамматические объяснения в упражнениях подробнее.'
    });
  }

  return recommendations;
};

/**
 * Получить статистику по словам (какие сложнее всего запоминаются)
 */
export const getMostChallensingWords = (
  lesson: Lesson,
  limit = 10
) => {
  const stats = getLessonStatistics(lesson.lesson_id);
  
  return Array.from((stats.wordStats as any).values() || [])
    .map((w: any) => ({
      word: w.word,
      translation: w.translation,
      repeatCount: w.repeatCount,
      timeSpent: w.totalTimeSpent,
      correctAnswers: w.correctAnswersInExam,
      isDifficult: w.isDifficult,
      difficulty: w.repeatCount > 3 || w.isDifficult ? 'high' : 
                 w.repeatCount > 1 ? 'medium' : 'low'
    }))
    .sort((a, b) => {
      // Сложные слова с많은 повторами — в начале
      const aScore = a.repeatCount + (a.isDifficult ? 10 : 0) - a.correctAnswers * 2;
      const bScore = b.repeatCount + (b.isDifficult ? 10 : 0) - b.correctAnswers * 2;
      return bScore - aScore;
    })
    .slice(0, limit);
};
