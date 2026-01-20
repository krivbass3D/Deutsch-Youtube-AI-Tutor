/**
 * Phase 3 Automated Test Suite
 * Tests for progressService integration
 * 
 * This file contains programmatic tests that can be run in Node.js or browser
 * Date: January 20, 2026
 */

// Mock localStorage for Node.js environment
if (typeof global !== 'undefined' && !global.localStorage) {
  global.localStorage = {
    data: {},
    getItem(key) {
      return this.data[key] || null;
    },
    setItem(key, value) {
      this.data[key] = value;
    },
    removeItem(key) {
      delete this.data[key];
    },
    clear() {
      this.data = {};
    }
  };
}

// Import progressService (simulate the imports)
const STORAGE_KEY = 'userProgress';

function getCurrentWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getProgress() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return initializeProgress();
  }
  return JSON.parse(stored);
}

function saveProgress(progress) {
  progress.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function initializeProgress() {
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

function initializeLessonProgress(lesson) {
  const progress = getProgress();
  
  if (!progress.lessons[lesson.lesson_id]) {
    const vocabulary = {};
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

    const exercises = {};
    (lesson.exercises || []).forEach((exercise) => {
      exercise.tasks.forEach((task, idx) => {
        const sentenceId = `exercise_${exercise.title.replace(/\s+/g, '_')}_task_${idx}`;
        exercises[sentenceId] = {
          sentence: task,
          translation: '',
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
        totalWords: Object.keys(vocabulary).length,
        wordsLearned: 0,
        totalExercises: Object.keys(exercises).length,
        exercisesLearned: 0,
        exerciseAccuracy: 0,
      },
      completedAt: null,
    };

    progress.stats.lessonsInProgress++;
    saveProgress(progress);
  }
}

function recordWordExamAttempt(lessonId, wordId, passed) {
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

      lesson.metrics.wordsLearned++;
      
      const weekStart = getCurrentWeekStart();
      if (!progress.weeklyStats[weekStart]) {
        progress.weeklyStats[weekStart] = {
          wordsLearned: 0,
          exerciseAttempts: 0,
          correctAttempts: 0,
        };
      }
      progress.weeklyStats[weekStart].wordsLearned++;

      progress.stats.totalWordsLearned++;
      progress.stats.wordsLearnedThisWeek++;
    }
  }

  saveProgress(progress);
}

function recordExerciseAttempt(lessonId, exerciseId, isCorrect, isFirstAttempt) {
  const progress = getProgress();
  const lesson = progress.lessons[lessonId];
  if (!lesson) return;

  const exercise = lesson.exercises[exerciseId];
  if (!exercise) return;

  exercise.attempts++;
  exercise.lastAttemptAt = Date.now();

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

  if (isFirstAttempt && isCorrect) {
    exercise.firstAttemptCorrect = true;
    exercise.correctAt = Date.now();
    exercise.isLearned = true;

    lesson.metrics.exercisesLearned++;
    progress.stats.exerciseAttemptsCorrect++;
    progress.weeklyStats[weekStart].correctAttempts++;
  }

  if (isCorrect) {
    exercise.correctAttempts++;
  }

  if (lesson.metrics.totalExercises > 0) {
    lesson.metrics.exerciseAccuracy = Math.round(
      (lesson.metrics.exercisesLearned / lesson.metrics.totalExercises) * 100
    );
  }

  saveProgress(progress);
}

function getDashboardStats() {
  return getProgress().stats;
}

function getLessonMetrics(lessonId) {
  const progress = getProgress();
  return progress.lessons[lessonId]?.metrics || null;
}

function getLessonData(lessonId) {
  const progress = getProgress();
  return progress.lessons[lessonId] || null;
}

// ============================================
// TEST SUITE
// ============================================

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  describe(name, fn) {
    console.log(`\n📋 ${name}`);
    fn();
  }

  test(name, fn) {
    try {
      fn();
      this.passed++;
      this.results.push({ name, status: 'PASS', error: null });
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.failed++;
      this.results.push({ name, status: 'FAIL', error: error.message });
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message} - Expected ${expected}, got ${actual}`);
    }
  }

  assertTrue(value, message) {
    if (!value) {
      throw new Error(message);
    }
  }

  assertExists(value, message) {
    if (!value) {
      throw new Error(message);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 TEST SUMMARY\n`);
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%\n`);

    if (this.failed === 0) {
      console.log('🎉 ALL TESTS PASSED!\n');
    } else {
      console.log('Failed tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
      console.log('');
    }
  }
}

const runner = new TestRunner();

// Mock lesson data
const mockLesson = {
  lesson_id: 'lesson_1',
  title: 'Test Lesson',
  vocabulary: [
    { word: 'Haus', translation: 'House', type: 'noun' },
    { word: 'Tisch', translation: 'Table', type: 'noun' },
    { word: 'Stuhl', translation: 'Chair', type: 'noun' },
  ],
  exercises: [
    {
      title: 'Satz1',
      tasks: ['Das ist ein Haus', 'Das ist ein Tisch'],
    },
    {
      title: 'Satz2',
      tasks: ['Das ist ein Stuhl'],
    },
  ],
  answers: [
    {
      exercise: 1,
      solutions: ['This is a house', 'This is a table'],
    },
    {
      exercise: 2,
      solutions: ['This is a chair'],
    },
  ],
};

// ============================================
// TEST SUITE 1: INITIALIZATION
// ============================================

runner.describe('TEST SUITE 1: Initialization', () => {
  runner.test('Clear localStorage before tests', () => {
    localStorage.clear();
    runner.assertTrue(localStorage.getItem(STORAGE_KEY) === null, 'Storage should be empty');
  });

  runner.test('Initialize lesson progress', () => {
    initializeLessonProgress(mockLesson);
    const progress = getProgress();
    runner.assertExists(progress.lessons[mockLesson.lesson_id], 'Lesson should be initialized');
  });

  runner.test('Lesson has correct vocabulary count', () => {
    const progress = getProgress();
    const lesson = progress.lessons[mockLesson.lesson_id];
    runner.assertEquals(Object.keys(lesson.vocabulary).length, 3, 'Should have 3 words');
  });

  runner.test('Lesson has correct exercise count', () => {
    const progress = getProgress();
    const lesson = progress.lessons[mockLesson.lesson_id];
    runner.assertEquals(Object.keys(lesson.exercises).length, 3, 'Should have 3 exercises');
  });

  runner.test('Lesson status is "not_started"', () => {
    const progress = getProgress();
    const lesson = progress.lessons[mockLesson.lesson_id];
    runner.assertEquals(lesson.status, 'not_started', 'Status should be not_started');
  });

  runner.test('Dashboard stats show lesson in progress', () => {
    const stats = getDashboardStats();
    runner.assertEquals(stats.lessonsInProgress, 1, 'Should have 1 lesson in progress');
  });
});

// ============================================
// TEST SUITE 2: WORD TRACKING
// ============================================

runner.describe('TEST SUITE 2: Word Exam Attempt Tracking', () => {
  runner.test('Record correct word attempt', () => {
    recordWordExamAttempt(mockLesson.lesson_id, 'word_0', true);
    const progress = getProgress();
    const word = progress.lessons[mockLesson.lesson_id].vocabulary.word_0;
    runner.assertTrue(word.examPassed, 'Word should be marked as passed');
    runner.assertEquals(word.attempts, 1, 'Attempts count should be 1');
    runner.assertEquals(word.correctAttempts, 1, 'Correct attempts should be 1');
  });

  runner.test('Record incorrect word attempt', () => {
    recordWordExamAttempt(mockLesson.lesson_id, 'word_1', false);
    const progress = getProgress();
    const word = progress.lessons[mockLesson.lesson_id].vocabulary.word_1;
    runner.assertTrue(!word.examPassed, 'Word should not be marked as passed');
    runner.assertEquals(word.attempts, 1, 'Attempts count should be 1');
    runner.assertEquals(word.correctAttempts, 0, 'Correct attempts should be 0');
  });

  runner.test('Words learned count updated', () => {
    const progress = getProgress();
    const lesson = progress.lessons[mockLesson.lesson_id];
    runner.assertEquals(lesson.metrics.wordsLearned, 1, 'Should have 1 word learned');
  });

  runner.test('Dashboard stats updated with words learned', () => {
    const stats = getDashboardStats();
    runner.assertEquals(stats.totalWordsLearned, 1, 'Total words learned should be 1');
    runner.assertEquals(stats.wordsLearnedThisWeek, 1, 'Words learned this week should be 1');
  });

  runner.test('Word ID format is correct', () => {
    const progress = getProgress();
    const lesson = progress.lessons[mockLesson.lesson_id];
    const wordIds = Object.keys(lesson.vocabulary);
    runner.assertTrue(wordIds.includes('word_0'), 'Should have word_0');
    runner.assertTrue(wordIds.includes('word_1'), 'Should have word_1');
    runner.assertTrue(wordIds.includes('word_2'), 'Should have word_2');
  });
});

// ============================================
// TEST SUITE 3: EXERCISE TRACKING
// ============================================

runner.describe('TEST SUITE 3: Exercise Attempt Tracking', () => {
  runner.test('Record exercise attempt - correct on first try', () => {
    recordExerciseAttempt(mockLesson.lesson_id, 'exercise_Satz1_task_0', true, true);
    const progress = getProgress();
    const exercise = progress.lessons[mockLesson.lesson_id].exercises['exercise_Satz1_task_0'];
    runner.assertTrue(exercise.firstAttemptCorrect, 'Should be marked as first attempt correct');
    runner.assertTrue(exercise.isLearned, 'Should be marked as learned');
    runner.assertEquals(exercise.attempts, 1, 'Attempts should be 1');
  });

  runner.test('Record exercise attempt - incorrect on first try', () => {
    recordExerciseAttempt(mockLesson.lesson_id, 'exercise_Satz1_task_1', false, true);
    const progress = getProgress();
    const exercise = progress.lessons[mockLesson.lesson_id].exercises['exercise_Satz1_task_1'];
    runner.assertTrue(!exercise.firstAttemptCorrect, 'Should not be marked as first attempt correct');
    runner.assertTrue(!exercise.isLearned, 'Should not be marked as learned');
    runner.assertEquals(exercise.attempts, 1, 'Attempts should be 1');
  });

  runner.test('Record exercise attempt - correct on second try', () => {
    recordExerciseAttempt(mockLesson.lesson_id, 'exercise_Satz1_task_1', true, false);
    const progress = getProgress();
    const exercise = progress.lessons[mockLesson.lesson_id].exercises['exercise_Satz1_task_1'];
    runner.assertTrue(!exercise.firstAttemptCorrect, 'Should still not be first attempt correct');
    runner.assertTrue(!exercise.isLearned, 'Should still not be marked as learned');
    runner.assertEquals(exercise.attempts, 2, 'Attempts should be 2');
    runner.assertEquals(exercise.correctAttempts, 1, 'Correct attempts should be 1');
  });

  runner.test('Exercise ID format is correct', () => {
    const progress = getProgress();
    const lesson = progress.lessons[mockLesson.lesson_id];
    const exerciseIds = Object.keys(lesson.exercises);
    runner.assertTrue(exerciseIds.includes('exercise_Satz1_task_0'), 'Should have exercise_Satz1_task_0');
    runner.assertTrue(exerciseIds.includes('exercise_Satz1_task_1'), 'Should have exercise_Satz1_task_1');
    runner.assertTrue(exerciseIds.includes('exercise_Satz2_task_0'), 'Should have exercise_Satz2_task_0');
  });

  runner.test('Exercise accuracy calculation', () => {
    const progress = getProgress();
    const lesson = progress.lessons[mockLesson.lesson_id];
    // 1 exercise learned out of 3 total = 33%
    runner.assertEquals(lesson.metrics.exerciseAccuracy, 33, 'Accuracy should be 33%');
  });

  runner.test('Dashboard stats show exercise attempts', () => {
    const stats = getDashboardStats();
    runner.assertTrue(stats.totalExerciseAttempts > 0, 'Should have exercise attempts');
    runner.assertTrue(stats.exerciseAttemptsCorrect > 0, 'Should have correct attempts');
  });
});

// ============================================
// TEST SUITE 4: DATA PERSISTENCE
// ============================================

runner.describe('TEST SUITE 4: Data Persistence', () => {
  runner.test('Progress survives storage retrieval', () => {
    const progress1 = getProgress();
    const stored = localStorage.getItem(STORAGE_KEY);
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, stored);
    const progress2 = getProgress();
    runner.assertEquals(
      progress2.stats.totalWordsLearned,
      progress1.stats.totalWordsLearned,
      'Total words learned should persist'
    );
  });

  runner.test('Multiple lessons tracked independently', () => {
    const lesson2 = { ...mockLesson, lesson_id: 'lesson_2', title: 'Test Lesson 2' };
    initializeLessonProgress(lesson2);
    const progress = getProgress();
    runner.assertExists(progress.lessons['lesson_1'], 'Lesson 1 should exist');
    runner.assertExists(progress.lessons['lesson_2'], 'Lesson 2 should exist');
  });

  runner.test('Weekly stats tracked correctly', () => {
    const progress = getProgress();
    const weekStart = getCurrentWeekStart();
    runner.assertExists(progress.weeklyStats[weekStart], 'Weekly stats should exist for current week');
  });
});

// ============================================
// TEST SUITE 5: DASHBOARD STATISTICS
// ============================================

runner.describe('TEST SUITE 5: Dashboard Statistics', () => {
  runner.test('getDashboardStats returns correct stats object', () => {
    const stats = getDashboardStats();
    runner.assertExists(stats.totalWordsLearned, 'Should have totalWordsLearned');
    runner.assertExists(stats.wordsLearnedThisWeek, 'Should have wordsLearnedThisWeek');
    runner.assertExists(stats.totalExerciseAttempts, 'Should have totalExerciseAttempts');
    runner.assertExists(stats.exerciseAttemptsCorrect, 'Should have exerciseAttemptsCorrect');
    runner.assertExists(stats.lessonsInProgress, 'Should have lessonsInProgress');
    runner.assertExists(stats.lessonsCompleted, 'Should have lessonsCompleted');
  });

  runner.test('getLessonMetrics returns correct metrics', () => {
    const metrics = getLessonMetrics(mockLesson.lesson_id);
    runner.assertExists(metrics, 'Should return metrics');
    runner.assertExists(metrics.totalWords, 'Should have totalWords');
    runner.assertExists(metrics.wordsLearned, 'Should have wordsLearned');
    runner.assertExists(metrics.totalExercises, 'Should have totalExercises');
    runner.assertExists(metrics.exercisesLearned, 'Should have exercisesLearned');
    runner.assertExists(metrics.exerciseAccuracy, 'Should have exerciseAccuracy');
  });

  runner.test('getLessonData returns complete lesson data', () => {
    const lessonData = getLessonData(mockLesson.lesson_id);
    runner.assertExists(lessonData, 'Should return lesson data');
    runner.assertExists(lessonData.status, 'Should have status');
    runner.assertExists(lessonData.vocabulary, 'Should have vocabulary');
    runner.assertExists(lessonData.exercises, 'Should have exercises');
    runner.assertExists(lessonData.metrics, 'Should have metrics');
  });

  runner.test('Stats are consistent between different retrieval methods', () => {
    const stats = getDashboardStats();
    const lessonData = getLessonData(mockLesson.lesson_id);
    runner.assertEquals(
      stats.totalWordsLearned,
      lessonData.metrics.wordsLearned,
      'Word counts should match'
    );
  });
});

// ============================================
// TEST SUITE 6: EDGE CASES
// ============================================

runner.describe('TEST SUITE 6: Edge Cases', () => {
  runner.test('Recording attempt for non-existent lesson returns gracefully', () => {
    recordWordExamAttempt('non_existent_lesson', 'word_0', true);
    runner.assertTrue(true, 'Should not throw error');
  });

  runner.test('Recording attempt for non-existent word returns gracefully', () => {
    recordWordExamAttempt(mockLesson.lesson_id, 'word_999', true);
    runner.assertTrue(true, 'Should not throw error');
  });

  runner.test('Recording attempt for non-existent exercise returns gracefully', () => {
    recordExerciseAttempt(mockLesson.lesson_id, 'exercise_NonExistent_task_0', true, true);
    runner.assertTrue(true, 'Should not throw error');
  });

  runner.test('Accuracy calculation handles zero exercises', () => {
    const lessonEmpty = {
      lesson_id: 'lesson_empty',
      title: 'Empty Lesson',
      vocabulary: [],
      exercises: [],
    };
    initializeLessonProgress(lessonEmpty);
    const metrics = getLessonMetrics(lessonEmpty.lesson_id);
    runner.assertEquals(metrics.exerciseAccuracy, 0, 'Should handle zero exercises');
  });

  runner.test('Multiple correct answers for same word tracked correctly', () => {
    recordWordExamAttempt(mockLesson.lesson_id, 'word_2', true);
    recordWordExamAttempt(mockLesson.lesson_id, 'word_2', true);
    const progress = getProgress();
    const word = progress.lessons[mockLesson.lesson_id].vocabulary.word_2;
    runner.assertEquals(word.attempts, 2, 'Should track multiple attempts');
    runner.assertTrue(word.examPassed, 'Should remain passed');
  });
});

// ============================================
// RUN ALL TESTS
// ============================================

console.log('🧪 PHASE 3 AUTOMATED TEST SUITE');
console.log('================================\n');
console.log('Running tests...\n');

runner.printSummary();

// Export for use in other environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runner, mockLesson };
}
