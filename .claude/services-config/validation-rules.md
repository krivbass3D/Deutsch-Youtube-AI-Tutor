# ✅ Validation Rules - Правила локальной валидации

> Правила, по которым приложение проверяет ответы БЕЗ обращения к API

---

## 🎯 Что такое локальная валидация?

**Локальная валидация** — это проверка ответа ученика **в браузере**, без отправки в Gemini API.

**Преимущества:**
- ✅ Быстро (мгновенный результат)
- ✅ Экономит API квоту
- ✅ Работает офлайн
- ✅ Не нужно ждать ответа сервера

**Как используется:**

```typescript
// TutorChat.tsx
const validation = validateAnswer(userAnswer, correctAnswers)

if (validation && !validation.shouldCallAPI) {
  // Ответ проверен локально, API не нужен!
  return validation.message
}

// Если локально не удалось, тогда вызываем API
const response = await getTutorResponse(...)
```

---

## 📋 Основные правила валидации

### Правило 1: Точное совпадение

```
Сравнение: userAnswer === correctAnswer (после нормализации)

Примеры:
✅ "das Haus" == "das Haus" → ПРАВИЛЬНО
✅ "Haus" == "das Haus" → Зависит от правила 2

Нормализация (что удаляется):
- Пробелы в начале и конце (trim)
- Различие в капитализации (toLowerCase)
- Лишние пробелы между словами
```

**Как работает:**

```typescript
function normalizeAnswer(answer: string): string {
  return answer
    .trim()                      // Удали пробелы в начале/конце
    .toLowerCase()               // Переведи в нижний регистр
    .replace(/\s+/g, ' ')        // Замени множественные пробелы на один
    .replace(/[,;.!?]/g, '')     // Удали пунктуацию
}

const userNormalized = normalizeAnswer(userAnswer)
const correctNormalized = normalizeAnswer(correctAnswer)

if (userNormalized === correctNormalized) {
  return { isCorrect: true, message: '✅ Верно!' }
}
```

---

### Правило 2: Совпадение без артиклей

```
Сравнение: Удали артикли и сравни

Артикли для удаления:
- Определённые: der, die, das, den, dem, des, denen
- Неопределённые: ein, eine, einen, einem, eines, einer
- Отрицательные: kein, keine, keinen, keinem, keines, keiner

Примеры:
✅ "Haus" == "das Haus" → ПРАВИЛЬНО (без артикля совпадают)
✅ "schöne Katze" == "die schöne Katze" → ПРАВИЛЬНО
❌ "Hund" == "das Haus" → НЕПРАВИЛЬНО (разные слова)

Когда использовать:
- Когда в упражнении может быть "das Haus" или просто "Haus"
- Когда артикль не критичен для ответа
```

**Как работает:**

```typescript
function removeArticles(text: string): string {
  const articles = [
    'der', 'die', 'das', 'den', 'dem', 'des',
    'ein', 'eine', 'einen', 'einem', 'eines', 'einer',
    'kein', 'keine', 'keinen', 'keinem', 'keines', 'keiner'
  ]
  
  let result = text
  articles.forEach(article => {
    result = result.replace(new RegExp(`\\b${article}\\b`, 'gi'), '')
  })
  
  return result.trim().replace(/\s+/g, ' ')
}

const userWithoutArticles = removeArticles(userNormalized)
const correctWithoutArticles = removeArticles(correctNormalized)

if (userWithoutArticles === correctWithoutArticles) {
  return { isCorrect: true, message: '✅ Верно!' }
}
```

---

### Правило 3: Множественные правильные ответы

```
Сравнение: Проверить все варианты правильных ответов

Примеры:
Задание: "Как говорится на немецком?"
Правильные ответы: ["Guten Tag", "Guten Tag!"]
Ученик написал: "Guten Tag"
→ ПРАВИЛЬНО (совпадает с одним из вариантов)

Когда использовать:
- Когда есть несколько правильных вариантов
- Когда ответ может отличаться пунктуацией
```

**Как работает:**

```typescript
function validateAnswer(
  userAnswer: string,
  correctAnswers: string[]  // МАССИВ правильных ответов!
): boolean {
  const userNormalized = normalizeAnswer(userAnswer)
  
  for (const correctAnswer of correctAnswers) {
    const correctNormalized = normalizeAnswer(correctAnswer)
    
    if (userNormalized === correctNormalized) {
      return true  // Найдено совпадение!
    }
  }
  
  return false  // Ничего не совпадает
}
```

---

### Правило 4: Синонимы

```
⚠️ Статус: СЛОЖНО РЕАЛИЗОВАТЬ локально

Примеры:
"freund" == "kumpel" (оба = друг) → Требует словаря синонимов
"schön" == "wunderschön" → Частичное совпадение

Решение:
Если нужны синонимы → используй API (Gemini поймёт контекст)

Локальное решение (если критично):
```

```typescript
// Словарь синонимов (только основные)
const synonyms: Record<string, string[]> = {
  'freund': ['kamerad', 'kumpel'],
  'schön': ['wunderschön', 'herrlich'],
  // ...добавляй по необходимости
}

function checkSynonyms(userWord: string, correctWord: string): boolean {
  if (synonyms[correctWord]?.includes(userWord)) {
    return true
  }
  return false
}
```

---

## 🔄 Процесс валидации

### Шаг 1: Нормализация

```
Исходный ответ: "  Das Haus!  "
↓
Нормализованный: "das haus"
```

### Шаг 2: Точное совпадение

