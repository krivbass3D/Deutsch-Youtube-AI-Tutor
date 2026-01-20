# Progress Service - Система отслеживания прогресса

## Обзор

`progressService.ts` — это новый сервис для управления прогрессом пользователей в localStorage. Он хранит информацию о:
- Выученных словах (по экзаменам лексики)
- Выполненных упражнениях (предложениях)
- Статусах уроков (не начинали, в процессе, завершено)
- Недельной статистике

## Структура данных

### UserProgress (главный объект в localStorage)

```typescript
{
  stats: {
    totalWordsLearned: 21,           // Всего выучено слов
    wordsLearnedThisWeek: 15,        // Выучено слов на этой неделе
    totalExerciseAttempts: 45,       // Всего попыток в упражнениях
    exerciseAttemptsCorrect: 32,     // Правильных ответов с первого раза
    lessonsInProgress: 2,            // Уроков в процессе
    lessonsCompleted: 1,             // Завершено уроков
  },
  lessons: {
    "10": {
      status: "in_progress",         // not_started | in_progress | completed
      startedAt: 1705600000000,      // Timestamp начала урока
      vocabulary: {
        "word_0": {
          word: "die Immobilien",
          translation: "недвижимость",
          attempts: 2,
          correctAttempts: 1,
          examPassed: true,           // true, если правильно на экзамене
          examPassedAt: 1705610000000,
          lastAttemptAt: 1705610000000
        },
        // ... остальные слова
      },
      exercises: {
        "exercise_Satz1_task_0": {
          sentence: "Die Immobilien sind...",
          translation: "Недвижимость...",
          attempts: 1,
          correctAttempts: 1,
          firstAttemptCorrect: true,   // true = выучено, исчезает из упражнений
          correctAt: 1705605000000,
          isLearned: true,
          lastAttemptAt: 1705605000000
        },
        // ... остальные предложения
      },
      metrics: {
        totalWords: 9,
        wordsLearned: 5,
        totalExercises: 8,
        exercisesLearned: 3,
        exerciseAccuracy: 37.5        // %
      },
      completedAt: null               // Null до завершения урока
    },
    // ... остальные уроки
  },
  weeklyStats: {
    "2024-01-15": {                   // Дата понедельника недели
      wordsLearned: 10,
      exerciseAttempts: 25,
      correctAttempts: 18
    }
  },
  lastUpdated: 1705610000000
}
```

## API

### Инициализация и получение

```typescript
// Получить весь прогресс
const progress = getProgress();

// Инициализировать урок (вызвать когда пользователь открывает урок в первый раз)
initializeLessonProgress(lesson);

// Получить статус урока
const status = getLessonStatus('10'); // 'not_started' | 'in_progress' | 'completed'

// Получить метрики урока
const metrics = getLessonMetrics('10'); // { totalWords, wordsLearned, ... }

// Получить статистику для Dashboard
const stats = getDashboardStats();
// { totalWordsLearned, wordsLearnedThisWeek, lessonsInProgress, ... }
```

### Запись результатов

```typescript
// Зафиксировать попытку слова на экзамене лексики
recordWordExamAttempt('10', 'word_0', true); // lessonId, wordId, passed

// Зафиксировать попытку в упражнении
recordExerciseAttempt('10', 'exercise_Satz1_task_0', true, true);
// lessonId, exerciseId, isFirstAttempt, isCorrect

// Если firstAttempt=true и isCorrect=true:
// - Предложение помечается как isLearned = true
// - exerciseAttemptsCorrect увеличивается
// - Предложение больше не предлагается в упражнениях
```

### Утилиты

```typescript
// Получить лучшие и худшие уроки
const { best, worst } = getTopAndBottomLessons(3);

// Очистить весь прогресс (для отладки)
clearAllProgress();
```

## Логика работы

### Статус урока

Автоматически обновляется в `updateLessonStatus()`:

1. **not_started** → урок не открывали или не начинали
2. **in_progress** → есть попытки в словах или упражнениях, но не всё выучено
3. **completed** → все слова правильно названы на экзамене И все предложения выполнены с первого раза

### Dashboard статистика

Автоматически пересчитывается в `updateDashboardStats()`:

- `totalWordsLearned` = сумма всех `examPassed: true` слов
- `wordsLearnedThisWeek` = слова, выученные с `examPassedAt >= неделю назад`
- `lessonsInProgress` = количество уроков со статусом 'in_progress'
- `lessonsCompleted` = количество уроков со статусом 'completed'

### Упражнения (Spaced Repetition)

Ключевой момент: **предложения, выполненные правильно с первого раза, исчезают из упражнений**.

```typescript
recordExerciseAttempt(lessonId, exerciseId, isFirstAttempt=true, isCorrect=true)
// ↓
// exercise.firstAttemptCorrect = true
// exercise.isLearned = true
// Предложение больше не предлагается пользователю
```

## Использование в компонентах

### Dashboard компонент

```typescript
import { getDashboardStats } from '../services/progressService';

export function Dashboard() {
  const stats = getDashboardStats();
  
  return (
    <div>
      <p>Всего слов выучено: {stats.totalWordsLearned}</p>
      <p>На этой неделе: {stats.wordsLearnedThisWeek}</p>
      <p>Уроков в процессе: {stats.lessonsInProgress}</p>
      <p>Уроков завершено: {stats.lessonsCompleted}</p>
    </div>
  );
}
```

### Экзамен лексики

```typescript
import { recordWordExamAttempt } from '../services/progressService';

function handleWordAnswer(lessonId: string, wordId: string, isCorrect: boolean) {
  recordWordExamAttempt(lessonId, wordId, isCorrect);
  // Stats автоматически обновятся
}
```

### Упражнения

```typescript
import { recordExerciseAttempt, initializeLessonProgress } from '../services/progressService';

// При открытии урока
useEffect(() => {
  initializeLessonProgress(lesson);
}, [lesson.lesson_id]);

// При ответе на упражнение
function handleExerciseSubmit(exerciseId: string, userAnswer: string) {
  const isCorrect = validateAnswer(userAnswer);
  recordExerciseAttempt(lesson.lesson_id, exerciseId, true, isCorrect);
  
  if (isCorrect) {
    // Предложение выучено, больше не показываем
    // exerciseService должен удалить его из списка упражнений
  }
}
```

## Миграция старого прогресса

Если в приложении уже есть старая система отслеживания прогресса (через `LessonProgress`), нужна миграция:

```typescript
// progressService.ts
export function migrateFromLegacy(lessonsProgress: Record<string, LessonProgress>, lessons: Lesson[]): void {
  const newProgress = initializeProgress();
  
  lessons.forEach(lesson => {
    const oldProgress = lessonsProgress[`lesson_${lesson.lesson_id}_progress`];
    if (oldProgress?.completed) {
      // Отметить все слова как выученные
      // Отметить все упражнения как выученные
    }
  });
  
  saveProgress(newProgress);
}
```

## Отладка

```typescript
// Получить весь прогресс для инспекции
const progress = getProgress();
console.log(JSON.stringify(progress, null, 2));

// Очистить прогресс (для тестирования)
clearAllProgress();
```

## Будущие улучшения

- [ ] Добавить `completionStreak` (дни подряд занятий)
- [ ] Экспорт/импорт прогресса (JSON)
- [ ] Синхронизация с сервером (Supabase)
- [ ] История изменений прогресса
- [ ] Архивирование старых недель
