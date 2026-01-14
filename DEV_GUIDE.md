# 🚀 Руководство разработчика DeutschMeister

> Полное техническое описание проекта для разработчиков

**Последнее обновление:** 13 января 2025

---

## 📋 Содержание

1. [Обзор проекта](#обзор-проекта)
2. [Архитектура](#архитектура)
3. [Структура файлов](#структура-файлов)
4. [Ключевые компоненты](#ключевые-компоненты)
5. [Сервисы](#сервисы)
6. [Типы данных](#типы-данных)
7. [Паттерны кодирования](#паттерны-кодирования)
8. [Команды разработки](#команды-разработки)
9. [API и внешние зависимости](#api-и-внешние-зависимости)
10. [Оптимизация и производительность](#оптимизация-и-производительность)

---

## 🎯 Обзор проекта

### Цель
DeutschMeister - интерактивное приложение для изучения немецкого языка с AI-репетитором на базе Google Gemini API.

### Основные возможности
- **Изучение лексики** с интервальным повторением (Spaced Repetition)
- **Режим экзамена** для самопроверки
- **AI-репетитор** с проверкой ответов
- **Локальная валидация** для экономии API-запросов
- **Трекинг статистики** и прогресса
- **Управление уроками** (CRUD операции)
- **Экспорт/импорт** данных

### Технологический стек
```typescript
{
  "frontend": "React 19.2.3 + TypeScript 5.8.2",
  "bundler": "Vite 6.2.0",
  "styling": "Tailwind CSS 4.1.18",
  "ai": "Google Gemini API (@google/genai 1.34.0)",
  "storage": "Browser LocalStorage",
  "icons": "Font Awesome 6.x"
}
```

---

## 🏗️ Архитектура

### Архитектурный паттерн
**Single Page Application (SPA)** с компонентным подходом React.

```
┌─────────────────────────────────────────┐
│           App.tsx (Root)                │
│  • Управление состоянием (state)         │
│  • Маршрутизация (view modes)           │
│  • Persistence (localStorage)           │
└────────┬────────────────────────────────┘
         │
         ├─► Components/
         │   ├─► VocabularyCard    (Изучение слов)
         │   ├─► TutorChat         (AI-чат)
         │   ├─► ExamMode          (Экзамен)
         │   ├─► StatisticsDashboard (Статистика урока)
         │   ├─► GlobalDashboard   (Общая статистика)
         │   ├─► LessonCard        (Карточка урока)
         │   └─► TokenIndicator    (Лимит API)
         │
         ├─► Services/
         │   ├─► geminiService     (Gemini API)
         │   ├─► validationService (Локальная проверка)
         │   ├─► spacedRepetition  (Алгоритм повторения)
         │   ├─► difficultyTracker (Сложные слова)
         │   ├─► tokenTracker      (Учёт запросов)
         │   └─► vocabularyStatistics (Статистика слов)
         │
         └─► Data Layer (LocalStorage)
             ├─► Lessons
             ├─► Progress per Lesson
             ├─► Vocabulary Stats
             └─► API Request Count
```

### Поток данных

```typescript
// 1. Загрузка данных
App Component → LocalStorage → State (lessons, progress)

// 2. Взаимодействие пользователя
User Action → Component → Service → State Update → LocalStorage

// 3. AI-запрос
TutorChat → validationService (локально) → geminiService (API) → Response → UI
```

---

## 📁 Структура файлов

### Критически важные файлы

```
Deutsch-Youtube-AI-Tutor/
├── 🔴 App.tsx                     # Главный компонент, управление состоянием
├── 🔴 constants.ts                # SYSTEM_PROMPT для AI, начальные уроки
├── 🔴 types.ts                    # TypeScript интерфейсы
├── 🔴 index.tsx                   # Точка входа (ReactDOM.render)
├── 🔴 .env                        # API ключ Google Gemini
│
├── components/                    # React компоненты
│   ├── 🟡 TutorChat.tsx          # Чат с AI
│   ├── 🟡 VocabularyCard.tsx     # Карточки слов
│   ├── 🟡 ExamMode.tsx           # Режим экзамена
│   ├── 🟡 StatisticsDashboard.tsx # Статистика урока
│   ├── 🟡 GlobalDashboard.tsx    # Общая статистика
│   ├── 🟡 LessonCard.tsx         # Карточка урока
│   └── 🟡 TokenIndicator.tsx     # Индикатор API-запросов
│
├── services/                      # Бизнес-логика
│   ├── 🟢 geminiService.ts       # Gemini API
│   ├── 🟢 validationService.ts   # Локальная валидация
│   ├── 🟢 spacedRepetition.ts    # Интервальное повторение
│   ├── 🟢 difficultyTracker.ts   # Трекинг сложных слов
│   ├── 🟢 tokenTracker.ts        # Учёт API-запросов
│   └── 🟢 vocabularyStatistics.ts # Статистика слов
│
├── 🔵 lessons.json                # Данные уроков
├── 🔵 vite.config.ts              # Конфигурация Vite
├── 🔵 tailwind.config.js          # Конфигурация Tailwind
├── 🔵 tsconfig.json               # Конфигурация TypeScript
└── 🔵 package.json                # Зависимости
```

**Легенда:**
- 🔴 Критически важные (изменения требуют тщательного тестирования)
- 🟡 Важные компоненты (изменения влияют на UX)
- 🟢 Сервисы (логика приложения)
- 🔵 Конфигурация (изменения редки)

---

## 🧩 Ключевые компоненты

### App.tsx

**Назначение:** Главный компонент, управляющий всем состоянием приложения.

**Ключевые состояния:**
```typescript
- lessons: Lesson[]                    // Все уроки
- selectedLesson: Lesson | null        // Выбранный урок
- progress: LessonProgress | null      // Прогресс урока
- currentView: ViewMode                // Текущий экран
- saveStatus: 'idle' | 'saving' | ...  // Статус сохранения
```

**Основные функции:**
```typescript
selectLesson(lesson)      // Выбор урока + загрузка прогресса
handleNextTask()          // Переход к следующему заданию
handlePrevTask()          // Возврат к предыдущему заданию
onFeedback(isCorrect, userAnswer) // Обработка проверки AI
deleteLesson(e, lessonId) // Удаление урока
handleAddLesson()         // Добавление урока из JSON
exportLessons()           // Экспорт всех уроков
importLessons(e)          // Импорт уроков из файла
```

**Persistence:**
```typescript
// Уроки
localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons))

// Прогресс урока
localStorage.setItem(`lesson_${lessonId}_progress`, JSON.stringify(progress))
```

---

### TutorChat.tsx

**Назначение:** Чат с AI-репетитором для проверки ответов.

**Архитектура запроса:**
```typescript
handleSend() {
  // 1. Локальная валидация (validateAnswer)
  if (canValidateLocally) {
    return localResult // БЕЗ API-запроса ✅
  }
  
  // 2. API-запрос (если локально не удалось)
  trackAPIRequest() // Учёт запроса
  const response = await getTutorResponse(...)
  
  // 3. Обработка ответа
  onFeedback(isCorrect, userAnswer)
}
```

**Оптимизации:**
- История ограничена 3 последними сообщениями (экономия токенов)
- Локальная валидация для простых ответов
- Детектирование ошибок API (429, RESOURCE_EXHAUSTED)

---

### VocabularyCard.tsx

**Назначение:** Изучение и проверка словарного запаса.

**Фазы обучения:**
```typescript
type VocabularyPhase = 'learning' | 'testing'
type TestDirection = 'de-to-ru' | 'ru-to-de'
```

**Интеграции:**
- `spacedRepetition` - алгоритм интервального повторения
- `difficultyTracker` - отметка сложных слов
- `vocabularyStatistics` - запись времени изучения

**Логика Spaced Repetition:**
```typescript
if (isCorrect) {
  recordSuccessfulReview() // Увеличивает интервал повторения
} else {
  recordFailedReview()     // Сбрасывает прогресс слова
}
```

---

## 🛠️ Сервисы

### geminiService.ts

**Назначение:** Взаимодействие с Google Gemini API.

```typescript
getTutorResponse(
  lesson,
  currentExerciseIndex,
  currentTaskIndex,
  userAnswer,
  history
) -> string

// Использует:
// - model: "gemini-2.0-flash"
// - systemInstruction: SYSTEM_PROMPT
// - temperature: 0.7
// - history: последние 3 сообщения
```

**Ключевые моменты:**
- Отправляет контекст: урок, задание, правильный ответ
- Ограничивает историю для экономии токенов
- Обрабатывает ошибки API (429, quota exceeded)

---

### validationService.ts

**Назначение:** Локальная проверка ответов БЕЗ AI (экономия API-запросов).

```typescript
validateAnswer(userAnswer, correctAnswer) -> ValidationResult | null

ValidationResult = {
  isCorrect: boolean
  message: string
  shouldCallAPI: boolean  // true = нужен AI
}
```

**Логика валидации:**
1. Нормализация (lowercase, trim, удаление лишних знаков)
2. Точное совпадение → ✅ Верно!
3. Совпадение без артиклей → ✅ Верно!
4. Не совпадает → shouldCallAPI = true (передаём AI)

**Примеры:**
```typescript
validateAnswer("das Haus", "das Haus")     // ✅ Точно
validateAnswer("Haus", "das Haus")         // ✅ Без артикля
validateAnswer("Ich gehe", "Ich bin")      // null → AI
```

---

### spacedRepetition.ts

**Назначение:** Алгоритм интервального повторения (SM-2).

**Данные:**
```typescript
interface SpacedRepetitionData {
  word: string
  lastReview: string       // ISO дата
  nextReview: string       // ISO дата
  interval: number         // дни до следующего повторения
  easeFactor: number       // коэффициент лёгкости (1.3-2.5)
  reviewCount: number      // количество повторений
}
```

**Ключевые функции:**
```typescript
recordSuccessfulReview()  // Увеличивает interval
recordFailedReview()      // Сбрасывает interval = 1
sortBySpacedRepetition()  // Сортирует слова по nextReview
```

**Алгоритм:**
- Успех → interval *= easeFactor (макс. 30 дней)
- Ошибка → interval = 1 день, easeFactor -= 0.2

---

### tokenTracker.ts

**Назначение:** Учёт API-запросов к Gemini.

```typescript
trackAPIRequest()         // Запрос через API
trackLocalValidation()    // Локальная валидация (без API)
getAPIRequestsToday()     // Количество запросов
resetCounterIfNewDay()    // Сброс в 00:00
```

**Хранение:**
```localStorage: 'api_requests_count'```

**Использование:**
```typescript
<TokenIndicator />  // Показывает: 12 / 60 запросов
```

---

## 📐 Типы данных

### Основные интерфейсы

```typescript
// Слово из словаря
interface Vocabulary {
  word: string           // "das Haus"
  translation: string    // "дом"
  type: WordType         // "noun" | "verb" | "adjective" | ...
}

// Упражнение
interface Exercise {
  title: string          // "Упражнение 1"
  tasks: string[]        // ["Переведите: Я иду домой"]
}

// Правильные ответы
interface Answer {
  exercise: number       // Номер упражнения (1-indexed)
  solutions: string[]    // ["Ich gehe nach Hause"]
}

// Урок
interface Lesson {
  lesson_id: string
  title: string
  vocabulary: Vocabulary[]
  exercises: Exercise[]
  answers: Answer[]
}

// Прогресс урока
interface LessonProgress {
  vocabSkipped: boolean
  vocabCompleted: boolean
  currentExerciseIdx: number
  currentTaskIdx: number
  statistics: LessonStatistics
  completed: boolean
  lastActivityAt: string
}

// Статистика
interface LessonStatistics {
  correct: number
  incorrect: number
  skipped: number
  answers: Record<string, { 
    userAnswer: string
    correct: boolean 
  }>
}
```

---

## 🎨 Паттерны кодирования

### 1. Управление состоянием

```typescript
// ✅ Правильно: useState для локального состояния компонента
const [isFlipped, setIsFlipped] = useState(false)

// ✅ Правильно: useEffect для синхронизации с localStorage
useEffect(() => {
  localStorage.setItem('key', JSON.stringify(data))
}, [data])

// ✅ Правильно: useMemo для тяжёлых вычислений
const sortedWords = useMemo(
  () => sortBySpacedRepetition(vocabulary, lessonId),
  [vocabulary, lessonId]
)
```

### 2. Обработка ошибок

```typescript
// ✅ Правильно: try-catch с детальными сообщениями
try {
  const response = await getTutorResponse(...)
} catch (error: any) {
  const errorMessage = error?.message || JSON.stringify(error)
  
  if (errorMessage.includes('429')) {
    // Обработка Rate Limit
  } else if (errorMessage.includes('API_KEY')) {
    // Проблема с ключом
  }
  
  console.error('❌ Ошибка:', error)
}
```

### 3. Типизация

```typescript
// ✅ Правильно: Строгие типы для props
interface ComponentProps {
  lesson: Lesson
  onFinish: () => void
  lessonId: string
}

// ✅ Правильно: Union types для состояний
type ViewMode = 'dashboard' | 'lesson-overview' | 'vocabulary' | 'practice'

// ❌ Избегать: any
const data: any = ...  // ❌ НЕТ!
const data: Lesson = ... // ✅ ДА!
```

### 4. Именование

```typescript
// Функции обработчики: handle*
handleNextTask()
handleAddLesson()

// Функции получения данных: get*
getLessonProgress()
getAPIRequestsToday()

// Функции записи: record*
recordSuccessfulReview()
recordWordView()

// Функции проверки: validate* / is*
validateAnswer()
isWordDifficult()

// Состояния: is* / has* / current*
isLoading
hasProgress
currentView
```

### 5. Компоненты

```typescript
// ✅ Правильно: Функциональные компоненты с типизацией
const MyComponent: React.FC<MyProps> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState(...)
  
  // Effects
  useEffect(() => { ... }, [deps])
  
  // Handlers
  const handleClick = () => { ... }
  
  // Render
  return <div>...</div>
}

// ✅ Правильно: Экспорт по умолчанию
export default MyComponent
```

---

## 💻 Команды разработки

### Установка
```bash
npm install
```

### Разработка
```bash
npm run dev
# Запуск: http://localhost:5173
```

### Сборка
```bash
npm run build
# Результат: dist/
```

### Предпросмотр сборки
```bash
npm run preview
```

### Переменные окружения
```bash
# .env
API_KEY=your_gemini_api_key_here
```

---

## 🌐 API и внешние зависимости

### Google Gemini API

**Библиотека:** `@google/genai` v1.34.0

**Модель:** `gemini-2.0-flash`

**Лимиты (бесплатный тариф):**
- 60 запросов в минуту
- 1500 запросов в день

**Получение ключа:**
https://aistudio.google.com/

**Документация:**
https://ai.google.dev/

### LocalStorage

**Используемые ключи:**
```typescript
'german_lessons_v1'                  // Все уроки
'lesson_{lessonId}_progress'         // Прогресс урока
'vocabulary_stats_{lessonId}'        // Статистика слов
'spaced_repetition_{lessonId}'       // Данные повторений
'difficult_words_{lessonId}'         // Сложные слова
'api_requests_count'                 // Счётчик API-запросов
```

**Лимиты:** ~5-10MB на домен

---

## ⚡ Оптимизация и производительность

### 1. Экономия API-запросов

```typescript
// ✅ Локальная валидация для простых ответов
const validation = validateAnswer(userAnswer, correctAnswer)
if (validation && !validation.shouldCallAPI) {
  return validation.message  // БЕЗ API ✅
}

// ✅ Ограничение истории чата
const history = messages.slice(-3)  // Последние 3 сообщения

// ✅ Учёт запросов
trackAPIRequest()  // +1 к счётчику
```

### 2. Оптимизация рендеринга

```typescript
// ✅ useMemo для тяжёлых вычислений
const totalTasks = useMemo(() => {
  return exercises.reduce((acc, ex) => acc + ex.tasks.length, 0)
}, [exercises])

// ✅ useCallback для функций в props
const handleNext = useCallback(() => {
  // ...
}, [dependencies])
```

### 3. Ленивая загрузка

```typescript
// ✅ Прогресс загружается только при выборе урока
const selectLesson = (lesson) => {
  const progress = getLessonProgressFromStorage(lesson.lesson_id)
  setProgress(progress || initializeProgress())
}

// ❌ НЕ загружать все прогрессы сразу
```

### 4. Батчинг обновлений

```typescript
// ✅ Один setState вместо нескольких
setProgress({
  ...progress,
  currentTaskIdx: progress.currentTaskIdx + 1,
  statistics: updatedStatistics
})

// ❌ Избегать
setProgress({ ...progress, currentTaskIdx: ... })
setProgress({ ...progress, statistics: ... })
```

---

## 🔧 Расширение функционала

### Добавление нового сервиса

1. Создать файл `services/myService.ts`
2. Определить интерфейсы и типы
3. Реализовать логику с использованием localStorage
4. Интегрировать в компонент

```typescript
// services/myService.ts
export const myFunction = (data: MyType): MyResult => {
  // 1. Получить данные из localStorage
  const stored = localStorage.getItem('my_key')
  
  // 2. Обработать
  const result = processData(data, stored)
  
  // 3. Сохранить
  localStorage.setItem('my_key', JSON.stringify(result))
  
  return result
}
```

### Добавление нового компонента

```typescript
// components/MyComponent.tsx
import React from 'react'

interface MyComponentProps {
  // props
}

const MyComponent: React.FC<MyComponentProps> = ({ ... }) => {
  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}

export default MyComponent
```

---

## 🐛 Отладка

### Включить логи

Все критические операции логируются в console:

```typescript
console.log('🔄 Загрузка уроков...')
console.log('✅ Урок добавлен')
console.error('❌ Ошибка:', error)
```

**Открыть DevTools:** `F12` → Console

### Проверка localStorage

```javascript
// В консоли браузера
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key))
})

// Очистка
localStorage.clear()
```

### Сброс состояния

```typescript
// В App.tsx есть функция
clearAllData()  // Удаляет ВСЁ
```

---

## 📚 Дополнительная документация

- **QUICKSTART.md** - Быстрый старт для пользователей
- **TESTING_GUIDE.md** - Руководство по тестированию
- **CHANGELOG.md** - История изменений
- **SUMMARY.md** - Резюме проекта
- **FILES_STRUCTURE.md** - Структура файлов

---

## 👥 Контрибьюция

При внесении изменений:
1. Следуйте паттернам кодирования
2. Добавляйте типизацию TypeScript
3. Тестируйте функционал
4. Обновляйте документацию
5. Проверяйте работу localStorage

---

**Удачной разработки! 🚀**
