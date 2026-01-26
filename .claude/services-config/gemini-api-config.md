# 🤖 Gemini API Config - Конфигурация Google Gemini

> Конфигурационные параметры для работы с Google Gemini API

---

## 📌 Основные параметры

### Model (Модель)
```
Значение: "gemini-2.0-flash"
Тип: string
Назначение: Быстрая и эффективная модель Gemini
```

**Почему эта модель?**
- ✅ Быстрая (perfect для chat)
- ✅ Недорогая (экономит квоту)
- ✅ Хорошего качества (понимает контекст)
- ✅ Поддерживает system instructions

**Альтернативы:**
- `gemini-pro` — более мощная, медленнее
- `gemini-1.5-flash` — предыдущая версия

---

### Temperature (Креативность)
```
Значение: 0.7
Диапазон: 0.0 - 1.0
Назначение: Контроль креативности ответов
```

**Что это означает?**
- **0.0** = Детерминированные ответы (всегда одно и то же)
- **0.3-0.5** = Точные ответы (для фактических данных)
- **0.7** = Сбалансированные ответы (текущее значение)
- **0.9-1.0** = Креативные ответы (много вариативности)

**Почему 0.7?**
- Достаточно вариативности (разные способы объяснения)
- Но остаётся точность (не случайные галлюцинации)
- Идеально для образовательного контента

**Как менять:**
```typescript
// В geminiService.ts
const response = await client.generateContent({
  generationConfig: {
    temperature: 0.7,  // ← ИЗМЕНИ ЗДЕСЬ
  },
  // ...
})
```

---

### Top-P (Вариативность)
```
Значение: 0.95
Диапазон: 0.0 - 1.0
Назначение: Контроль вариативности токенов
```

**Что это означает?**
- Работает вместе с Temperature
- Контролирует, какой процент токенов рассматривать
- 0.95 = рассмотри 95% вероятных продолжений

**Обычно:** Не трогайте, оставьте 0.95

---

### Top-K (Количество кандидатов)
```
Значение: 40
Тип: integer
Назначение: Максимум токенов для рассмотрения
```

**Что это означает?**
- Рассмотри топ-40 вероятных токенов
- Меньше = более детерминировано
- Больше = более креативно

**Обычно:** Не трогайте, оставьте 40

---

### Max Tokens (Максимум токенов в ответе)
```
Значение: 1000
Тип: integer
Назначение: Максимальная длина ответа
```

**Почему 1000?**
- Достаточно для подробного объяснения
- Не слишком много (экономит квоту)
- Защита от бесконечных ответов

**Как менять:**
```typescript
generationConfig: {
  maxOutputTokens: 1000,  // ← ИЗМЕНИ ЗДЕСЬ
}
```

**Примеры использования:**
- 100-200 токенов = очень краткий ответ (1-2 предложения)
- 500 токенов = средний ответ (5-10 предложений)
- 1000 токенов = полный ответ (с примерами)

---

## 🔐 API Key

### Получение ключа

1. Перейди на https://aistudio.google.com/
2. Нажми "Get API key"
3. Выбери проект или создай новый
4. Скопируй ключ

### Где использовать

```typescript
// .env
VITE_GEMINI_API_KEY=your_key_here
```

```typescript
// geminiService.ts
const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const client = new GoogleGenerativeAI(apiKey)
```

### Безопасность

⚠️ **ВАЖНО:**
- ❌ Не коммитьте .env в git
- ❌ Не показывайте ключ никому
- ❌ Используйте ключ только на серверной части (если возможно)
- ✅ Используйте environment variables
- ✅ Регулярно проверяйте использование в console Google Cloud

---

## 📝 System Instruction

```
Назначение: Инструкция для AI (находится в constants.ts)
Размер: ~3000 символов
Обновляется: В файле .claude/system-prompts/main-tutor-prompt.md
```

**Как использовать:**

```typescript
// geminiService.ts
import { SYSTEM_PROMPT } from '../constants'

const response = await client.generateContent({
  systemInstruction: SYSTEM_PROMPT,  // ← ИСПОЛЬЗУЕТ СИСТЕМУ
  contents: [...]
})
```

---

## 💬 Chat History (История сообщений)

```
Параметр: history
Максимум: 3 сообщения
Назначение: Контекст для AI
```

**Почему только 3?**
- ✅ Экономит токены
- ✅ Достаточно для контекста
- ✅ Быстрее обрабатывается

**Как это работает:**

```typescript
// Сохраняем последние 3 сообщения
const history = messages.slice(-3)

const response = await client.generateContent({
  contents: [
    ...history,
    { role: 'user', parts: [{ text: currentMessage }] }
  ]
})
```

