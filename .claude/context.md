# 🧠 Контекст проекта DeutschMeister

> Полное описание проекта для Claude: архитектура, компоненты, данные, стек

---

## 📌 Обзор проекта

### Что это?
**DeutschMeister** — веб-приложение для интерактивного изучения немецкого языка. Пользователь может изучать лексику, выполнять упражнения и получать обратную связь от AI-репетитора на основе Google Gemini API.

### Для кого?
Для конечных пользователей, которые хотят учить немецкий язык через практику и взаимодействие с AI.

### Основные возможности
1. **Изучение лексики** — Карточки со словами, интервальное повторение (Spaced Repetition)
2. **Практические упражнения** — Выполнение заданий с проверкой ответов
3. **AI-репетитор** — Проверка ответов, объяснение ошибок, мотивация
4. **Режим экзамена** — Самопроверка без помощи репетитора
5. **Статистика** — Отслеживание прогресса и статистики по урокам
6. **Управление уроками** — Добавление, удаление, импорт/экспорт уроков

---

## 🏗️ Архитектура приложения

### Архитектурный паттерн
**Single Page Application (SPA)** на React с компонентным подходом.

```
┌─────────────────────────────────────────────────┐
│                   App.tsx                       │
│  Главный компонент - управление состоянием     │
└────────┬────────────────────────────────────────┘
         │
         ├─► 📋 Компоненты (Components/)
         │   ├── VocabularyCard      → Изучение слов
         │   ├── TutorChat           → Чат с AI
         │   ├── ExamMode            → Режим экзамена
         │   ├── StatisticsDashboard → Статистика урока
         │   ├── GlobalDashboard     → Общая статистика
         │   ├── LessonCard          → Карточка урока
         │   └── TokenIndicator      → Индикатор API
         │
         ├─► 🔧 Сервисы (Services/)
         │   ├── geminiService           → API Google Gemini
         │   ├── validationService       → Локальная проверка
         │   ├── spacedRepetition        → Алгоритм повторения
         │   ├── difficultyTracker       → Трекинг сложных слов
         │   ├── tokenTracker            → Учёт API-запросов
         │   └── vocabularyStatistics    → Статистика слов
         │
         └─► 💾 LocalStorage
             ├── Уроки (lessons)
             ├── Прогресс (progress)
             ├── Статистика (statistics)
             ├── Spaced Repetition data
             └── Счётчик API-запросов
```

### Поток данных

```
1️⃣ ЗАГРУЗКА
   App.tsx → localStorage → State (lessons, progress) → Компоненты

2️⃣ ПОЛЬЗОВАТЕЛЬСКОЕ ДЕЙСТВИЕ
   Пользователь → Компонент → Service → State Update → localStorage

3️⃣ ПРОВЕРКА ОТВЕТА
   TutorChat → validationService (локально) → geminiService (API) → Response → UI
```

### Жизненный цикл урока

```
1. Пользователь выбирает урок
   └─ Загружается прогресс из localStorage

2. Изучение лексики (Phase 1: Learning)
   └─ Карточки со словами + Spaced Repetition

3. Тестирование лексики (Phase 2: Testing)
   └─ Проверка: DE→RU, RU→DE

4. Практические упражнения (Phase 3: Practice)
   └─ Выполнение заданий с проверкой AI-репетитора

5. Статистика урока (Phase 4: Statistics)
   └─ Просмотр результатов и прогресса

6. Сохранение в localStorage
   └─ Автоматическое сохранение прогресса
```

---

## 🧩 Ключевые компоненты

### App.tsx (Главный компонент)

**Функции:**
- Загрузка уроков из localStorage
- Управление выбранным уроком
- Управление прогрессом урока
- Переключение между view modes (dashboard, lesson, vocabulary, practice)
- Сохранение данных в localStorage

**Состояние (State):**
```typescript
lessons: Lesson[]                      // Все уроки
selectedLesson: Lesson | null          // Выбранный урок
progress: LessonProgress | null        // Прогресс текущего урока
currentView: ViewMode                  // Текущий экран
saveStatus: 'idle' | 'saving' | 'saved' // Статус сохранения
```

**Основные методы:**
- `selectLesson(lesson)` — выбор урока
- `handleNextTask()` — переход к следующему заданию
- `handlePrevTask()` — возврат к предыдущему
- `onFeedback(isCorrect, userAnswer)` — обработка проверки AI
- `deleteLesson(lessonId)` — удаление урока
- `handleAddLesson()` — добавление урока
- `exportLessons() / importLessons()` — экспорт/импорт

