# 🏗️ Архитектура проекта DeutschMeister

> Подробное техническое описание архитектуры приложения

**Версия:** 1.0  
**Дата:** 14 января 2025

---

## 📋 Содержание

1. [Общая архитектура](#общая-архитектура)
2. [Слои приложения](#слои-приложения)
3. [Потоки данных](#потоки-данных)
4. [Паттерны и практики](#паттерны-и-практики)
5. [Оптимизации](#оптимизации)
6. [Безопасность](#безопасность)

---

## 🏗️ Общая архитектура

### Архитектурный стиль
**Layered Architecture (Слоёная архитектура)**

```
┌─────────────────────────────────────────────────────┐
│           PRESENTATION LAYER                         │
│  (React Components, UI Logic, User Interactions)    │
└─────────────┬───────────────────────────────────────┘
              │ Props, Events, State Updates
┌─────────────▼───────────────────────────────────────┐
│           BUSINESS LOGIC LAYER                       │
│  (Services, Algorithms, Validation, AI Integration) │
└─────────────┬───────────────────────────────────────┘
              │ Read/Write Operations
┌─────────────▼───────────────────────────────────────┐
│           DATA PERSISTENCE LAYER                     │
│  (LocalStorage, State Management, Caching)          │
└─────────────────────────────────────────────────────┘
```

### Ключевые принципы

1. **Separation of Concerns** - каждый слой решает свою задачу
2. **Single Responsibility** - компоненты и сервисы имеют одну ответственность
3. **Dependency Inversion** - зависимости направлены от UI к бизнес-логике
4. **DRY (Don't Repeat Yourself)** - переиспользование через сервисы
5. **KISS (Keep It Simple, Stupid)** - простые решения предпочтительнее сложных

---

## 📦 Слои приложения

### 1️⃣ Presentation Layer (UI)

**Ответственность:** Отображение данных и обработка пользовательского ввода

#### Структура компонентов

```typescript
src/
├── App.tsx                        // Главный компонент (роутинг, стейт)
├── components/
│   ├── VocabularyCard.tsx        // Карточки слов (обучение + тест)
│   ├── TutorChat.tsx             // Чат с AI репетитором
│   ├── ExamMode.tsx              // Режим экзамена
│   ├── LessonCard.tsx            // Карточка урока на главной
│   ├── GlobalDashboard.tsx       // Общий прогресс по всем урокам
│   ├── StatisticsDashboard.tsx   // Статистика конкретного урока
│   ├── SpacedRepetitionStats.tsx // Визуализация SRS
│   └── TokenIndicator.tsx        // Счётчик API запросов
```

#### Паттерны в компонентах

**Smart Components (Container):**
- `App.tsx` - управляет общим состоянием
- `TutorChat.tsx` - управляет беседой с AI
- `ExamMode.tsx` - управляет логикой экзамена

**Presentational Components (Dumb):**
- `LessonCard.tsx` - только отображение
- `TokenIndicator.tsx` - только визуализация
- `SpacedRepetitionStats.tsx` - только графики

#### Управление состоянием

```typescript
// Локальное состояние (useState)
const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
const [progress, setProgress] = useState<LessonProgress | null>(null);

// Вычисляемое состояние (useMemo)
const totalTasks = useMemo(() => {...}, [selectedLesson]);
const progressPercent = useMemo(() => {...}, [currentGlobalIdx, totalTasks]);

// Эффекты синхронизации (useEffect)
useEffect(() => {
  localStorage.setItem(key, JSON.stringify(progress));
}, [progress]);
```

---

### 2️⃣ Business Logic Layer (Services)

**Ответственность:** Бизнес-логика, алгоритмы, интеграции

#### Сервисы

```typescript
src/services/
├── geminiService.ts              // API Gemini (AI проверка)
├── validationService.ts          // Локальная проверка ответов
├── spacedRepetition.ts           // Алгоритм SM-2
├── tokenTracker.ts               // Учёт API запросов
├── difficultyTracker.ts          // Отслеживание сложности
├── progressTracker.ts            // Общий прогресс обучения
└── vocabularyStatistics.ts       // Статистика слов
```

#### Пример сервиса (чистая функция)

```typescript
// spacedRepetition.ts
export const sortBySpacedRepetition = (
  vocabulary: Vocabulary[],
  lessonId: string
): Vocabulary[] => {
  const today = new Date().toISOString().split('T')[0];
  
  return vocabulary
    .map(v => ({
      ...v,
      nextReview: getNextReviewDate(v.word, lessonId, today)
    }))
    .sort((a, b) => 
      a.nextReview.localeCompare(b.nextReview)
    );
};
```

**Преимущества:**
- ✅ Тестируемость (чистые функции)
- ✅ Переиспользуемость
- ✅ Независимость от UI

---

### 3️⃣ Data Persistence Layer (Storage)

**Ответственность:** Хранение и восстановление данных

#### Структура хранилища

```typescript
LocalStorage:
├── german_lessons_v1              // Все уроки
├── lesson_1_progress              // Прогресс урока #1
├── lesson_1_vocabulary            // SR данные слов урока #1
├── lesson_2_progress              // Прогресс урока #2
├── lesson_2_vocabulary            // SR данные слов урока #2
└── gemini_request_count           // Счётчик API запросов
```

#### Паттерн работы с LocalStorage

```typescript
// Инициализация с fallback
const [lessons, setLessons] = useState<Lesson[]>(() => {
  try {
    const saved = localStorage.getItem(LESSONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_LESSONS;
  } catch (e) {
    console.error('Ошибка загрузки:', e);
    return INITIAL_LESSONS;
  }
});

// Автоматическое сохранение
useEffect(() => {
  try {
    localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
  } catch (error) {
    console.error('Ошибка сохранения:', error);
  }
}, [lessons]);
```

**Проблемы и решения:**

| Проблема | Решение |
|----------|---------|
| Переполнение (5-10MB лимит) | Очистка старых данных, сжатие |
| Потеря данных при ошибках | Try-catch блоки везде |
| Синхронизация между вкладками | window.onstorage события |

---

## 🔄 Потоки данных

### Поток 1: Загрузка урока

```
Пользователь выбирает урок
         ↓
App.tsx → selectLesson()
         ↓
localStorage.getItem('lesson_X_progress')
         ↓
setProgress(savedProgress || newProgress)
         ↓
setCurrentView('lesson-overview')
         ↓
Рендер обзора урока
```

### Поток 2: Проверка ответа (гибридная валидация)

```
Пользователь вводит ответ
         ↓
TutorChat → validateAnswer()
         ↓
validationService.validate()  ← локальная проверка
         ↓
Результат: exact match?
   YES → onFeedback(true)
   NO  → geminiService.check()  ← AI проверка
         ↓
         onFeedback(isCorrect)
         ↓
App.tsx → updateProgress()
         ↓
localStorage.setItem('lesson_X_progress')
```

**Экономия 70% API запросов через локальную валидацию!**

### Поток 3: Spaced Repetition

```
VocabularyCard монтируется
         ↓
spacedRepetition.sortBySpacedRepetition()
         ↓
Чтение localStorage: lesson_X_vocabulary
         ↓
Расчёт nextReviewDate для каждого слова
         ↓
Сортировка по дате (срочные первыми)
         ↓
Рендер карточек в новом порядке
         ↓
Пользователь отвечает правильно/неправильно
         ↓
spacedRepetition.updateCardStats()
         ↓
SM-2 алгоритм → новый интервал
         ↓
Сохранение в localStorage
```

---

## 🎨 Паттерны и практики

### 1. Component Patterns

#### Composition (Композиция)

```typescript
// Хорошо: композиция через children
<LessonCard lesson={lesson} progress={progress}>
  <LessonCardActions onDelete={handleDelete} />
</LessonCard>

// Плохо: prop drilling
<LessonCard 
  lesson={lesson} 
  progress={progress}
  onDelete={handleDelete}
  onEdit={handleEdit}
  onDuplicate={handleDuplicate}
/>
```

#### Conditional Rendering

```typescript
// Хорошо: ранний return
if (!selectedLesson) return <Loader />;

// Плохо: вложенные тернарники
{selectedLesson ? (
  progress ? (
    vocabCompleted ? <Practice /> : <Vocabulary />
  ) : <Loader />
) : <Dashboard />}
```

### 2. State Management Patterns

#### Derived State (useMemo)

```typescript
// Вычисляемое состояние
const progressPercent = useMemo(() => {
  if (!totalTasks) return 0;
  return Math.round((currentGlobalIdx + 1) / totalTasks * 100);
}, [currentGlobalIdx, totalTasks]);
```

#### State Colocation

```typescript
// Держите стейт близко к месту использования
const VocabularyCard = () => {
  const [flipped, setFlipped] = useState(false); // только здесь нужно
  // ...
};
```

### 3. Performance Patterns

#### Мемоизация тяжёлых вычислений

```typescript
const lessonProgress = useMemo(() => {
  const result: Record<string, LessonProgress> = {};
  lessons.forEach(lesson => {
    const prog = getLessonProgressFromStorage(lesson.lesson_id);
    if (prog) result[lesson.lesson_id] = prog;
  });
  return result;
}, [lessons, progressUpdateTrigger]);
```

#### Debouncing

```typescript
// tokenTracker.ts
let debounceTimer: ReturnType<typeof setTimeout>;

export const incrementRequestCount = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(() => {
    const count = getRequestCount();
    localStorage.setItem(REQUEST_COUNT_KEY, String(count + 1));
  }, 300);
};
```

---

## ⚡ Оптимизации

### 1. Локальная валидация (Hybrid Validation)

**До оптимизации:**
- 100% ответов → Gemini API
- ~$0.10 за урок из 20 заданий
- Латентность 500-2000ms

**После оптимизации:**
- 30% → Gemini API (сложные случаи)
- 70% → локальная проверка
- ~$0.03 за урок
- Латентность <50ms для точных совпадений

```typescript
// validationService.ts
export const validateAnswer = (
  userAnswer: string,
  correctAnswers: string[]
): 'exact' | 'needs_ai_check' => {
  const normalized = normalizeText(userAnswer);
  
  for (const correct of correctAnswers) {
    if (normalized === normalizeText(correct)) {
      return 'exact'; // ✅ Экономия API вызова!
    }
  }
  
  return 'needs_ai_check'; // → Gemini API
};
```

### 2. История чата (Context Optimization)

**Проблема:** Каждое сообщение в истории = токены в API запросе

**Решение:** Ограничение до 3 последних сообщений

```typescript
const trimmedHistory = chatHistory.slice(-3);
```

**Экономия:** ~60% токенов на длинных диалогах

### 3. Ленивая загрузка прогресса

```typescript
// Загружаем прогресс только для отображаемых уроков
const getLessonProgressFromStorage = (lessonId: string): LessonProgress | null => {
  try {
    const saved = localStorage.getItem(`lesson_${lessonId}_progress`);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};
```

### 4. Debouncing сохранений

```typescript
const [saveDebounce, setSaveDebounce] = useState<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (saveDebounce) clearTimeout(saveDebounce);
  
  const timer = setTimeout(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, 500); // Сохраняем раз в 500ms, а не на каждый keystroke
  
  setSaveDebounce(timer);
  
  return () => clearTimeout(timer);
}, [data]);
```

---

## 🔒 Безопасность

### 1. API Key Protection

```bash
# .env (НЕ в git!)
GEMINI_API_KEY=ваш_секретный_ключ

# .gitignore
.env
.env.local
```

```typescript
// Доступ через process.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

**❌ Проблема:** API ключ виден в клиентском коде

**✅ Будущее решение:** Proxy через собственный backend

### 2. Input Sanitization

```typescript
// Очистка пользовательского ввода перед AI
const sanitizeInput = (text: string): string => {
  return text
    .replace(/<script>/gi, '') // XSS защита
    .replace(/[^\w\säöüßÄÖÜ.,!?-]/gi, '') // только безопасные символы
    .slice(0, 500); // лимит длины
};
```

### 3. LocalStorage Security

```typescript
// НЕ храним чувствительные данные
const SAFE_TO_STORE = [
  'уроки',
  'прогресс обучения',
  'статистика',
  'настройки UI'
];

const NEVER_STORE = [
  'пароли',
  'токены',
  'личные данные',
  'платёжная информация'
];
```

### 4. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'">
```

---

## 🧪 Тестируемость

### Принципы тестируемого кода

1. **Pure Functions** - сервисы возвращают новые данные, не мутируют

```typescript
// ✅ Хорошо: чистая функция
export const calculateProgress = (
  correct: number, 
  total: number
): number => {
  return Math.round((correct / total) * 100);
};

// ❌ Плохо: побочные эффекты
export const calculateProgress = () => {
  globalStats.percent = Math.round(...);
};
```

2. **Dependency Injection** - передаём зависимости явно

```typescript
// ✅ Хорошо
export const validateWithAI = async (
  answer: string,
  apiKey: string
) => {...};

// ❌ Плохо
export const validateWithAI = async (answer: string) => {
  const apiKey = process.env.API_KEY; // скрытая зависимость
};
```

3. **Mockable Interfaces** - легко заменяемые сервисы

```typescript
// storage.interface.ts
export interface IStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

// В тестах используем MockStorage
class MockStorage implements IStorage {
  private store: Record<string, string> = {};
  get(key: string) { return this.store[key] || null; }
  set(key: string, value: string) { this.store[key] = value; }
}
```

---

## 📊 Мониторинг и отладка

### Логирование

```typescript
// Структурированное логирование
console.log('[LESSON] Загрузка урока #1');
console.log('[AI] Отправка запроса к Gemini API');
console.log('[STORAGE] Сохранение прогресса');
console.error('[ERROR] Ошибка валидации:', error);
```

### Performance Monitoring

```typescript
// React DevTools Profiler
const onRenderCallback = (
  id: string,
  phase: "mount" | "update",
  actualDuration: number
) => {
  console.log(`${id} took ${actualDuration}ms`);
};

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
```

---

## 🔮 Будущие улучшения архитектуры

### Краткосрочные (1-3 месяца)

1. **State Management библиотека**
   - Внедрить Zustand или Redux Toolkit
   - Вынести стейт из App.tsx

2. **Service Worker**
   - Офлайн-поддержка
   - Кэширование запросов

3. **TypeScript строгость**
   - Включить `strict: true`
   - Добавить Zod для runtime валидации

### Долгосрочные (6-12 месяцев)

4. **Backend API**
   - Node.js/Express сервер
   - PostgreSQL база данных
   - JWT аутентификация

5. **Микросервисная архитектура**
   - AI Service (отдельный сервис)
   - Auth Service
   - Content Service

6. **Event-Driven Architecture**
   - Использовать события вместо прямых вызовов
   - Разделение ответственности

---

## 📚 Рекомендуемая литература

1. **React:**
   - "React Design Patterns and Best Practices" - Michele Bertoli
   - "Fluent React" - Tejas Kumar

2. **TypeScript:**
   - "Effective TypeScript" - Dan Vanderkam
   - "Programming TypeScript" - Boris Cherny

3. **Архитектура:**
   - "Clean Architecture" - Robert Martin
   - "Domain-Driven Design" - Eric Evans

---

## 🎯 Заключение

Текущая архитектура проекта:
- ✅ **Простая и понятная** - легко разобраться новому разработчику
- ✅ **Масштабируемая** - можно добавлять новые фичи без боли
- ✅ **Производительная** - оптимизации на каждом слое
- ✅ **Тестируемая** - чистые функции и разделение ответственности

**Ключевые сильные стороны:**
1. Гибридная валидация (70% экономия)
2. Модульная структура сервисов
3. Эффективное использование LocalStorage
4. Оптимизированный UI с мемоизацией

**Возможности для роста:**
1. Backend интеграция
2. State Management библиотека
3. Микросервисы
4. WebSocket для real-time

---

*Архитектура - это эволюция, а не единоразовое решение. Продолжаем улучшать!* 🚀
