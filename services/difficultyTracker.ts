/**
 * Сервис для отслеживания сложных слов
 * Сохраняет в localStorage ключевые слова, которые учащиеся отметили как сложные
 */

interface DifficultyData {
  difficultWords: Set<string>; // key: "lesson_1_heißen"
  lastUpdated: string;
}

const DIFFICULTY_STORAGE_KEY = 'vocabulary_difficulty_v1';

export const getDifficultWords = (lessonId: string): Set<string> => {
  try {
    const saved = localStorage.getItem(`${DIFFICULTY_STORAGE_KEY}_lesson_${lessonId}`);
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch (e) {
    console.error('❌ Ошибка загрузки сложных слов:', e);
  }
  return new Set();
};

export const isWordDifficult = (lessonId: string, word: string): boolean => {
  const difficultWords = getDifficultWords(lessonId);
  return difficultWords.has(word);
};

export const toggleDifficultWord = (lessonId: string, word: string): boolean => {
  const difficultWords = getDifficultWords(lessonId);
  const isCurrent = difficultWords.has(word);
  
  if (isCurrent) {
    difficultWords.delete(word);
  } else {
    difficultWords.add(word);
  }
  
  try {
    localStorage.setItem(
      `${DIFFICULTY_STORAGE_KEY}_lesson_${lessonId}`,
      JSON.stringify(Array.from(difficultWords))
    );
    console.log(`✅ Слово "${word}" ${isCurrent ? 'удалено из' : 'добавлено в'} сложные`);
    return !isCurrent; // Возвращаем новое состояние
  } catch (e) {
    console.error('❌ Ошибка сохранения сложных слов:', e);
    return isCurrent;
  }
};

export const getDifficultWordCount = (lessonId: string): number => {
  return getDifficultWords(lessonId).size;
};

export const sortByDifficulty = (
  vocabulary: Array<{ word: string; translation: string; type: string }>,
  lessonId: string
): Array<{ word: string; translation: string; type: string; isDifficult?: boolean }> => {
  const difficultWords = getDifficultWords(lessonId);
  
  // Сортируем: сложные слова в начале
  return vocabulary
    .map(word => ({
      ...word,
      isDifficult: difficultWords.has(word.word)
    }))
    .sort((a, b) => {
      if (a.isDifficult && !b.isDifficult) return -1;
      if (!a.isDifficult && b.isDifficult) return 1;
      return 0;
    });
};