---

### VocabularyCard.tsx (Изучение слов)

**Назначение:** Фаза изучения лексики с интервальным повторением.

**Фазы:**
```
Learning    → Просмотр слова + перевода + примера
             ↓
Testing     → Проверка: DE→RU, затем RU→DE
             ↓
Skipped     → Пропуск слова (отмечается как сложное)
```

**Интеграции:**
- `spacedRepetition` — алгоритм повторения
- `difficultyTracker` — отметка сложных слов
- `vocabularyStatistics` — запись статистики

---

### TutorChat.tsx (AI-репетитор)

**Назначение:** Чат с AI для проверки ответов на упражнения.

**Алгоритм:**
```
1. Пользователь вводит ответ
   ↓
2. validationService пытается проверить локально
   ├─ Если успешно → Отправляем результат (БЕЗ API ✅)
   └─ Если не удалось → Переходим в шаг 3
   ↓
3. Отправляем запрос к Gemini API
   ├─ trackAPIRequest() — учитываем запрос
   ├─ Контекст: урок, задание, правильный ответ
   ├─ История: последние 3 сообщения
   └─ Получаем ответ от AI
   ↓
4. Обработка ответа
   └─ onFeedback(isCorrect, userAnswer)
   └─ Сохранение результата в progress
```

**Оптимизация:** История сообщений ограничена 3 последними (экономия токенов).

---

### ExamMode.tsx (Режим экзамена)

**Назначение:** Проверка знаний без помощи AI-репетитора.

**Отличие от TutorChat:**
- Нет AI-помощи
- Локальная проверка против правильных ответов
- Результат сразу видно
- Пригодится для быстрой самопроверки

---

### StatisticsDashboard.tsx (Статистика урока)

**Показывает:**
- Количество правильных/неправильных ответов
- Прогресс по словарю
- Сложные слова
- Историю ответов

---

### GlobalDashboard.tsx (Общая статистика)

**Показывает:**
- Статистику по всем урокам
- Общий прогресс
- Использованные API-запросы

---

### TokenIndicator.tsx (Индикатор API)

**Показывает:**
- Количество использованных API-запросов
- Лимит запросов на день (60 запросов в минуту, 1500 в день)
- Предупреждение, если лимит исчерпан

---

## 🛠️ Ключевые сервисы

### geminiService.ts (Google Gemini API)

**Функция:**
```typescript
getTutorResponse(
  lesson: Lesson,
  exerciseIndex: number,
  taskIndex: number,
  userAnswer: string,
  history: Message[]
): Promise<string>
```

**Параметры запроса:**
- Model: `gemini-2.0-flash`
- Temperature: 0.7 (творческость)
- systemInstruction: `SYSTEM_PROMPT` из `constants.ts`
- history: Последние 3 сообщения
- Контекст: информация об уроке и правильном ответе

**Обработка ошибок:**
- 429: Rate limit (слишком много запросов)
- RESOURCE_EXHAUSTED: Квота исчерпана
- Другие ошибки API

---

### validationService.ts (Локальная валидация)

**Назначение:** Проверка ответов БЕЗ использования API (экономия).

**Функция:**
```typescript
validateAnswer(
  userAnswer: string,
  correctAnswers: string[]
): ValidationResult | null
```

**Логика:**
1. Нормализация (toLowerCase, trim, удаление пунктуации)
2. Точное совпадение → ✅ Верно!
3. Совпадение без артиклей → ✅ Верно!
4. Не совпадает → `null` (нужен AI)

**Примеры:**
```
validateAnswer("Das Haus", ["das Haus"])     → ✅ Верно
validateAnswer("Haus", ["das Haus"])         → ✅ Верно (без артикля)
validateAnswer("Die Katze", ["das Haus"])    → null (нужен AI)
```

---

### spacedRepetition.ts (Интервальное повторение)

**Алгоритм:** SM-2 (SuperMemo 2)

**Данные:**
```typescript
interface SpacedRepetitionData {
  word: string
  lastReview: string           // ISO дата последнего повторения
  nextReview: string           // ISO дата следующего повторения
  interval: number             // Дней до следующего повторения
  easeFactor: number           // Коэффициент лёгкости (1.3-2.5)
  reviewCount: number          // Количество повторений
}
```

