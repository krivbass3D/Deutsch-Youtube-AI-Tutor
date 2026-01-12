# 🔄 Реализация Spaced Repetition алгоритма

## Описание

Реализован полноценный алгоритм Spaced Repetition (интервальное повторение) для эффективного запоминания немецких слов. Система автоматически управляет расписанием повторений на основе успешности обучения.

## Ключевые параметры

### Расписание повторений
```
День 1:  Первое повторение на следующий день
День 3:  Второе повторение через 3 дня (1+3=4 дня от начала)
День 7:  Третье повторение через 7 дней
День 14: Четвёртое повторение через 2 недели
День 30: Пятое повторение через месяц → СЛОВО ВЫУЧЕНО ✅
```

### Статус "Выученное слово"
- ✅ После **5 успешных повторений подряд**
- 📊 Отслеживается в статистике SR

### Обработка ошибок
- ❌ При ошибке: счётчик успешных повторов **сбрасывается на 0**
- ⏱️ Новый интервал: **1 день** (начинаем заново)
- 📉 Множитель сложности (easeFactor): уменьшается на 0.2

### Сложные слова (⭐)
- 🎯 Повышенная частота: интервал × **0.6**
- Пример: вместо 7 дней → 4.2 дня ≈ 4 дня
- Позволяет быстрее выучить сложные слова

## Реализованные файлы

### 1. `services/spacedRepetition.ts` (новый)
Основной сервис с функциями:

#### `getSpacedRepetitionData(lessonId, word, translation, type)`
Получает SR данные для слова (или создаёт новые)
```typescript
interface SpacedRepetitionData {
  word: string;
  translation: string;
  type: string;
  lastReviewDate: string | null;        // Дата последнего повтора
  nextReviewDate: string | null;        // Дата следующего повтора
  interval: number;                     // дни до следующего повтора
  easeFactor: number;                   // множитель сложности
  reviewCount: number;                  // успешные повторения
  failureCount: number;                 // ошибки
  isLearned: boolean;                   // true если >= 5 успехов
  isDue: boolean;                       // пора ли повторять
}
```

#### `recordSuccessfulReview(lessonId, word, ...)`
Записывает успешный повтор:
- Увеличивает `reviewCount`
- Вычисляет новый интервал по расписанию
- Для сложных слов: интервал × 0.6
- Проверяет: `reviewCount >= 5` → `isLearned = true`

#### `recordFailedReview(lessonId, word, ...)`
Обрабатывает ошибку:
- Сбрасывает `reviewCount = 0`
- Устанавливает `interval = 1` (день)
- Уменьшает `easeFactor`

#### `isWordDue(lessonId, word)`
Проверяет, пора ли повторять слово
- Сравнивает `nextReviewDate` с сегодня
- `true` если дата прошла

#### `sortBySpacedRepetition(vocabulary, lessonId)`
Сортирует слова по приоритету:
1. **Слова к повторению** (isDue = true)
2. **Сложные слова** (⭐ повышенный приоритет)
3. **Невыученные** (reviewCount < 5)
4. **Остальные**

#### `getSpacedRepetitionStats(vocabulary, lessonId)`
Возвращает статистику:
```typescript
{
  totalWords: number;        // всего в уроке
  dueWords: number;          // пора повторять
  learnedWords: number;      // выученные (5+ повторов)
  difficultWords: number;    // отмечены как сложные
  readyPercent: number;      // % выученных
  needRepeatPercent: number; // % к повторению
}
```

### 2. `components/VocabularyCard.tsx` (обновлен)

**Новые импорты:**
```typescript
import { recordSuccessfulReview, recordFailedReview } from '../services/spacedRepetition';
```

**Интеграция в `handleTestAnswer()`:**
```typescript
if (isCorrect) {
  recordSuccessfulReview(lessonId, current.word, current.translation, current.type);
} else {
  recordFailedReview(lessonId, current.word, current.translation, current.type);
}
```

Теперь каждый ответ в режиме тестирования автоматически обновляет SR данные!

