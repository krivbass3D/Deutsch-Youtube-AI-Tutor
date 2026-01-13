/**
 * Сервис алгоритма Spaced Repetition
 * Параметры:
 * - Дни повторения: 1, 3, 7, 14, 30
 * - "Выученное" слово: 5+ успешных повторений
 * - Сложные слова: повышенная частота повторений
 */

import { getWordStat } from './vocabularyStatistics';
import { isWordDifficult } from './difficultyTracker';

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

const SPACED_REPETITION_KEY = 'spaced_repetition_v1';

/**
 * Стандартные дни повторения для базового алгоритма
 */
const REPETITION_SCHEDULE = [1, 3, 7, 14, 30]; // дни

/**
 * Получить данные SR для конкретного слова
 */
export const getSpacedRepetitionData = (
  lessonId: string,
  word: string,
  translation: string,
  type: string
): SpacedRepetitionData => {
  try {
    const key = `${SPACED_REPETITION_KEY}_${lessonId}_${word}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      const data = JSON.parse(saved);
      console.log(`      ✓ "${word}": найдено reviewCount=${data.reviewCount}`);
      return data;
    } else {
      console.log(`      ✗ "${word}": НЕ найдено в localStorage`);
    }
  } catch (e) {
    console.error('❌ Ошибка загрузки SR данных:', e);
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
 * Сохранить SR данные
 */
const saveSpacedRepetitionData = (lessonId: string, data: SpacedRepetitionData): void => {
  try {
    const key = `${SPACED_REPETITION_KEY}_${lessonId}_${data.word}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('❌ Ошибка сохранения SR данных:', e);
  }
};

/**
 * Зафиксировать успешное повторение слова
 * Используется после правильного ответа в тестовом режиме
 */
export const recordSuccessfulReview = (
  lessonId: string,
  word: string,
  translation: string,
  type: string
): SpacedRepetitionData => {
  const data = getSpacedRepetitionData(lessonId, word, translation, type);
  const isDifficult = isWordDifficult(lessonId, word);

  console.log(`🔍 recordSuccessfulReview: "${word}" в уроке #${lessonId}, текущий reviewCount: ${data.reviewCount}`);

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

  saveSpacedRepetitionData(lessonId, data);
  
  console.log(`✅ Успешный повтор: "${word}" (${data.reviewCount}), isLearned: ${data.isLearned}, следующий через ${data.interval} дней`);
  
  // Диспатч события об обновлении SR данных, чтобы компоненты могли пересчитать метрики
  window.dispatchEvent(new CustomEvent('srDataChanged', { 
    detail: { lessonId, word, reviewCount: data.reviewCount, isLearned: data.isLearned }
  }));
  
  return data;
};

/**
 * Зафиксировать ошибку при повторении
 * Сбрасывает интервал и уменьшает множитель
 */
export const recordFailedReview = (
  lessonId: string,
  word: string,
  translation: string,
  type: string
): SpacedRepetitionData => {
  const data = getSpacedRepetitionData(lessonId, word, translation, type);
  
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

  saveSpacedRepetitionData(lessonId, data);
  
  console.log(`❌ Ошибка повтора: "${word}" (${data.failureCount}), повтор через 1 день`);
  
  return data;
};

/**
 * Проверить, пора ли повторять слово
 */
