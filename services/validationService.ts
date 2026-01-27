// Локальная валидация ответов без использования API

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 * (минимальное количество редактирований для преобразования одной в другую)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Вычисляет процент схожести между двумя строками (0-100)
 */
function similarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 100;

  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

/**
 * Нормализует строку для сравнения
 */
function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[,!?;:.]/g, '');
}

/**
 * Проверяет локально, содержит ли ответ все нужные слова
 */
function containsAllWords(userAnswer: string, correctAnswer: string): boolean {
  const correctWords = normalize(correctAnswer)
    .split(' ')
    .filter(w => w.length > 2); // Пропускаем короткие слова

  const userAnswerNorm = normalize(userAnswer);

  return correctWords.every(word => userAnswerNorm.includes(word));
}

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
  shouldCallAPI: boolean; // true = нужно вызвать API, false = ответ готов
}

/**
 * Основная функция валидации
 * Проверяет ответ локально и возвращает результат или null если нужна API
 */
export function validateAnswer(
  userAnswer: string,
  correctAnswer: string
): ValidationResult | null {
  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);

  // 1️⃣ Точное совпадение (100% совпадение)
  if (userNorm === correctNorm) {
    return {
      isCorrect: true,
      message: '✅ Верно! Отличный порядок слов.',
      shouldCallAPI: false,
    };
  }

  // 2️⃣ Проверка схожести (опечатки)
  const sim = similarity(userNorm, correctNorm);
  if (sim >= 85) {
    // 85%+ схожести = скорее всего опечатка
    return {
      isCorrect: false,
      message: `👍 Почти верно! Вы правильно поняли, но есть опечатка.\n\nПравильный вариант: **${correctAnswer}**\n\n🔄 Попробуйте ещё раз!`,
      shouldCallAPI: false,
    };
  }

  // 3️⃣ Содержит все нужные слова (хороший порядок слов)
  if (containsAllWords(userAnswer, correctAnswer)) {
    // Проверяем, может ли быть альтернативный ответ
    if (sim >= 70) {
      return {
        isCorrect: true,
        message: `✅ Верно! Хороший вариант.\n\n(Стандартный ответ: **${correctAnswer}**)`,
        shouldCallAPI: false,
      };
    }
  }

  // 4️⃣ Если ничего не совпало - вызываем API
  return null;
}
