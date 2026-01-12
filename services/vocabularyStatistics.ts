/**
 * Сервис для отслеживания статистики запоминания слов
 * Отслеживает: количество повторов, время на карточке, прогресс
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

export interface LessonStatistics {
  lessonId: string;
  totalWordsStudied: number;
  averageRepeatCount: number;
  wordsWithDifficulty: number;
  lastStudiedAt: string;
  wordStats: Map<string, WordStatistics>;
}

const STATS_STORAGE_KEY = 'vocabulary_stats_v1';

/**
 * Получить статистику по уроку
 */
export const getLessonStatistics = (lessonId: string): LessonStatistics => {
  try {
    const saved = localStorage.getItem(`${STATS_STORAGE_KEY}_lesson_${lessonId}`);
    if (saved) {
      const data = JSON.parse(saved);
      data.wordStats = new Map(Object.entries(data.wordStats || {}));
      return data;
    }
  } catch (e) {
    console.error('❌ Ошибка загрузки статистики:', e);
  }
  
  return {
    lessonId,
    totalWordsStudied: 0,
    averageRepeatCount: 0,
    wordsWithDifficulty: 0,
    lastStudiedAt: new Date().toISOString(),
    wordStats: new Map()
  };
};

/**
 * Зафиксировать просмотр слова (добавить повтор)
 */
export const recordWordView = (
  lessonId: string,
  word: string,
  translation: string,
  timeSpentSeconds: number,
  isDifficult: boolean = false
): WordStatistics => {
  const stats = getLessonStatistics(lessonId);
  const wordStat = stats.wordStats.get(word) || {
    word,
    translation,
    repeatCount: 0,
    totalTimeSpent: 0,
    lastSeenAt: new Date().toISOString(),
    isDifficult,
    correctAnswersInExam: 0
  };

  wordStat.repeatCount++;
  wordStat.totalTimeSpent += timeSpentSeconds;
  wordStat.lastSeenAt = new Date().toISOString();
  wordStat.isDifficult = isDifficult;

  stats.wordStats.set(word, wordStat);
  stats.lastStudiedAt = new Date().toISOString();
  stats.totalWordsStudied = stats.wordStats.size;
  stats.wordsWithDifficulty = Array.from(stats.wordStats.values()).filter(w => w.isDifficult).length;
  
  if (stats.wordStats.size > 0) {
    stats.averageRepeatCount = 
      Array.from(stats.wordStats.values()).reduce((sum, w) => sum + w.repeatCount, 0) / 
      stats.wordStats.size;
  }

  saveLessonStatistics(lessonId, stats);
  return wordStat;
};

/**
 * Записать правильный ответ на экзамене
 */
export const recordExamAnswer = (
  lessonId: string,
  word: string,
  isCorrect: boolean
): void => {
  const stats = getLessonStatistics(lessonId);
  const wordStat = stats.wordStats.get(word);
  
  if (wordStat && isCorrect) {
    wordStat.correctAnswersInExam++;
    stats.wordStats.set(word, wordStat);
    saveLessonStatistics(lessonId, stats);
    console.log(`✅ Экзамен: "${word}" — правильный ответ (${wordStat.correctAnswersInExam} раз)`);
  }
};

/**
 * Получить статистику по конкретному слову
 */
export const getWordStat = (lessonId: string, word: string): WordStatistics | undefined => {
  const stats = getLessonStatistics(lessonId);
  return stats.wordStats.get(word);
};

/**
 * Получить топ сложных слов (более 3 повторов)
 */
export const getProblematicWords = (lessonId: string): WordStatistics[] => {
  const stats = getLessonStatistics(lessonId);
  return Array.from(stats.wordStats.values())
    .filter(w => w.repeatCount >= 3 || w.isDifficult)
    .sort((a, b) => b.repeatCount - a.repeatCount);
};

/**
 * Получить слова, которые требуют больше внимания
 * (много времени потрачено, но мало правильных ответов)
 */
export const getNeedHelpWords = (lessonId: string): WordStatistics[] => {
  const stats = getLessonStatistics(lessonId);
  return Array.from(stats.wordStats.values())
    .filter(w => w.totalTimeSpent > 20 && w.correctAnswersInExam === 0)
    .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);
};

/**
 * Сохранить статистику в localStorage
 */
const saveLessonStatistics = (lessonId: string, stats: LessonStatistics): void => {
  try {
    const data = {
      ...stats,
      wordStats: Object.fromEntries(stats.wordStats)
    };
    localStorage.setItem(
      `${STATS_STORAGE_KEY}_lesson_${lessonId}`,
      JSON.stringify(data)
    );
    console.log(`💾 Статистика урока #${lessonId} сохранена`);
  } catch (e) {
    console.error('❌ Ошибка сохранения статистики:', e);
  }
};

/**
 * Получить красивый формат времени
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}сек`;
  return `${Math.round(seconds / 60)}мин`;
};

/**
 * Очистить статистику урока
 */
export const clearLessonStatistics = (lessonId: string): void => {
  try {
    localStorage.removeItem(`${STATS_STORAGE_KEY}_lesson_${lessonId}`);
    console.log(`🗑️ Статистика урока #${lessonId} очищена`);
  } catch (e) {
    console.error('❌ Ошибка очистки статистики:', e);
  }
};