**Если нужно больше контекста:**
- Увеличьте `.slice(-5)` на `.slice(-10)`
- Но имейте в виду: больше токенов = дороже

---

## ⏱️ Timeout (Время ожидания)

```
Значение: 30 секунд (обычно автоматическое)
Назначение: Максимальное время ответа API
```

**Если API медленный:**
```typescript
// Добавить timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 30000)
)

const response = await Promise.race([
  client.generateContent(...),
  timeoutPromise
])
```

---

## 🚨 Обработка ошибок

### Основные ошибки

| Ошибка | Что означает | Что делать |
|--------|--------------|-----------|
| 429 | Rate limit | Подождите или используйте локальную валидацию |
| 403 | Неправильный API ключ | Проверьте .env |
| 400 | Неправильный запрос | Проверьте формат запроса |
| RESOURCE_EXHAUSTED | Квота исчерпана | Попробуйте завтра |

### Как обрабатывать

```typescript
try {
  const response = await client.generateContent({...})
  return response.text()
} catch (error: any) {
  const message = error?.message || JSON.stringify(error)
  
  if (message.includes('429')) {
    throw new Error('Rate limit. Используй локальную валидацию')
  }
  
  if (message.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('API квота исчерпана. Попробуй завтра')
  }
  
  if (message.includes('403') || message.includes('API_KEY')) {
    throw new Error('Проблема с API ключом. Проверь .env')
  }
  
  console.error('❌ Ошибка Gemini:', error)
  throw error
}
```

---

## 📊 Примеры конфигураций

### Конфиг 1: Быстрый и экономный (текущий)

```typescript
const generationConfig = {
  temperature: 0.7,
  maxOutputTokens: 1000,
  topP: 0.95,
  topK: 40,
}
```

**Для:** Обычные ответы репетитора

---

### Конфиг 2: Более творческий

```typescript
const generationConfig = {
  temperature: 0.85,  // Более креативный
  maxOutputTokens: 1500,  // Больше токенов
  topP: 0.95,
  topK: 50,  // Больше вариантов
}
```

**Для:** Когда нужны более разнообразные ответы

---

### Конфиг 3: Точный и краткий

```typescript
const generationConfig = {
  temperature: 0.3,  // Менее креативный
  maxOutputTokens: 500,  // Меньше токенов
  topP: 0.9,
  topK: 20,  // Меньше вариантов
}
```

**Для:** Когда нужны точные ответы

---

## 🔄 Как менять конфигурацию

### Шаг 1: Найди параметр в geminiService.ts

```typescript
// geminiService.ts
const generationConfig = {
  temperature: 0.7,  // ← ТВОЙ ПАРАМЕТР ЗДЕСЬ
  maxOutputTokens: 1000,
  // ...
}
```

### Шаг 2: Измени значение

```typescript
const generationConfig = {
  temperature: 0.85,  // ← НОВОЕ ЗНАЧЕНИЕ
  maxOutputTokens: 1000,
}
```

### Шаг 3: Сохрани и протестируй

```bash
npm run dev
# Протестируй в приложении
```

### Шаг 4: Если не нравится, верни обратно

```bash
git checkout services/geminiService.ts
```

---

## 📚 Документация

- **Google Gemini API:** https://ai.google.dev/
- **API Reference:** https://ai.google.dev/api/rest
- **Models:** https://ai.google.dev/models
- **Pricing:** https://ai.google.dev/pricing

---

## ⚡ Tips & Tricks

### 1. Сэкономить токены
```typescript
// ✅ Ограничь историю
const history = messages.slice(-3)

// ✅ Уменьши maxOutputTokens
maxOutputTokens: 500,  // вместо 1000

// ✅ Используй локальную валидацию перед API
if (validationService.validateAnswer(...)) {
  return // БЕЗ API!
}
```

### 2. Улучшить качество ответов
```typescript
// ✅ Улучши System Prompt
// Смотри .claude/system-prompts/main-tutor-prompt.md

// ✅ Добавь контекст в запрос
const prompt = `
Контекст: ${JSON.stringify(lessonContext)}
Вопрос: ${userQuestion}
`
```

### 3. Обработать ошибки

```typescript
// ✅ Всегда используй try-catch
try {
  const response = await getTutorResponse(...)
} catch (error) {
  // Обработай ошибку
}
```

---

## 🎓 Для новичков

Google Gemini API — это сервис, который:

1. **Получает запрос** от твоего приложения
2. **Обрабатывает** его AI модель
3. **Возвращает ответ**

Параметры в конфиге контролируют **как** AI будет отвечать:
- Temperature = насколько креативный
- MaxTokens = насколько длинный ответ
- History = сколько контекста учитывать

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Готово к использованию ✅