**Логика:**
- **Успешный ответ:** interval *= easeFactor (максимум 30 дней)
- **Неудачный ответ:** interval = 1, easeFactor -= 0.2
- **Сортировка:** слова сортируются по `nextReview` (срочные первыми)

---

### tokenTracker.ts (Учёт API-запросов)

**Функции:**
```typescript
trackAPIRequest()        // Запрос через API → +1
trackLocalValidation()   // Локальная валидация → +0
getAPIRequestsToday()    // Количество запросов за день
resetCounterIfNewDay()   // Сброс в 00:00
```

**Хранение:** `localStorage['api_requests_count']`

**Лимиты (Gemini бесплатный тариф):**
- 60 запросов в минуту
- 1500 запросов в день

---

### difficultyTracker.ts (Трекинг сложных слов)

**Назначение:** Отметить слова, которые пользователь находит сложными.

**Функции:**
```typescript
markAsDifficult(word, lessonId)
removeDifficulty(word, lessonId)
getDifficultWords(lessonId)
isDifficult(word, lessonId)
```

---

### vocabularyStatistics.ts (Статистика по словам)

**Отслеживает:**
- Время первого просмотра
- Количество просмотров
- Количество правильных ответов
- Количество неправильных ответов
- Процент успеха

---

## 📐 Типы данных (TypeScript)

### Основные интерфейсы

```typescript
// Слово из словаря
interface Vocabulary {
  word: string              // "das Haus"
  translation: string       // "дом"
  type: WordType            // "noun" | "verb" | "adjective" | ...
  example?: string          // Пример использования (опционально)
}

// Упражнение
interface Exercise {
  title: string             // "Упражнение 1: Переводы"
  tasks: string[]           // ["Переведите: Ich gehe..."]
}

// Правильные ответы
interface Answer {
  exercise: number          // Номер упражнения (1-indexed)
  solutions: string[]       // ["Ich gehe nach Hause"]
}

// Урок
interface Lesson {
  lesson_id: string
  title: string
  vocabulary: Vocabulary[]
  exercises: Exercise[]
  answers: Answer[]
}

// Прогресс по уроку
interface LessonProgress {
  vocabSkipped: boolean
  vocabCompleted: boolean
  currentExerciseIdx: number
  currentTaskIdx: number
  statistics: LessonStatistics
  completed: boolean
  lastActivityAt: string     // ISO дата
}

// Статистика урока
interface LessonStatistics {
  correct: number
  incorrect: number
  skipped: number
  answers: Record<string, {
    userAnswer: string
    correct: boolean
  }>
}

// Типы слов
type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction'

// Режимы просмотра
type ViewMode = 'dashboard' | 'lesson-overview' | 'vocabulary' | 'practice' | 'exam' | 'statistics'
```

---

## 💾 LocalStorage ключи

```typescript
'german_lessons_v1'                    // Все уроки (Lesson[])
'lesson_{lessonId}_progress'           // Прогресс урока (LessonProgress)
'vocabulary_stats_{lessonId}'          // Статистика слов (VocabStats[])
'spaced_repetition_{lessonId}'         // SM-2 данные (SpacedRepetitionData[])
'difficult_words_{lessonId}'           // Сложные слова (string[])
'api_requests_count'                   // Счётчик запросов ({count, date})
```

**Лимит:** ~5-10MB на домен

---

## 🛠️ Технологический стек

### Frontend
- **React** 19.2.3 — UI framework
- **TypeScript** 5.8.2 — Типизация
- **Vite** 6.2.0 — Bundler и dev server
- **Tailwind CSS** 4.1.18 — Стилизация
- **Font Awesome** 6.x — Иконки

### AI и API
- **Google Gemini API** v2.0-flash
- **@google/genai** 1.34.0 — Клиент для Gemini

### Storage
- **Browser LocalStorage** — Локальное хранилище

### Build & Deploy
- **package.json** — Управление зависимостями
- **vite.config.ts** — Конфигурация Vite
- **tsconfig.json** — Конфигурация TypeScript
- **tailwind.config.js** — Конфигурация Tailwind

---

## 📁 Структура файлов

