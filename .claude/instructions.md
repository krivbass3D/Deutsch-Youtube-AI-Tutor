# 📖 Критические инструкции для Claude

> Ограничения, правила и приоритеты при работе с DeutschMeister

**Последнее обновление:** 25 января 2026

---

## ⚠️ КРИТИЧЕСКИЕ ПРАВИЛА

### 1️⃣ **AI-РЕПЕТИТОР: КРАТКОСТЬ ПРИ ПРАВИЛЬНОМ ОТВЕТЕ**

**ПРАВИЛО:** Когда ответ пользователя ПОЛНОСТЬЮ ПРАВИЛЬНЫЙ, отвечайте МАКСИМАЛЬНО КРАТКО!

#### ✅ ПРАВИЛЬНО:
```
✅ Верно!
✅ Правильно!
✅ Отлично!
```

#### ✅ МОЖНО ДОБАВИТЬ ОДНО УТОЧНЕНИЕ (не более 5-7 слов):
```
✅ Верно! Отличный порядок слов.
✅ Правильно! Хорошее использование Perfekt.
✅ Отлично! Верный падеж.
```

#### ❌ НИКОГДА НЕ ДЕЛАЙТЕ:
```
✅ Верно! Отличный ответ! Вы правильно построили 
   предложение используя правильный порядок слов, 
   правильное время Perfekt, и правильный артикль. 
   В немецком языке очень важно...
```

**Почему?** Пользователь уже знает, что ответ правильный. Длинное объяснение раздражает и замедляет обучение.

---

### 2️⃣ **TYPESCRIPT: СТРОГАЯ ТИПИЗАЦИЯ**

**ПРАВИЛО:** Всегда используйте TypeScript типы. Никогда не используйте `any`.

#### ✅ ПРАВИЛЬНО:
```typescript
interface MyComponentProps {
  lesson: Lesson
  onNext: () => void
  isLoading: boolean
}

const MyComponent: React.FC<MyComponentProps> = ({ lesson, onNext, isLoading }) => {
  // ...
}
```

#### ❌ НЕПРАВИЛЬНО:
```typescript
const MyComponent = (props: any) => {  // ❌ НЕТ!
  const data: any = props.lesson       // ❌ НЕТ!
  // ...
}
```

---

### 3️⃣ **LOCALSTORAGE: ВСЕГДА СОХРАНЯЙТЕ**

**ПРАВИЛО:** Любое изменение состояния, которое должно сохраниться между сеансами, ОБЯЗАТЕЛЬНО должно быть сохранено в localStorage.

#### ✅ ПРАВИЛЬНО:
```typescript
useEffect(() => {
  localStorage.setItem('german_lessons_v1', JSON.stringify(lessons))
}, [lessons])

useEffect(() => {
  localStorage.setItem(`lesson_${lessonId}_progress`, JSON.stringify(progress))
}, [progress, lessonId])
```

#### ❌ НЕПРАВИЛЬНО:
```typescript
// Состояние в памяти БЕЗ сохранения в localStorage
const [progress, setProgress] = useState(null)  // ❌ Потеряется при обновлении страницы!
```

---

### 4️⃣ **API: ЭКОНОМЬТЕ ЗАПРОСЫ**

**ПРАВИЛО:** Каждый API-запрос к Gemini стоит дорого (лимит 1500 в день). Используйте локальную валидацию перед отправкой запроса.

#### ✅ ПРАВИЛЬНО:
```typescript
// 1. Сначала пытаемся проверить локально
const validation = validateAnswer(userAnswer, correctAnswers)
if (validation && !validation.shouldCallAPI) {
  return validation.message  // БЕЗ API! ✅
}

// 2. Только если локально не удалось
trackAPIRequest()
const response = await getTutorResponse(...)
```

#### ❌ НЕПРАВИЛЬНО:
```typescript
// Сразу идём в API, без локальной проверки
const response = await getTutorResponse(...)  // ❌ Зря потратили лимит!
```

---

### 5️⃣ **REACT: ФУНКЦИОНАЛЬНЫЕ КОМПОНЕНТЫ + HOOKS**