### 3. `components/ExamMode.tsx` (обновлен)
- Заменён импорт: `sortByDifficulty` → `sortBySpacedRepetition`
- Слова в экзамене сортируются по SR приоритету

### 4. `App.tsx` (обновлен)
- Заменён импорт на `sortBySpacedRepetition`
- Слова в обучении сортируются по SR приоритету

### 5. `components/SpacedRepetitionStats.tsx` (новый)
Визуальный компонент для отображения:
- 📊 Статистика SR (выученные, к повторению, сложные)
- 📋 Объяснение алгоритма
- 💡 Советы по использованию

### 6. `components/StatisticsDashboard.tsx` (обновлен)
- Добавлен компонент `SpacedRepetitionStats`
- Отображается в табе "Статистика"
- Новый параметр: `vocabulary: Vocabulary[]`

## Сценарий использования

### Сценарий 1: Новое слово
```
День 1: Пользователь видит слово в режиме обучения → записывается в SR
День 1: Вводит слово в тестирование → УСПЕХ → interval = 1 день
День 2: Слово появляется в начале списка (isDue = true)
День 2: Повторяет → УСПЕХ → interval = 3 дня
День 5: Появляется снова → УСПЕХ → interval = 7 дней
...
День 30: После 5 успехов → isLearned = true ✅
```

### Сценарий 2: Ошибка
```
День 5: Пользователь ошибся при повторении
        reviewCount: 3 → 0 (сброс)
        interval: 7 дней → 1 день
День 6: Слово появляется снова (urgently)
        Начинает цикл заново
```

### Сценарий 3: Сложное слово (⭐)
```
День 1: Обучение → reviewCount = 0, interval = 0
День 2: Успех → interval = 1 * 0.6 ≈ 1 день
День 3: Успех → interval = 3 * 0.6 ≈ 2 дня
День 5: Успех → interval = 7 * 0.6 ≈ 4 дня
День 9: Успех → interval = 14 * 0.6 ≈ 8 дней
День 17: Успех → isLearned = true ✅
```
**Результат:** Выучивается быстрее (17 дней вместо 30)

## Данные в localStorage

Каждое слово в каждом уроке имеет запись:
```
Ключ: spaced_repetition_v1_{lessonId}_{word}
Значение: SpacedRepetitionData (JSON)
```

Пример:
```json
{
  "word": "heißen",
  "translation": "называться",
  "type": "verb",
  "lastReviewDate": "2025-01-12T10:30:00.000Z",
  "nextReviewDate": "2025-01-15T00:00:00.000Z",
  "interval": 3,
  "easeFactor": 2.5,
  "reviewCount": 2,
  "failureCount": 0,
  "isLearned": false,
  "isDue": false
}
```

## Приоритет сортировки

Когда пользователь кликает "Начать обучение", слова отсортированы так:

```
ПРИОРИТЕТ ВЫСОКИЙ:
└─ Слова, которые пора повторять (isDue = true)
   └─ Сложные слова (⭐) → впереди
   └─ Остальные слова к повторению

ПРИОРИТЕТ СРЕДНИЙ:
└─ Невыученные слова (reviewCount < 5)
   └─ С меньшим количеством успехов впереди

ПРИОРИТЕТ НИЗКИЙ:
└─ Выученные слова (reviewCount >= 5)
```

## Статистика в Dashboard

На вкладке "Статистика" показывается:

- **🔄 Выученные слова**: count (% готово)
- **⏰ Слова к повторению**: count (% требует внимания)
- **⭐ Отмечены сложные**: count
- **📚 Всего слов**: в уроке

## Примечания

1. **Нет интернета?** SR работает полностью локально в `localStorage`
2. **Дневной цикл**: Проверка `isDue` считает дни по полночи
3. **Множитель сложности**: Начинается с 2.5, минимум 1.3
4. **Интегрирование**: Автоматически работает при правильных/неправильных ответах в тестировании

## Тестирование

Для сброса SR прогресса урока:
```typescript
import { resetSpacedRepetition } from './services/spacedRepetition';

// Сброс SR данных урока #1
resetSpacedRepetition('1');
```

Эта функция удалит все SR данные для урока, не трогая статистику обучения.
