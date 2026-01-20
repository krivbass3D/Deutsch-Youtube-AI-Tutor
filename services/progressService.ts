/**
 * Сервис управления прогрессом в localStorage
 * Хранит информацию о прогрессе по урокам, словах и упражнениях
 */

import { Lesson, Vocabulary } from '../types';

// ============================================
// ТИПЫ ДАННЫХ
// ============================================

export interface WordProgress {
  word: string;
  translation: string;
  attempts: number;
  correctAttempts: number;
  examPassed: boolean;
  examPassedAt: number | null;
  lastAttemptAt: number;
}

export interface ExerciseProgress {
  sentence: string;
  translation: string;
  attempts: number;
  correctAttempts: number;
  firstAttemptCorrect: boolean;
  correctAt: number | null;
  isLearned: boolean;
  lastAttemptAt: number;
}

export interface LessonMetrics {
  totalWords: number;
  wordsLearned: number;
  totalExercises: number;
  exercisesLearned: number;
  exerciseAccuracy: number; // percentage
}

export interface LessonData {
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: number;
  
  vocabulary: Record<string, WordProgress>;
  exercises: Record<string, ExerciseProgress>;
  metrics: LessonMetrics;
  
  completedAt: number | null;
}

export interface DashboardStats {
  totalWordsLearned: number;
  wordsLearnedThisWeek: number;
  totalExerciseAttempts: number;
  exerciseAttemptsCorrect: number;
  lessonsInProgress: number;
  lessonsCompleted: number;
}

export interface UserProgress {
  stats: DashboardStats;
  lessons: Record<string, LessonData>;
  weeklyStats: Record<string, { wordsLearned: number; exerciseAttempts: number; correctAttempts: number }>;
  lastUpdated: number;
}

// ============================================
// КОНСТАНТЫ И УТИЛИТЫ
// ============================================

const STORAGE_KEY = 'userProgress';

function getCurrentWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// ============================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================

/**
 * Инициализировать прогресс (если первый раз)
 */
export function initializeProgress(): UserProgress {
  return {
    stats: {
      totalWordsLearned: 0,
      wordsLearnedThisWeek: 0,
      totalExerciseAttempts: 0,
      exerciseAttemptsCorrect: 0,
      lessonsInProgress: 0,
      lessonsCompleted: 0,
    },
    lessons: {},
    weeklyStats: {},
    lastUpdated: Date.now(),
  };
}

/**
 * Получить прогресс пользователя
 */
export function getProgress(): UserProgress {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = initializeProgress();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
}

/**
 * Сохранить прогресс в localStorage
 */