**ПРАВИЛО:** Используйте только функциональные компоненты с Hooks. Классовые компоненты запрещены.

#### ✅ ПРАВИЛЬНО:
```typescript
const MyComponent: React.FC<MyProps> = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null)
  
  useEffect(() => {
    // ...
  }, [dependencies])
  
  return <div>...</div>
}

export default MyComponent
```

#### ❌ НЕПРАВИЛЬНО:
```typescript
class MyComponent extends React.Component {  // ❌ ЗАПРЕЩЕНО!
  render() {
    return <div>...</div>
  }
}
```

---

### 6️⃣ **ОБРАБОТКА ОШИБОК: ВСЕГДА TRY-CATCH**

**ПРАВИЛО:** Оборачивайте все API-запросы в try-catch и обрабатывайте ошибки 429 (Rate Limit) и RESOURCE_EXHAUSTED (квота исчерпана).

#### ✅ ПРАВИЛЬНО:
```typescript
try {
  const response = await getTutorResponse(lesson, userAnswer, history)
  // обработка успеха
} catch (error: any) {
  const errorMessage = error?.message || JSON.stringify(error)
  
  if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
    // Rate limit достигнут
    setErrorMessage('Лимит API-запросов исчерпан. Попробуйте завтра.')
  } else {
    console.error('❌ Ошибка API:', error)
    setErrorMessage('Ошибка при проверке ответа. Попробуйте ещё раз.')
  }
}
```

---

## ✅ ЧТО НУЖНО ДЕЛАТЬ

### 1. При разработке компонента

- [ ] Использовать **TypeScript** (интерфейсы для props)
- [ ] Использовать **Hooks** (useState, useEffect, useMemo, useCallback)
- [ ] Сохранять данные в **localStorage**
- [ ] Добавлять **комментарии** для сложной логики
- [ ] Использовать **Tailwind CSS** для стилизации
- [ ] Импортировать компонент в `App.tsx` и использовать

### 2. При работе с API

- [ ] Всегда пытаться **локально валидировать** перед API
- [ ] Ограничивать **историю чата** до 3 последних сообщений
- [ ] **Отслеживать** использованные запросы (`trackAPIRequest()`)
- [ ] **Обрабатывать** ошибки 429 и RESOURCE_EXHAUSTED
- [ ] Показывать пользователю **индикатор** использованных запросов

### 3. При изменении состояния

- [ ] Использовать **useState** для локального состояния компонента
- [ ] Использовать **useEffect** для синхронизации с localStorage
- [ ] **Всегда** сохранять в localStorage при изменении
- [ ] Использовать **useMemo** для тяжёлых вычислений
- [ ] Использовать **useCallback** для функций в props

### 4. При работе с уроками

- [ ] Проверять структуру урока (vocabulary, exercises, answers)
- [ ] Валидировать индексы (currentExerciseIdx, currentTaskIdx)
- [ ] Обрабатывать граничные случаи (начало, конец урока)
- [ ] Сохранять прогресс после каждого действия

### 5. При добавлении новой фичи

- [ ] Написать **интерфейсы TypeScript**
- [ ] Определить **localStorage ключи**
- [ ] Реализовать **сохранение и загрузку**
- [ ] Обработать **ошибки**
- [ ] Протестировать в браузере (F12 → Console, Application → LocalStorage)
- [ ] Обновить **documentation** в `.claude/`

---

## ❌ ЧТО НЕ НУЖНО ДЕЛАТЬ

### 1. Запрещённые практики

- ❌ Не используйте `any` в TypeScript
- ❌ Не создавайте классовые компоненты
- ❌ Не забывайте сохранять в localStorage
- ❌ Не отправляйте в API без локальной валидации
- ❌ Не оставляйте console.log() в production коде (только для ошибок)
- ❌ Не используйте inline styles (только Tailwind CSS)
- ❌ Не создавайте глобальное состояние (используйте только localStorage + useState)

### 2. При работе с репетитором