```
Проверить: "das haus" == "das haus"
Результат: ✅ НАЙДЕНО
→ Возвращаем результат (БЕЗ API!)
```

### Шаг 3: Если не совпадает, удаляем артикли

```
Проверить: "haus" == "das haus" (без артиклей)
Результат: ✅ НАЙДЕНО
→ Возвращаем результат (БЕЗ API!)
```

### Шаг 4: Если всё ещё не совпадает, вызываем API

```
Ни одно правило не сработало
→ Отправляем в Gemini
→ Gemini решает, правильно ли
```

---

## 📝 Примеры валидации

### Пример 1: Перевод слова

```
Задание: Переведите "das Haus"
Правильный ответ: ["дом", "дома"]

Попытка 1: "дом"
Валидация:
1. Нормализация: "дом" → "дом"
2. Точное совпадение: "дом" == "дом" ✅
Результат: ✅ ПРАВИЛЬНО (БЕЗ API!)

Попытка 2: "  ДОМ  "
Валидация:
1. Нормализация: "  ДОМ  " → "дом"
2. Точное совпадение: "дом" == "дом" ✅
Результат: ✅ ПРАВИЛЬНО (БЕЗ API!)

Попытка 3: "Домик"
Валидация:
1. Нормализация: "Домик" → "домик"
2. Точное совпадение: "домик" == "дом" ❌
3. БЕЗ артиклей: "домик" != "дом" ❌
4. Синонимы: нет
Результат: ❓ НЕИЗВЕСТНО → Вызываем API
```

### Пример 2: Выбор артикля

```
Задание: Дополните "Das ist ___ Haus"
Правильный ответ: "ein"

Попытка 1: "ein"
Валидация:
1. Нормализация: "ein" → "ein"
2. Точное совпадение: "ein" == "ein" ✅
Результат: ✅ ПРАВИЛЬНО (БЕЗ API!)

Попытка 2: "Ein" (с заглавной)
Валидация:
1. Нормализация: "Ein" → "ein"
2. Точное совпадение: "ein" == "ein" ✅
Результат: ✅ ПРАВИЛЬНО (БЕЗ API!)

Попытка 3: "der"
Валидация:
1. Нормализация: "der" → "der"
2. Точное совпадение: "der" == "ein" ❌
3. Без артиклей: не применимо
Результат: ❓ НЕИЗВЕСТНО → Вызываем API
```

### Пример 3: Сложное предложение

```
Задание: Переведите "Ich gehe ins Haus"
Правильный ответ: "Я иду в дом"

Попытка 1: "Я иду в дом"
Валидация:
1. Нормализация: "Я иду в дом" → "я иду в дом"
2. Точное совпадение: "я иду в дом" == "я иду в дом" ✅
Результат: ✅ ПРАВИЛЬНО (БЕЗ API!)

Попытка 2: "я иду домой"
Валидация:
1. Нормализация: "я иду домой" → "я иду домой"
2. Точное совпадение: "я иду домой" == "я иду в дом" ❌
3. Синонимы: нет точного совпадения
Результат: ❓ НЕИЗВЕСТНО → Вызываем API
(Gemini скажет: эти варианты очень похожи, но не совпадают)
```

---

## ⚙️ Конфигурируемые параметры

### Какие артикли удалять?

```typescript
const ARTICLES_TO_REMOVE = [
  'der', 'die', 'das',           // определённые
  'den', 'dem', 'des',           // в разных падежах
  'ein', 'eine',                 // неопределённые
  'einen', 'einem', 'eines',     // в разных падежах
  'kein', 'keine',               // отрицательные
  'keinen', 'keinem', 'keines',
]
```

### Какую пунктуацию удалять?

```typescript
const PUNCTUATION_TO_REMOVE = /[,;.!?\-–—]/g
```

### Использовать ли проверку без артиклей?

```typescript
const IGNORE_ARTICLES = true  // true = применять правило 2
```

---

## 🚀 Как добавить новое правило

### Шаг 1: Определи проблему

```
"Ученики часто пишут... когда нужно..."
```

### Шаг 2: Создай функцию

```typescript
function myNewValidationRule(
  userAnswer: string,
  correctAnswer: string
): boolean {
  // твоя логика здесь
}
```

### Шаг 3: Добавь в процесс валидации

```typescript
export function validateAnswer(
  userAnswer: string,
  correctAnswers: string[]
): ValidationResult | null {
  // ... существующие правила ...
  
  // Новое правило
  for (const correctAnswer of correctAnswers) {
    if (myNewValidationRule(userAnswer, correctAnswer)) {
      return { isCorrect: true, message: '✅ Верно!' }
    }
  }
  
  // ...
}
```

### Шаг 4: Протестируй

```bash
npm run dev
# Протестируй в приложении
```

---

## 📊 Статистика использования

Сколько ответов проверяется локально?

```
Цель: 50-70% ответов должны проверяться локально

Если меньше:
→ Может быть нужны новые правила валидации
→ Добавь синонимы
→ Расширь правила для артиклей

Если больше:
→ Проверь, не слишком ли мягкие правила
→ Убедись, что ошибки не пропускаются
```

---

## 🎓 Для новичков

Локальная валидация — это как проверка в школе:

**Учитель может сам проверить:**
- "Ответ совпадает со списком?" ✅
- "Если без артикля, совпадает?" ✅
- "Это опечатка?" ✅

**Если не может:**
- "Это синоним?"
- "Это может означать то же самое?"
- **→ Обращается к эксперту (Gemini)**

Локальная валидация — это простые проверки. Сложные решает Gemini!

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Готово к использованию ✅
