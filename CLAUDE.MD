# 🤖 CLAUDE.MD - Инструкции для Claude Desktop

> **Главный файл для работы Claude с проектом DeutschMeister**

**Версия:** 1.1.0  
**Последнее обновление:** 27 января 2026  
**Статус:** Supabase Powered ✅

---

## 📖 Оглавление

1. [🎯 Quick Start](#-quick-start)
2. [🏗️ Архитектура](#️-архитектура)
3. [📁 Структура проекта](#-структура-проекта)
4. [🧩 Паттерны кодирования](#-паттерны-кодирования)
5. [🤖 AI-Репетитор](#-ai-репетитор)
6. [⚡ Оптимизация](#-оптимизация)
7. [💾 Supabase DB](#-supabase-db)
8. [🔧 Расширение функционала](#-расширение-функционала)
9. [🐛 Отладка и Troubleshooting](#-отладка-и-troubleshooting)
10. [📞 Как спрашивать](#-как-спрашивать)

---

## 🎯 Quick Start

**DeutschMeister** — интерактивное приложение для изучения немецкого языка с AI-репетитором на базе Google Gemini API.

### Основные команды
```bash
npm install          # Установка
npm run dev          # Разработка (http://localhost:5173)
npm run build        # Production сборка
npm run preview      # Предпросмотр сборки
```

### Технологический стек
- **Frontend:** React 19 + TypeScript
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS 4
- **Database/Auth:** Supabase (PostgreSQL)
- **AI:** Google Gemini 2.0 Flash / OpenAI GPT-4o mini
- **Storage:** Supabase Table Storage (replacing LocalStorage)

### Критичные файлы
```
App.tsx              🔴 Главный компонент, состояние
constants.ts         🔴 SYSTEM_PROMPT, начальные данные
types.ts             🔴 TypeScript интерфейсы
.env                 🔴 API ключ (VITE_GEMINI_API_KEY)
components/          🟡 React компоненты
services/            🟢 Бизнес-логика
lessons.json         🔵 Данные уроков
```

---

## 🏗️ Архитектура

### Single Page Application (SPA)

```
┌──────────────────────────────────────────┐
│              App.tsx (Root)              │
│   Состояние, маршрутизация, persistence │
└──────────┬───────────────────────────────┘
           │
    ┌──────┴──────┬─────────────┬──────────────┐
    │             │             │              │
 COMPONENTS   SERVICES      STORAGE         TYPES
 ├─ VocabCard ├─ aiService  ├─ Supabase DB ├─ Lesson
 ├─ TutorChat ├─ lessonSvc  ├─ Auth        ├─ Exercise
 ├─ Auth      ├─ userState  └─ Realtime    ├─ Vocabulary
 ├─ Dashboard ├─ validate                  └─ LessonState
 └─ Stats     └─ spaced/stats  
```

### Поток данных

```
1. Загрузка      → App → lessonService → Supabase → setState
2. Пользователь → Компонент → userStateService → Supabase
3. AI запрос     → validationService (локально) 
                 → aiService (API) → setState
```

### Жизненный цикл урока

```
Выбор урока
    ↓
Изучение лексики (VocabularyCard)
  - Learning фаза (просмотр слов)
  - Testing фаза (проверка памяти)
    ↓
Практические упражнения (TutorChat)
  - Проверка ответов (локально или API)
  - Объяснение ошибок
  - Мотивация ученика
    ↓
Режим экзамена (ExamMode)
  - Без помощи AI
  - Быстрая проверка знаний
    ↓
Статистика (Dashboards)
  - Прогресс по уроку
  - Общая статистика
```

---

## 📁 Структура проекта

### Организация файлов

```
Deutsch-Youtube-AI-Tutor/
│
├── .claude/                    # 🆕 Новая папка с инструкциями
│   ├── README.md              # Навигация
│   ├── context.md             # Полный контекст
│   ├── instructions.md        # Критические правила
│   ├── skills/                # Навыки репетитора
│   ├── system-prompts/        # System prompts
│   ├── services-config/       # Конфигурация сервисов
│   ├── patterns/              # Паттерны кодирования
│   └── ...
│
├── 🔴 App.tsx                 # Главный компонент
├── 🔴 constants.ts            # SYSTEM_PROMPT, начальные данные
├── 🔴 types.ts                # TypeScript интерфейсы
├── 🔴 index.tsx               # Точка входа
├── 🔴 .env                    # API ключи (не коммитить!)
│
├── components/                # 🟡 React компоненты
│   ├── VocabularyCard.tsx     # Карточки со словами
│   ├── TutorChat.tsx          # Чат с AI репетитором
│   ├── ExamMode.tsx           # Режим экзамена
│   ├── StatisticsDashboard.tsx # Статистика урока
│   └── ...
│
├── services/                  # 🟢 Сервисы
│   ├── geminiService.ts       # Google Gemini API
│   ├── validationService.ts   # Локальная валидация
│   ├── spacedRepetition.ts    # Алгоритм SM-2
│   ├── difficultyTracker.ts   # Отметка сложных слов
│   ├── tokenTracker.ts        # Учёт API запросов
│   └── vocabularyStatistics.ts # Статистика слов
│
├── 🔵 lessons.json            # Данные уроков
├── 🔵 vite.config.ts          # Конфигурация Vite
├── 🔵 tailwind.config.js      # Tailwind
├── 🔵 tsconfig.json           # TypeScript
└── 🔵 package.json            # Зависимости
```

### Обозначения
- 🔴 Критичные (изменения требуют тестирования)
- 🟡 Важные компоненты (влияют на UX)
- 🟢 Сервисы (бизнес-логика)
- 🔵 Конфигурация (редко меняются)

---

## 🧩 Паттерны кодирования

### Паттерн компонента

```typescript
import React, { useState, useEffect } from 'react'
import { MyType } from '../types'

interface MyComponentProps {
  title: string
  onAction?: () => void
  isLoading?: boolean
}

const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction,
  isLoading = false
}) => {
  const [state, setState] = useState<string>('')

  useEffect(() => {
    // Побочные эффекты
  }, [])

  const handleClick = () => {
    setState('new value')
    onAction?.()
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div className="p-4 rounded-lg bg-white shadow">
      <h2>{title}</h2>
      <button onClick={handleClick}>Нажми</button>
    </div>
  )
}

export default MyComponent
```

### Паттерн сервиса

```typescript
export const myService = {
  // Получение
  getData: async (id: string): Promise<MyType> => {
    try {
      const stored = localStorage.getItem(`key_${id}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('❌ Ошибка:', error)
      throw error
    }
  },

  // Сохранение
  saveData: (id: string, data: MyType): void => {
    try {
      localStorage.setItem(`key_${id}`, JSON.stringify(data))
    } catch (error) {
      console.error('❌ Ошибка:', error)
      throw error
    }
  }
}
```

### Состояние: useState + useEffect + localStorage

```typescript
const [data, setData] = useState<MyType | null>(null)
const [isLoading, setIsLoading] = useState(true)

// Загрузить при монтировании
useEffect(() => {
  const stored = localStorage.getItem('my_data')
  if (stored) setData(JSON.parse(stored))
  setIsLoading(false)
}, [])

// Сохранить при изменении
useEffect(() => {
  if (!isLoading && data) {
    localStorage.setItem('my_data', JSON.stringify(data))
  }
}, [data, isLoading])
```

### Обработка ошибок: try-catch

```typescript
const handleFetch = async () => {
  setIsLoading(true)
  setError(null)

  try {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    setData(data)
  } catch (error: any) {
    const msg = error?.message || JSON.stringify(error)
    setError(msg)
    console.error('❌ Ошибка:', msg)
  } finally {
    setIsLoading(false)
  }
}
```

### Типизация: TypeScript

```typescript
// ✅ Правильно: типизированы все параметры и return
const calculateProgress = (
  correct: number,
  total: number
): number => {
  return (correct / total) * 100
}

// ❌ Неправильно: no types
const calculateProgress = (correct, total) => {
  return (correct / total) * 100
}

// Интерфейсы для props
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}
```

---

## 🤖 AI-Репетитор

### Как это работает

**SYSTEM_PROMPT** в `constants.ts` определяет поведение AI:

```
Роль: Терпеливый, дружелюбный репетитор немецкого языка

Режим 1: Проверка упражнений
- Если ответ правильный → МАКСИМАЛЬНО КРАТКО (1-5 слов!)
- Если частично правильный → объяснение + подсказка
- Если неправильный → разбор + направление

Режим 2: Ответы на вопросы
- Прямой ответ в 1-2 предложениях
- Подробное объяснение
- Примеры из vocabulary урока
```

### Критичное правило: КРАТКОСТЬ

**При правильном ответе ученика:**

```
✅ Верно!
✅ Правильно!
✅ Отлично! Хороший порядок слов.

❌ НИКОГДА не пиши:
❌ Верно! Вы очень хорошо справились...
❌ Правильно! Это показывает глубокое понимание...
```

**Почему?** Ученик уже знает что ответ правильный. Длинные объяснения раздражают и замедляют обучение.

### Проверка ответов: локально или API?

```typescript
// 1. Сначала локальная валидация (БЕЗ API!)
const validation = validateAnswer(userAnswer, correctAnswers)
if (validation && !validation.shouldCallAPI) {
  return validation.message  // ✅ ГОТОВО
}

// 2. Если локально не удалось → вызываем API
trackAPIRequest()
const response = await getTutorResponse(...)
```

**Локальная валидация** проверяет:
- Точное совпадение текста
- Совпадение без артиклей (das Haus = Haus)
- Нормализация (trim, lowercase, пунктуация)

**Это экономит 50-70% API запросов!**

### Мотивация пользователя

```
При правильном ответе:
- Хвали конкретно ("хороший порядок слов")
- Покажи прогресс ("улучшился на 20%")
- Ободри ("ты на правильном пути")

При ошибке:
- Нормализуй ("это нормально, ошибки помогают")
- Поддержи ("давайте разберёмся вместе")
- Направь ("подсказка: используй слово X")
```

---

## ⚡ Оптимизация

### API лимиты Google Gemini

```
Бесплатный тариф:
- 60 запросов в минуту
- 1500 запросов в день

Ошибки:
- 429: Rate limit (подождите 1 минуту)
- RESOURCE_EXHAUSTED: Квота исчерпана (попробуйте завтра)
```

### Как экономить запросы?

**1. Локальная валидация ✅**
```typescript
// Проверь локально ПЕРЕД API!
if (validateAnswer(userAnswer, correct)) {
  return  // БЕЗ API
}
```

**2. Ограничение истории чата ✅**
```typescript
const history = messages.slice(-3)  // Только 3 последних
// Экономит токены и снижает время отклика
```

**3. Батчинг обновлений ✅**
```typescript
// ✅ Один setState вместо нескольких
setProgress({ ...prev, task: next, stats: updated })

// ❌ Несколько setState подряд
setProgress({ ...prev, task: next })
setProgress({ ...prev, stats: updated })
```

**4. useMemo и useCallback ✅**
```typescript
const sortedWords = useMemo(
  () => sortBySpacedRepetition(vocabulary),
  [vocabulary]
)
```

---

## 💾 LocalStorage

### Какие данные сохраняются?

```typescript
'german_lessons_v1'                    // Все уроки
'lesson_{lessonId}_progress'           // Прогресс урока
'vocabulary_stats_{lessonId}'          // Статистика слов
'spaced_repetition_{lessonId}'         // Данные SM-2
'difficult_words_{lessonId}'           // Сложные слова
'api_requests_count'                   // Счётчик запросов
```

### Правильное использование

```typescript
// ✅ Загрузить при монтировании
useEffect(() => {
  try {
    const stored = localStorage.getItem('key')
    if (stored) setData(JSON.parse(stored))
  } catch (error) {
    console.error('❌ Ошибка JSON:', error)
  }
}, [])

// ✅ Сохранить при изменении
useEffect(() => {
  localStorage.setItem('key', JSON.stringify(data))
}, [data])

// ❌ НЕПРАВИЛЬНО:
const stored = localStorage.getItem('key')
setData(stored)  // Это строка, не объект!
```

### Отладка

```javascript
// В DevTools Console:
Object.keys(localStorage).forEach(k => console.log(k))
localStorage.getItem('german_lessons_v1')
localStorage.clear()  // Очистить всё
```

---

## 🔧 Расширение функционала

### Добавить новый компонент

```bash
1. Создать components/MyComponent.tsx
2. Определить интерфейс Props
3. Реализовать с Hooks
4. Импортировать в App.tsx
5. Стилизовать Tailwind CSS
```

### Добавить новый сервис

```bash
1. Создать services/myService.ts
2. Определить интерфейсы и типы
3. Реализовать функции (get, set, delete)
4. Обработать ошибки с try-catch
5. Использовать в компонентах
```

### Изменить SYSTEM_PROMPT

```bash
1. Открыть constants.ts
2. Отредактировать SYSTEM_PROMPT
3. Протестировать в TutorChat
4. Обновить документацию в .claude/system-prompts/
```

### Добавить новый тип данных

```bash
1. Открыть types.ts
2. Добавить интерфейс
3. Обновить сервисы
4. Обновить компоненты
5. Обновить localStorage ключи
```

---

## 🐛 Отладка и Troubleshooting

### Частые ошибки

**Ошибка: API ключ не работает**
```bash
✅ Решение:
1. Проверить .env существует
2. Ключ начинается с VITE_
3. Перезагрузить dev сервер
4. Проверить VITE_GEMINI_API_KEY= правильный
```

**Ошибка: localStorage.getItem() падает с JSON.parse**
```bash
✅ Решение:
try {
  const stored = localStorage.getItem('key')
  if (stored) setData(JSON.parse(stored))
} catch (error) {
  console.error('JSON parse error:', error)
}
```

**Ошибка: Компонент не обновляется**
```bash
✅ Решение:
1. Проверить зависимости в useEffect
2. Убедиться что setState вызывается
3. Не мутировать состояние напрямую
4. Проверить props меняются
```

**Ошибка: TypeScript 'any' type**
```bash
✅ Решение:
// ❌ НЕПРАВИЛЬНО
const data: any = ...

// ✅ ПРАВИЛЬНО
interface MyType { ... }
const data: MyType = ...
```

### Логирование

```typescript
// Используй префиксы
console.log('🔄 Загрузка...')
console.log('✅ Успех')
console.error('❌ Ошибка:', error)
console.warn('⚠️ Внимание')
```

### Сброс состояния (в браузер консоли)

```javascript
// Очистить localStorage
localStorage.clear()

// Очистить конкретный ключ
localStorage.removeItem('german_lessons_v1')

// Просмотреть все данные
Object.keys(localStorage).forEach(k => {
  console.log(k, localStorage.getItem(k))
})

// Перезагрузить страницу
location.reload()
```

---

## 📞 Как спрашивать

### ✅ Хорошие вопросы

```
"Как добавить функцию для отслеживания дневного стрика?
Вот код компонента: [...], вот что я хочу сделать: [...]"

"При проверке ответа в TutorChat выбрасывается ошибка:
[копия ошибки]. Вот контекст: [...]"

"Нужно оптимизировать компонент VocabularyCard, 
он слишком медленный. Вот текущий код: [...]"
```

### ❌ Плохие вопросы

```
"Исправь мой код"
"Не работает"
"Помоги"
```

### Что включать в вопрос?

```
1. Файл над которым работаешь (App.tsx, VocabularyCard.tsx)
2. Что хочешь сделать (цель)
3. Что уже пробовал
4. Ошибка/результат
5. Релевантный код
6. Контекст (какой компонент, какие данные)
```

### Как структурировать запрос

```
"Я работаю над [ФАЙЛ].

Цель: [ЧТО НУЖНО СДЕЛАТЬ]

Текущий код:
[КОД]

Проблема: [ЧТО НЕ РАБОТАЕТ]

Попробовал: [ЧТО УЖЕ ПОПРОБОВАЛ]

Ошибка: [ЕСЛИ ЕСТЬ]"
```

---

## 📚 Дополнительные ресурсы

### Папка .claude/ (новые инструкции)

```
.claude/
├── README.md                    # Навигация
├── context.md                   # Полный контекст
├── instructions.md              # Критические правила
├── claude.config.json           # JSON конфиг
├── skills/                      # Навыки репетитора
│   ├── vocabulary-teaching.md
│   ├── exercise-checking.md
│   ├── error-detection.md
│   └── user-motivation.md
├── system-prompts/              # System prompts
│   ├── main-tutor-prompt.md
│   └── role-definitions.md
├── services-config/             # Конфигурация
│   ├── gemini-api-config.md
│   ├── validation-rules.md
│   ├── spaced-repetition-config.md
│   └── token-limits.md
└── patterns/                    # Паттерны
    ├── component-patterns.md
    ├── service-patterns.md
    ├── state-management.md
    └── error-handling.md
```

### Внешние ссылки

- **Google Gemini API:** https://ai.google.dev/
- **React Hooks:** https://react.dev/reference/react
- **TypeScript:** https://www.typescriptlang.org/
- **Tailwind CSS:** https://tailwindcss.com/
- **Vite:** https://vitejs.dev/

---

## 🎯 Шпаргалка

### Быстрые команды

```bash
npm run dev              # Разработка
npm run build           # Сборка
npm run preview         # Предпросмотр
```

### Критичные правила

```
1. 🔴 КРАТКОСТЬ при правильном ответе (1-5 слов!)
2. 🔴 TypeScript (нет any)
3. 🔴 localStorage (всё персистит)
4. 🔴 Локальная валидация перед API
5. 🔴 try-catch для всех операций
```

### Файлы которые изменяются часто

```
App.tsx              (состояние, логика)
constants.ts         (SYSTEM_PROMPT, данные)
components/*.tsx     (UI компоненты)
services/*.ts        (бизнес-логика)
```

### Файлы которые редко меняются

```
types.ts             (интерфейсы)
vite.config.ts       (конфиг)
tailwind.config.js   (стили)
package.json         (зависимости)
```

---

## ✨ Помни

**При разработке:**
1. Следуй паттернам
2. Типизируй всё (TypeScript)
3. Сохраняй в localStorage
4. Обрабатывай ошибки
5. Документируй

**При работе с Claude:**
1. Будь конкретен в вопросах
2. Включай код и контекст
3. Описывай что хочешь получить
4. Показывай ошибки

**При разработке AI-репетитора:**
1. КРАТКОСТЬ при правильном ответе!
2. Мотивируй при ошибках
3. Используй примеры из урока
4. Дай подсказку, не готовый ответ

---

**Готов работать с проектом? Начинай!** 🚀

*Если нужна информация по конкретной теме — ищи в папке `.claude/` или спрашивай Claude.*
