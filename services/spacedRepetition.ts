/**
 * Сервис алгоритма Spaced Repetition
 * Refactored for Supabase: Operates on passed state instead of LocalStorage
 */

import { WordStatistics } from './vocabularyStatistics';

// We now expect the state to be passed in, looking like Dictionary<string, SpacedRepetitionData>
export type SRState = Record<string, SpacedRepetitionData>;

export interface SpacedRepetitionData {
  word: string;
  translation: string;
  type: string;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  interval: number; // дни до следующего повторения
  easeFactor: number; // множитель сложности (от 1.3)
  reviewCount: number; // количество успешных повторений
  failureCount: number; // количество ошибок
  isLearned: boolean; // true если >= 5 успешных повторов
  isDue: boolean; // true если пора повторять
}

/**
 * Стандартные дни повторения для базового алгоритма
 */
const REPETITION_SCHEDULE = [1, 3, 7, 14, 30]; // дни

/**
 * Получить данные SR для конкретного слова из состояния
 */
export const getSpacedRepetitionData = (
  srState: SRState,
  word: string,
  translation: string,
  type: string
): SpacedRepetitionData => {
  const existing = srState ? srState[word] : undefined;
  if (existing) {
    return existing;
  }

  // Новое слово
  return {
    word,
    translation,
    type,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(), // Сразу доступно для повтора
    interval: 0,
    easeFactor: 2.5, // Стартовый множитель
    reviewCount: 0,
    failureCount: 0,
    isLearned: false,
    isDue: true
  };
};

/**
 * Зафиксировать успешное повторение слова
 * Возвращает ОБНОВЛЕННОЕ состояние (копию)
 */
export const recordSuccessfulReview = (
  srState: SRState,
  word: string,
  translation: string,
  type: string,
  isDifficult: boolean
): SRState => {
  const data = { ...getSpacedRepetitionData(srState, word, translation, type) };
  
  data.lastReviewDate = new Date().toISOString();
  data.reviewCount++;
  
  // Для сложных слов используем укороченный интервал (x0.6)
  const difficultyMultiplier = isDifficult ? 0.6 : 1;
  
  // Определяем интервал на основе количества успешных повторов
  if (data.reviewCount <= REPETITION_SCHEDULE.length) {
    data.interval = Math.ceil(REPETITION_SCHEDULE[data.reviewCount - 1] * difficultyMultiplier);
  } else {
    // После стандартного расписания используем формулу
    data.interval = Math.ceil(30 * data.easeFactor * difficultyMultiplier);
  }

  // Проверяем, является ли слово выученным
  data.isLearned = data.reviewCount >= 5;

  // Вычисляем дату следующего повтора
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + data.interval);
  data.nextReviewDate = nextReview.toISOString();
  
  // Return updated state map
  return {
    ...srState,
    [word]: data
  };
};

/**
 * Зафиксировать ошибку при повторении
 * Возвращает ОБНОВЛЕННОЕ состояние
 */
export const recordFailedReview = (
  srState: SRState,
  word: string,
  translation: string,
  type: string
): SRState => {
  const data = { ...getSpacedRepetitionData(srState, word, translation, type) };
  
  data.lastReviewDate = new Date().toISOString();
  data.failureCount++;
  
  // Уменьшаем множитель при ошибке
  data.easeFactor = Math.max(1.3, data.easeFactor - 0.2);
  
  // Сбрасываем счётчик успехов (начинаем заново)
  data.reviewCount = 0;
  
  // Первый интервал — 1 день
  data.interval = 1;
  data.isLearned = false;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + 1);
  data.nextReviewDate = nextReview.toISOString();

  return {
    ...srState,
    [word]: data
  };
};

/**
 * Проверить, пора ли повторять слово
 */
export const isWordDue = (srState: SRState, word: string): boolean => {
  const data = srState ? srState[word] : undefined;
  if (!data) return true; // Новое слово — доступно сразу

  if (!data.nextReviewDate) return true;

  const nextDate = new Date(data.nextReviewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate <= today;
};

/**
 * Helper to perform sort based on state
 */
export const sortBySpacedRepetition = (
  vocabulary: Array<{ word: string; translation: string; type: string }>,
  srState: SRState,
  difficultWords: Set<string>,
  wordStats: Record<string, WordStatistics>
): Array<{ word: string; translation: string; type: string }> => {
  
  const isLearned = (word: string): boolean => {
    const stats = wordStats[word];
    const sr = srState[word];
    // Check both potential sources (legacy stats vs SR logic)
    if (sr && sr.isLearned) return true;
    if (stats && stats.repeatCount >= 5) return true;
    return false;
  };

  return [...vocabulary].sort((a, b) => {
    const aDue = isWordDue(srState, a.word);
    const bDue = isWordDue(srState, b.word);
    
    // 1. Слова к повторению (isDue) имеют приоритет
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    const aDifficult = difficultWords.has(a.word);
    const bDifficult = difficultWords.has(b.word);

    // 2. Среди слов к повторению: сложные впереди
    if (aDifficult && !bDifficult) return -1;
    if (!aDifficult && bDifficult) return 1;

    const aLearned = isLearned(a.word);
    const bLearned = isLearned(b.word);

    // 3. Невыученные слова впереди (меньше успешных повторов)
    if (!aLearned && bLearned) return -1;
    if (aLearned && !bLearned) return 1;

    // 4. Меньше успешных повторов = впереди
    const aRepeat = wordStats[a.word]?.repeatCount || 0;
    const bRepeat = wordStats[b.word]?.repeatCount || 0;
    if (aRepeat !== bRepeat) return aRepeat - bRepeat;

    return 0;
  });
};

/**
 * Получить статистику SR по уроку (Pure)
 */
export const getSpacedRepetitionStats = (
  vocabulary: Array<{ word: string; translation: string; type: string }>,
  srState: SRState,
  difficultWords: Set<string>
) => {
  let totalWords = vocabulary.length;
  let dueWords = 0; // пора повторять
  let learnedWords = 0; // выученные (5+ повторов)
  let difficultCount = 0;

  vocabulary.forEach(item => {
    const srData = getSpacedRepetitionData(srState, item.word, item.translation, item.type);
    
    if (isWordDue(srState, item.word)) dueWords++;
    
    if (srData.reviewCount >= 5 || srData.isLearned) {
      learnedWords++;
    }
    
    // Check if in difficult set OR marked difficult in SR (if we track it there? we track failureCount)
    // The legacy code used `isWordDifficult` which checked the set.
    if (difficultWords.has(item.word)) difficultCount++;
  });

  return {
    totalWords,
    dueWords,
    learnedWords,
    difficultWords: difficultCount,
    readyPercent: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0,
    needRepeatPercent: totalWords > 0 ? Math.round((dueWords / totalWords) * 100) : 0
  };
};