export const isWordDue = (lessonId: string, word: string): boolean => {
  const stats = getWordStat(lessonId, word);
  if (!stats) return true; // Новое слово — доступно сразу

  const data = getSpacedRepetitionData(
    lessonId,
    word,
    stats.translation,
    'Noun' // Тип значения по умолчанию
  );

  if (!data.nextReviewDate) return true;

  const nextDate = new Date(data.nextReviewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  data.isDue = nextDate <= today;
  return data.isDue;
};

/**
 * Отсортировать словарь по приоритету SR
 * 1. Слова, которые пора повторять (isDue)
 * 2. Сложные слова (более частые повторения)
 * 3. Слова с мало успешными повторами
 * 4. Остальные
 */
export const sortBySpacedRepetition = (
  vocabulary: Array<{ word: string; translation: string; type: string }>,
  lessonId: string
): Array<{ word: string; translation: string; type: string }> => {
  const isDifficult = (word: string) => isWordDifficult(lessonId, word);
  const isLearned = (word: string): boolean => {
    const stats = getWordStat(lessonId, word);
    if (!stats) return false;
    return stats.repeatCount >= 5;
  };

  return vocabulary.sort((a, b) => {
    const aDue = isWordDue(lessonId, a.word);
    const bDue = isWordDue(lessonId, b.word);
    const aStats = getWordStat(lessonId, a.word);
    const bStats = getWordStat(lessonId, b.word);
    const aLearned = isLearned(a.word);
    const bLearned = isLearned(b.word);
    const aDifficult = isDifficult(a.word);
    const bDifficult = isDifficult(b.word);

    // 1. Слова к повторению (isDue) имеют приоритет
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    // 2. Среди слов к повторению: сложные впереди
    if (aDifficult && !bDifficult) return -1;
    if (!aDifficult && bDifficult) return 1;

    // 3. Невыученные слова впереди (меньше успешных повторов)
    if (!aLearned && bLearned) return -1;
    if (aLearned && !bLearned) return 1;

    // 4. Меньше успешных повторов = впереди
    const aRepeat = aStats?.repeatCount || 0;
    const bRepeat = bStats?.repeatCount || 0;
    if (aRepeat !== bRepeat) return aRepeat - bRepeat;

    return 0;
  });
};

/**
 * Получить статистику SR по уроку
 */
export const getSpacedRepetitionStats = (
  vocabulary: Array<{ word: string; translation: string; type: string }>,
  lessonId: string
) => {
  let totalWords = vocabulary.length;
  let dueWords = 0; // пора повторять
  let learnedWords = 0; // выученные (5+ повторов)
  let difficultWords = 0;

  console.log(`\n🔍 getSpacedRepetitionStats #${lessonId}: анализирую ${totalWords} слов...`);

  vocabulary.forEach(item => {
    // Получаем SR данные напрямую, а не через vocabularyStatistics
    const srData = getSpacedRepetitionData(lessonId, item.word, item.translation, item.type);
    
    console.log(`  📄 "${item.word}": reviewCount=${srData.reviewCount}, isLearned=${srData.isLearned}, isDue=${srData.isDue}`);
    
    if (isWordDue(lessonId, item.word)) dueWords++;
    
    // Используем reviewCount из SR, а не repeatCount из словаря
    if (srData.reviewCount >= 5 || srData.isLearned) {
      learnedWords++;
      console.log(`    ✅ ВЫУЧЕНО!`);
    }
    
    if (isWordDifficult(lessonId, item.word)) difficultWords++;
  });

  console.log(`📊 ИТОГ: learnedWords=${learnedWords}/${totalWords}\n`);

  return {
    totalWords,
    dueWords,
    learnedWords,
    difficultWords,
    readyPercent: Math.round((learnedWords / totalWords) * 100) || 0,
    needRepeatPercent: Math.round((dueWords / totalWords) * 100) || 0
  };
};

/**
 * Получить слова, готовые к повторению (для быстрого доступа)
 */
export const getDueWords = (
  vocabulary: Array<{ word: string; translation: string; type: string }>,
  lessonId: string
): typeof vocabulary => {
  return vocabulary.filter(word => isWordDue(lessonId, word.word));
};

/**
 * Сбросить SR прогресс (для тестирования)
 */
export const resetSpacedRepetition = (lessonId: string): void => {
  try {
    const keys = Object.keys(localStorage);
    const srKeys = keys.filter(k => k.startsWith(`${SPACED_REPETITION_KEY}_${lessonId}_`));
    srKeys.forEach(k => localStorage.removeItem(k));
    console.log(`🔄 SR прогресс урока #${lessonId} сброшен`);
  } catch (e) {
    console.error('❌ Ошибка сброса SR прогресса:', e);
  }
};