function saveProgress(progress: UserProgress): void {
  progress.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Инициализировать урок (первый раз, когда пользователь открывает урок)
 */
export function initializeLessonProgress(lesson: Lesson): void {
  const progress = getProgress();
  
  if (!progress.lessons[lesson.lesson_id]) {
    const vocabulary: Record<string, WordProgress> = {};
    (lesson.vocabulary || []).forEach((vocab, idx) => {
      vocabulary[`word_${idx}`] = {
        word: vocab.word,
        translation: vocab.translation,
        attempts: 0,
        correctAttempts: 0,
        examPassed: false,
        examPassedAt: null,
        lastAttemptAt: 0,
      };
    });

    // Используем текст предложения как ID упражнения (из тестов)
    const exercises: Record<string, ExerciseProgress> = {};
    (lesson.exercises || []).forEach((exercise) => {
      exercise.tasks.forEach((task, idx) => {
        const sentenceId = `exercise_${exercise.title.replace(/\s+/g, '_')}_task_${idx}`;
        exercises[sentenceId] = {
          sentence: task,
          translation: lesson.answers[exercise.title]?.solutions[idx] || '',
          attempts: 0,
          correctAttempts: 0,
          firstAttemptCorrect: false,
          correctAt: null,
          isLearned: false,
          lastAttemptAt: 0,
        };
      });
    });

    progress.lessons[lesson.lesson_id] = {
      status: 'not_started',
      startedAt: Date.now(),
      vocabulary,
      exercises,
      metrics: {
        totalWords: (lesson.vocabulary || []).length,
        wordsLearned: 0,
        totalExercises: (lesson.exercises || []).reduce((sum, ex) => sum + ex.tasks.length, 0),
        exercisesLearned: 0,
        exerciseAccuracy: 0,
      },
      completedAt: null,
    };

    saveProgress(progress);
  }
}

/**
 * Зафиксировать попытку слова на экзамене
 */
export function recordWordExamAttempt(lessonId: string, wordId: string, passed: boolean): void {
  const progress = getProgress();
  const lesson = progress.lessons[lessonId];
  if (!lesson) return;

  const word = lesson.vocabulary[wordId];
  if (!word) return;

  word.attempts++;
  word.lastAttemptAt = Date.now();

  if (passed) {
    word.correctAttempts++;
    if (!word.examPassed) {
      word.examPassed = true;
      word.examPassedAt = Date.now();

      // Обновить статистику
      lesson.metrics.wordsLearned++;
      updateLessonStatus(lesson);
      
      // Добавить в недельную статистику
      const weekStart = getCurrentWeekStart();
      if (!progress.weeklyStats[weekStart]) {
        progress.weeklyStats[weekStart] = {
          wordsLearned: 0,
          exerciseAttempts: 0,
          correctAttempts: 0,
        };
      }
      progress.weeklyStats[weekStart].wordsLearned++;

      // Обновить общую статистику
      progress.stats.totalWordsLearned++;
      progress.stats.wordsLearnedThisWeek++;
    }
  }

  updateDashboardStats(progress);
  saveProgress(progress);
}

/**
 * Зафиксировать попытку упражнения
 */
export function recordExerciseAttempt(
  lessonId: string,
  exerciseId: string,
  isFirstAttempt: boolean,
  isCorrect: boolean
): void {
  const progress = getProgress();
  const lesson = progress.lessons[lessonId];
  if (!lesson) return;

  const exercise = lesson.exercises[exerciseId];
  if (!exercise) return;

  exercise.attempts++;
  exercise.lastAttemptAt = Date.now();

  // Общая статистика попыток
  progress.stats.totalExerciseAttempts++;
  
  const weekStart = getCurrentWeekStart();
  if (!progress.weeklyStats[weekStart]) {
    progress.weeklyStats[weekStart] = {
      wordsLearned: 0,
      exerciseAttempts: 0,
      correctAttempts: 0,
    };
  }
  progress.weeklyStats[weekStart].exerciseAttempts++;

  // Если правильно с первого раза
  if (isFirstAttempt && isCorrect) {
    exercise.firstAttemptCorrect = true;
    exercise.correctAt = Date.now();
    exercise.isLearned = true;

    // Увеличить счетчик выученных упражнений
    lesson.metrics.exercisesLearned++;
    progress.stats.exerciseAttemptsCorrect++;
    progress.weeklyStats[weekStart].correctAttempts++;
  }

  // Если просто правильно (но не с первого раза)
  if (isCorrect) {
    exercise.correctAttempts++;
  }

  // Обновить точность упражнений
  if (lesson.metrics.totalExercises > 0) {
    lesson.metrics.exerciseAccuracy = Math.round(
      (lesson.metrics.exercisesLearned / lesson.metrics.totalExercises) * 100
    );
  }

  updateLessonStatus(lesson);
  updateDashboardStats(progress);
  saveProgress(progress);
}

/**
 * Обновить статус урока (when it's completed)
 */
function updateLessonStatus(lesson: LessonData): void {
  const allWordsLearned = Object.values(lesson.vocabulary).every(w => w.examPassed);
  const allExercisesLearned = Object.values(lesson.exercises).every(ex => ex.isLearned);

  if (allWordsLearned && allExercisesLearned && lesson.status !== 'completed') {
    lesson.status = 'completed';
    lesson.completedAt = Date.now();
  } else if (lesson.status === 'not_started' && (Object.keys(lesson.vocabulary).some(k => lesson.vocabulary[k].attempts > 0) || Object.keys(lesson.exercises).some(k => lesson.exercises[k].attempts > 0))) {
    lesson.status = 'in_progress';
  }
}

/**
 * Пересчитать статистику dashboard
 */
function updateDashboardStats(progress: UserProgress): void {
  let lessonsInProgress = 0;
  let lessonsCompleted = 0;

  Object.values(progress.lessons).forEach(lesson => {
    if (lesson.status === 'in_progress') lessonsInProgress++;
    if (lesson.status === 'completed') lessonsCompleted++;
  });

  progress.stats.lessonsInProgress = lessonsInProgress;
  progress.stats.lessonsCompleted = lessonsCompleted;
}

/**
 * Получить статус конкретного урока
 */
export function getLessonStatus(lessonId: string): 'not_started' | 'in_progress' | 'completed' {
  const progress = getProgress();
  return progress.lessons[lessonId]?.status || 'not_started';
}

/**
 * Получить метрики урока
 */
export function getLessonMetrics(lessonId: string): LessonMetrics | null {
  const progress = getProgress();
  return progress.lessons[lessonId]?.metrics || null;
}

/**
 * Получить статистику dashboard
 */
export function getDashboardStats(): DashboardStats {
  return getProgress().stats;
}

/**
 * Получить все несохраненные слова/упражнения урока
 */
export function getLessonData(lessonId: string): LessonData | null {
  const progress = getProgress();
  return progress.lessons[lessonId] || null;
}

/**
 * Очистить весь прогресс (для отладки/сброса)
 */
export function clearAllProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Получить информацию о лучших/худших уроках
 */
export function getTopAndBottomLessons(limit: number = 3): {
  best: Array<{ id: string; accuracy: number }>;
  worst: Array<{ id: string; accuracy: number }>;
} {
  const progress = getProgress();
  
  const lessons = Object.entries(progress.lessons)
    .map(([id, lesson]) => ({
      id,
      accuracy: lesson.metrics.exerciseAccuracy,
    }))
    .filter(l => l.accuracy > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  return {
    best: lessons.slice(0, limit),
    worst: lessons.slice(-limit).reverse(),
  };
}