```
Deutsch-Youtube-AI-Tutor/
├── .claude/                           # ← ВЫ ЗДЕСЬ (новая папка)
│   ├── README.md
│   ├── context.md (этот файл)
│   ├── instructions.md
│   ├── claude.config.json
│   ├── skills/
│   ├── system-prompts/
│   ├── services-config/
│   ├── patterns/
│   ├── commands/
│   ├── types/
│   ├── hooks/
│   └── faq.md
│
├── 🔴 App.tsx                         # Главный компонент
├── 🔴 constants.ts                    # SYSTEM_PROMPT, начальные данные
├── 🔴 types.ts                        # TypeScript интерфейсы
├── 🔴 index.tsx                       # Точка входа (ReactDOM)
├── 🔴 .env                            # API ключ Google Gemini
│
├── components/                        # React компоненты
│   ├── 🟡 TutorChat.tsx
│   ├── 🟡 VocabularyCard.tsx
│   ├── 🟡 ExamMode.tsx
│   ├── 🟡 StatisticsDashboard.tsx
│   ├── 🟡 GlobalDashboard.tsx
│   ├── 🟡 LessonCard.tsx
│   └── 🟡 TokenIndicator.tsx
│
├── services/                          # Бизнес-логика
│   ├── 🟢 geminiService.ts
│   ├── 🟢 validationService.ts
│   ├── 🟢 spacedRepetition.ts
│   ├── 🟢 difficultyTracker.ts
│   ├── 🟢 tokenTracker.ts
│   └── 🟢 vocabularyStatistics.ts
│
├── 🔵 lessons.json                    # Данные уроков
├── 🔵 vite.config.ts
├── 🔵 tailwind.config.js
├── 🔵 tsconfig.json
└── 🔵 package.json
```

**Легенда:**
- 🔴 Критически важные (изменения требуют тестирования)
- 🟡 Важные компоненты (влияют на UX)
- 🟢 Сервисы (бизнес-логика)
- 🔵 Конфигурация (редко меняются)

---

## 🎯 SYSTEM_PROMPT (Основной промпт для AI)

AI-репетитор использует детальный `SYSTEM_PROMPT` из `constants.ts`. Основные правила:

### При правильном ответе:
- ✅ Максимально краткий ответ (1-5 слов)
- ✅ Одна фраза похвалы: "Верно!", "Правильно!", "Отлично!"
- ❌ Не писать длинные объяснения

### При ошибке:
- Объяснить ошибку в 1-2 предложениях
- Дать подсказку (не полный ответ)
- Попросить пересделать

### Стиль общения:
- Использовать эмодзи (✅ ❌ 💡 📚)
- Простой понятный язык
- Ободрение и позитив
- Ссылки на vocabulary урока

---

## 🔄 Жизненный цикл запроса к API

```
1. Пользователь отправляет ответ
   ↓
2. validationService пытается проверить локально
   ├─ УСПЕХ → Возвращаем результат (NO API) ✅
   └─ НЕ УДАЛОСЬ → Переходим в шаг 3
   ↓
3. trackAPIRequest() → учитываем запрос
   ↓
4. geminiService.getTutorResponse()
   ├─ Отправляем: lesson, exercise, userAnswer, history
   ├─ Получаем: строка с ответом и оценкой
   └─ Обработка ошибок (429, RESOURCE_EXHAUSTED и т.д.)
   ↓
5. Парсим ответ → получаем isCorrect
   ↓
6. onFeedback(isCorrect, userAnswer)
   ├─ Сохраняем в progress.statistics
   ├─ Обновляем vocabularyStatistics
   └─ Сохраняем в localStorage
```

---

## 🚀 Для нового разработчика

### День 1:
1. Прочитайте этот файл (context.md)
2. Посмотрите `App.tsx` и `constants.ts`
3. Изучите один компонент (например, `VocabularyCard.tsx`)

### День 2:
1. Посмотрите сервисы (`validationService.ts`, `geminiService.ts`)
2. Поймите, как работает localStorage
3. Запустите проект локально (`npm run dev`)

### День 3:
1. Посмотрите паттерны в `.claude/patterns/`
2. Попробуйте добавить маленькую фичу
3. Проверьте, что всё работает и сохраняется в localStorage

---

## 📚 Что читать дальше

- **instructions.md** — Критические инструкции для Claude
- **system-prompts/main-tutor-prompt.md** — Детальный SYSTEM_PROMPT для AI
- **patterns/component-patterns.md** — Как писать React компоненты
- **services-config/gemini-api-config.md** — Конфигурация Gemini API

---

**Последнее обновление:** 25 января 2026
