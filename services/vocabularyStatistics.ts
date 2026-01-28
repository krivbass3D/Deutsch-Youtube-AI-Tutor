/**
 * Сервис для отслеживания статистики запоминания слов
 * Refactored for Supabase: Pure state manipulation
 */

export interface WordStatistics {
  word: string;
  translation: string;
  repeatCount: number;           // Сколько раз видел слово
  totalTimeSpent: number;        // Общее время в секундах
  lastSeenAt: string;            // ISO дата последнего просмотра
  isDifficult: boolean;          // Отмечено ли как сложное
  correctAnswersInExam: number;  // Правильные ответы на экзамене
}

// State is a Record (Map) of word -> statistics
export type VocabStatsState = Record<string, WordStatistics>;

export interface LessonStatisticsAggregated {
  totalWordsStudied: number;
  averageRepeatCount: number;
  wordsWithDifficulty: number;
  lastStudiedAt: string;
}

/**
 * Получить статистику по конкретному слову
 */
export const getWordStat = (stats: VocabStatsState, word: string): WordStatistics | undefined => {
  return stats[word];
};

/**
 * Зафиксировать просмотр слова (добавить повтор)
 * Returns UPDATED state (whole map)
 */
export const recordWordView = (
  currentStats: VocabStatsState,
  word: string,
  translation: string,
  timeSpentSeconds: number,
  isDifficult: boolean = false
): VocabStatsState => {
  const newStats = { ...currentStats };
  
  const existing = newStats[word] || {
    word,
    translation,
    repeatCount: 0,
    totalTimeSpent: 0,
    lastSeenAt: new Date().toISOString(),
    isDifficult,
    correctAnswersInExam: 0
  };

  newStats[word] = {
    ...existing,
    repeatCount: existing.repeatCount + 1,
    totalTimeSpent: existing.totalTimeSpent + timeSpentSeconds,
    lastSeenAt: new Date().toISOString(),
    isDifficult
  };

  return newStats;
};

/**
 * Записать правильный ответ на экзамене
 */
export const recordExamAnswer = (
  currentStats: VocabStatsState,
  word: string,
  isCorrect: boolean,
  translation: string = ""
): VocabStatsState => {
  const newStats = { ...currentStats };
  const existing = newStats[word] || {
    word,
    translation,
    repeatCount: 1, // At least once if they are taking an exam
    totalTimeSpent: 0,
    lastSeenAt: new Date().toISOString(),
    isDifficult: false,
    correctAnswersInExam: 0
  };

  newStats[word] = {
    ...existing,
    lastSeenAt: new Date().toISOString(),
    correctAnswersInExam: isCorrect ? existing.correctAnswersInExam + 1 : existing.correctAnswersInExam
  };
  
  return newStats;
};

/**
 * Вычислить агрегированную статистику
 */
export const calculateAggregateStats = (stats: VocabStatsState): LessonStatisticsAggregated => {
  const values = Object.values(stats);
  const totalWords = values.length;
  
  if (totalWords === 0) {
    return {
      totalWordsStudied: 0,
      averageRepeatCount: 0,
      wordsWithDifficulty: 0,
      lastStudiedAt: new Date().toISOString()
    };
  }

  const avgRepeat = values.reduce((sum, w) => sum + w.repeatCount, 0) / totalWords;
  const difficultCount = values.filter(w => w.isDifficult).length;

  // Find most recent date
  let lastDate = values[0].lastSeenAt;
  values.forEach(v => {
    if (v.lastSeenAt > lastDate) lastDate = v.lastSeenAt;
  });

  return {
    totalWordsStudied: totalWords,
    averageRepeatCount: avgRepeat,
    wordsWithDifficulty: difficultCount,
    lastStudiedAt: lastDate
  };
};

/**
 * Получить красивый формат времени
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}сек`;
  return `${Math.round(seconds / 60)}мин`;
};


