/**
 * Сервис для отслеживания сложных слов
 * Refactored for Supabase: Pure state manipulation
 */

// State is just an array of strings (difficult words)
export type DifficultyState = string[];

export const isWordDifficult = (difficultWords: DifficultyState, word: string): boolean => {
  return difficultWords.includes(word);
};

export const toggleDifficultWord = (difficultWords: DifficultyState, word: string): DifficultyState => {
  const exists = difficultWords.includes(word);
  
  if (exists) {
    return difficultWords.filter(w => w !== word);
  } else {
    return [...difficultWords, word];
  }
};

export const getDifficultWordCount = (difficultWords: DifficultyState): number => {
  return difficultWords.length;
};

export const sortByDifficulty = (
  vocabulary: Array<{ word: string; translation: string; type: string }>,
  difficultWords: DifficultyState
): Array<{ word: string; translation: string; type: string; isDifficult?: boolean }> => {
  return vocabulary
    .map(word => ({
      ...word,
      isDifficult: difficultWords.includes(word.word)
    }))
    .sort((a, b) => {
      if (a.isDifficult && !b.isDifficult) return -1;
      if (!a.isDifficult && b.isDifficult) return 1;
      return 0;
    });
};


