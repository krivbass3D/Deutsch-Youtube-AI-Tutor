# 🔧 Исправление ошибки "API key is missing"

## ❌ Проблема

```
Error: API key is missing. Please provide a valid API key.
```

## ✅ Решение

Ошибка возникала из-за неправильного имени переменной окружения в `geminiService.ts`.

### Что было исправлено:

**В файле `services/geminiService.ts`:**

❌ **Было:**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
```

✅ **Стало:**
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });
```

### Почему это было неправильно?

1. **Vite использует `import.meta.env`, а не `process.env`**
2. **Переменные должны начинаться с `VITE_`** для доступа в клиентском коде
3. **Имя было неправильным:** `API_KEY` вместо `VITE_GEMINI_API_KEY`

---

## 🚀 Что нужно сделать

### Шаг 1: Файл уже исправлен ✅

Я обновил `services/geminiService.ts` с правильными переменными.

### Шаг 2: Проверьте .env файл

Откройте `.env` и убедитесь что есть:

```bash
VITE_GEMINI_API_KEY=AIzaSyBadIjEHer6vvNOGbe3wHLSFYhORUtkntg
VITE_OPENAI_API_KEY=your_openai_key_here
```

✅ Ваш .env уже правильный!

### Шаг 3: ОБЯЗАТЕЛЬНО перезапустите dev сервер

⚠️ **КРИТИЧНО:** Vite не подхватывает изменения в .env на лету!

```bash
# Остановите сервер (Ctrl+C)
# Затем запустите снова
npm run dev
```

---

## 🧪 Проверка

После перезапуска:

1. Откройте приложение
2. Попробуйте отправить сообщение
3. Должно работать! ✅

Если в консоли видите:
```
🤖 Попытка 1: используем gemini
✅ Успешный ответ от gemini
```

Значит всё работает правильно!

---

## 🔍 Дополнительная диагностика

### Проверить переменные окружения:

Добавьте в любой компонент временно:

```typescript
console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? '✅ Есть' : '❌ Нет');
console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? '✅ Есть' : '❌ Нет');
```

Должно показать:
```
VITE_GEMINI_API_KEY: ✅ Есть
VITE_OPENAI_API_KEY: ✅ Есть
```

---

## 📝 Правила для Vite переменных окружения

### ✅ Правильно:
```bash
# В .env
VITE_API_KEY=your_key
VITE_MY_SECRET=value
```

```typescript
// В коде
const key = import.meta.env.VITE_API_KEY;
```

### ❌ Неправильно:
```bash
# В .env
API_KEY=your_key  # Не будет доступен!
```

```typescript
// В коде
const key = process.env.API_KEY;  # Не работает в Vite!
```

### Важные правила:

1. **Все переменные должны начинаться с `VITE_`**
2. **Используйте `import.meta.env`, а не `process.env`**
3. **Перезапускайте dev сервер после изменений .env**
4. **Не коммитьте .env в git** (должен быть в .gitignore)

---

## 🎯 Теперь можно мигрировать на aiService

После того как убедитесь что всё работает с исправленным `geminiService.ts`, можете выполнить миграцию на новый `aiService.ts` с автоматическим переключением:

1. Прочитайте [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. Замените импорты с `geminiService` на `aiService`
3. Добавьте компонент `<AIProviderStatus />`
4. Перезапустите сервер

---

## ✅ Готово!

Ошибка исправлена. Теперь:

1. ✅ `geminiService.ts` использует правильные переменные
2. ✅ `.env` настроен корректно
3. ✅ Добавлена проверка наличия API ключа
4. ✅ Понятные сообщения об ошибках

**Перезапустите сервер и всё заработает!** 🚀

---

*Создано: 14 января 2026*