- ❌ Не пишите длинные объяснения при правильном ответе
- ❌ Не переводите весь правильный ответ (пусть сразу видно, что верно)
- ❌ Не давайте два раза один и тот же ответ
- ❌ Не ругайте за ошибки (всегда доброжелательно)
- ❌ Не используйте сложные лингвистические термины без объяснений

### 3. При оптимизации

- ❌ Не ограничивайте историю чата менее чем 3 сообщениями (нужен контекст)
- ❌ Не сохраняйте в localStorage слишком часто (батчируйте обновления)
- ❌ Не загружайте все уроки сразу при запуске (ленивая загрузка)
- ❌ Не выполняйте тяжёлые вычисления на каждый рендер (используйте useMemo)

### 4. При добавлении зависимостей

- ❌ Не добавляйте новые npm пакеты без одобрения
- ❌ Используйте только встроенные Tailwind CSS классы
- ❌ Не используйте внешние UI библиотеки (Material-UI, Ant Design и т.д.)

---

## 📊 ПРИОРИТЕТЫ РАЗРАБОТКИ

### 1 место: **РАБОТА И СТАБИЛЬНОСТЬ**
- Всё должно работать без ошибок
- Данные должны сохраняться в localStorage
- API-запросы должны обрабатывать ошибки

### 2 место: **ТИПИЗАЦИЯ**
- TypeScript интерфейсы для всего
- Нет `any` типов
- Строгая типизация функций

### 3 место: **ЭКОНОМИЯ API-ЗАПРОСОВ**
- Локальная валидация перед API
- Ограничение истории чата
- Отслеживание лимитов

### 4 место: **UX И ДИЗАЙН**
- Хороший UI с Tailwind CSS
- Отзывчивость интерфейса
- Понятные сообщения пользователю

### 5 место: **ОПТИМИЗАЦИЯ**
- Быстрые рендеры (useMemo, useCallback)
- Эффективная работа с localStorage
- Минимальный bundle size

---

## 🔑 КЛЮЧЕВЫЕ ФАЙЛЫ

| Файл | Зачем | Как открывать |
|------|-------|---|
| `App.tsx` | Главный компонент, состояние | Первый файл при анализе |
| `constants.ts` | SYSTEM_PROMPT, начальные данные | При изменении поведения AI |
| `types.ts` | TypeScript интерфейсы | При добавлении новых типов |
| `.env` | API ключ Gemini | При настройке API |
| `components/` | React компоненты | При разработке UI |
| `services/` | Бизнес-логика | При добавлении функционала |
| `lessons.json` | Данные уроков | При изменении контента |

---

## 🔧 КОМАНДЫ РАЗРАБОТКИ

```bash
# Установка зависимостей
npm install

# Разработка (с hot reload)
npm run dev
# → http://localhost:5173

# Сборка для production
npm run build

# Предпросмотр сборки
npm run preview
```

---

## 📦 СТРУКТУРА LOCALSTORAGE

### Ключи для хранения:

```typescript
// Основные данные
'german_lessons_v1'                 // Lesson[]
'lesson_{lessonId}_progress'        // LessonProgress
'vocabulary_stats_{lessonId}'       // VocabStats[]
'spaced_repetition_{lessonId}'      // SpacedRepetitionData[]
'difficult_words_{lessonId}'        // string[]

// Счётчики
'api_requests_count'                // {count: number, date: string}
```

### Максимальные размеры:
- Каждый ключ: до 1MB (обычно 10-100KB)
- Всего localStorage: 5-10MB на домен
- Уроков: лимита нет, но не более 100-200 реалистично

---

## 🎯 ПРИМЕРЫ ПРАВИЛЬНОГО КОДА

### Компонент с сохранением:

```typescript
import React, { useState, useEffect } from 'react'
import { Lesson, LessonProgress } from '../types'

interface MyComponentProps {
  lesson: Lesson
  onNext: () => void
}

const MyComponent: React.FC<MyComponentProps> = ({ lesson, onNext }) => {
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка из localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`lesson_${lesson.lesson_id}_progress`)
    if (stored) {
      setProgress(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [lesson.lesson_id])

  // Сохранение в localStorage
  useEffect(() => {
    if (progress) {
      localStorage.setItem(
        `lesson_${lesson.lesson_id}_progress`,
        JSON.stringify(progress)
      )
    }
  }, [progress, lesson.lesson_id])

  const handleNext = () => {
    setProgress(prev => ({
      ...prev,
      currentTaskIdx: prev!.currentTaskIdx + 1
    }))
    onNext()
  }

  if (isLoading) return <div>Загрузка...</div>

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* UI здесь */}
      <button onClick={handleNext}>Далее</button>
    </div>
  )
}

export default MyComponent
```

### Сервис с обработкой ошибок:

```typescript
export const myService = {
  async getResponse(data: MyType): Promise<MyResult> {
    try {
      // Локальная проверка
      const localResult = validateLocally(data)
      if (localResult) {
        return localResult  // БЕЗ API
      }

      // API запрос
      trackAPIRequest()
      const response = await fetchFromAPI(data)
      
      return response
    } catch (error: any) {
      const message = error?.message || JSON.stringify(error)
      
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Лимит API исчерпан')
      }
      
      console.error('❌ Ошибка сервиса:', error)
      throw error
    }
  }
}
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Проверка localStorage в браузере:

```javascript
// Открыть F12 → Console и выполнить:

// Показать все ключи
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key))
})

// Проверить конкретный ключ
localStorage.getItem('german_lessons_v1')

// Очистить ВСЕ данные
localStorage.clear()

// Проверить счётчик API
JSON.parse(localStorage.getItem('api_requests_count'))
```

### Проверка компонента:

1. Открыть DevTools (F12)
2. Перейти на вкладку Console
3. Искать ошибки (красные сообщения)
4. Проверить Application → LocalStorage
5. Убедиться, что данные сохраняются

---

## 🚨 ЧАСТЫЕ ОШИБКИ

### 1. Забыли сохранить в localStorage
```typescript
// ❌ НЕПРАВИЛЬНО
setProgress(newProgress)  // В памяти, но не в localStorage!

// ✅ ПРАВИЛЬНО
setProgress(newProgress)
useEffect(() => {
  localStorage.setItem('key', JSON.stringify(newProgress))
}, [newProgress])
```

### 2. Использовали API без локальной валидации
```typescript
// ❌ НЕПРАВИЛЬНО
const response = await getTutorResponse(...)

// ✅ ПРАВИЛЬНО
const validation = validateAnswer(userAnswer, correct)
if (validation && !validation.shouldCallAPI) return validation.message
const response = await getTutorResponse(...)
```

### 3. Написали long answer при правильном ответе
```typescript
// ❌ НЕПРАВИЛЬНО
"✅ Верно! Отличный ответ! Вы правильно использовали..."

// ✅ ПРАВИЛЬНО
"✅ Верно!"
"✅ Верно! Хороший порядок слов."
```

---

## 📞 КОГДА ОБРАЩАТЬСЯ К CLAUDE

- **❓ Как добавить новую фичу?** → Посмотри `context.md`
- **❓ Как писать компоненты?** → Посмотри `.claude/patterns/component-patterns.md`
- **❓ Как работает Spaced Repetition?** → Посмотри `.claude/services-config/spaced-repetition-config.md`
- **❓ Как настроить Gemini API?** → Посмотри `.claude/services-config/gemini-api-config.md`
- **❓ Как улучшить AI-репетитора?** → Посмотри `.claude/system-prompts/main-tutor-prompt.md`

---

## ✨ РЕЗЮМЕ

```
1. ✅ TypeScript везде (нет any)
2. ✅ localStorage для всего (нет потерь данных)
3. ✅ Локальная валидация перед API
4. ✅ try-catch для всех API-запросов
5. ✅ Функциональные компоненты + Hooks
6. ✅ КРАТКОСТЬ при правильном ответе
7. ✅ Tailwind CSS для стилизации
8. ✅ Обработка ошибок и граничных случаев
```

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Актуально ✅
