# 🤖 Автоматическое переключение AI провайдеров

## Обзор

Приложение теперь поддерживает **автоматическое переключение** между AI провайдерами:
- **Gemini** (Google) - основной провайдер
- **OpenAI** (GPT-4) - резервный провайдер

Если у Gemini исчерпан лимит запросов, система автоматически переключится на OpenAI.

---

## 🚀 Быстрый старт

### 1. Настройте API ключи

Создайте или обновите файл `.env`:

```bash
# Основной провайдер
VITE_GEMINI_API_KEY=your_gemini_key_here

# Резервный провайдер (опционально, но рекомендуется)
VITE_OPENAI_API_KEY=your_openai_key_here
```

### 2. Получите API ключи

**Google Gemini:**
1. Перейдите на https://aistudio.google.com/
2. Войдите с Google аккаунтом
3. Нажмите "Get API key"
4. Скопируйте ключ в `.env`

**OpenAI:**
1. Перейдите на https://platform.openai.com/api-keys
2. Войдите или создайте аккаунт
3. Нажмите "Create new secret key"
4. Скопируйте ключ в `.env`

### 3. Перезапустите сервер

```bash
npm run dev
```

---

## 📊 Как это работает

### Логика переключения

```
1. Попытка использовать Gemini
   ├─ Успех → Ответ пользователю
   └─ Ошибка (quota/rate limit)
       ├─ Счётчик ошибок +1
       └─ Если ошибок ≥ 3
           ├─ Пометить Gemini недоступным
           └─ Переключиться на OpenAI
               ├─ Успех → Ответ пользователю
               └─ Ошибка → Сообщение об ошибке
```

### Типы ошибок, вызывающих переключение

- `quota exceeded` - исчерпан лимит запросов
- `rate limit` - превышена частота запросов
- `429` - HTTP код "Too Many Requests"
- `Resource has been exhausted` - ресурс исчерпан

### Что НЕ вызывает переключение

- Проблемы с сетью
- Некорректный API ключ
- Ошибки валидации
- Таймауты

---

## 🎛️ Компонент статуса провайдера

### Визуальный индикатор

В правом нижнем углу приложения отображается компактный индикатор:

```
🟢 AI: Gemini  ▼
```

### Расширенная информация

Кликните на индикатор чтобы увидеть:

- **Текущий активный провайдер**
- **Статус всех провайдеров:**
  - Available / Unavailable
  - Наличие API ключа
  - Количество ошибок
  - Последняя ошибка
- **Кнопки управления:**
  - 🔄 Обновить - обновить статус
  - ↺ Сбросить - сбросить счётчики ошибок

---

## 🔧 Использование в коде

### Импорт

Старый код (только Gemini):
```typescript
import { getTutorResponse } from './services/geminiService';
```

Новый код (с автопереключением):
```typescript
import { getTutorResponse } from './services/aiService';
```

### API остался прежним

```typescript
// Всё работает как раньше!
const response = await getTutorResponse(
  lesson,
  currentExerciseIndex,
  currentTaskIndex,
  userAnswer,
  history
);
```

### Дополнительные функции

```typescript
import { getProviderInfo, resetProviders } from './services/aiService';

// Получить информацию о провайдерах
const info = getProviderInfo();
console.log('Текущий провайдер:', info.current);
console.log('Доступные провайдеры:', info.providers);

// Сбросить счётчики ошибок
resetProviders();
```

---

## ⚙️ Конфигурация

### Максимальное количество ошибок

По умолчанию: **3 ошибки** до переключения провайдера.

Изменить в `services/aiService.ts`:
```typescript
const MAX_ERRORS = 3; // Измените на нужное значение
```

### Порядок провайдеров

По умолчанию: **Gemini → OpenAI**

Изменить в `services/aiService.ts`:
```typescript
let currentProvider: AIProvider = 'gemini'; // Начальный провайдер

const getNextProvider = (currentProvider: AIProvider): AIProvider | null => {
  const providerList: AIProvider[] = ['gemini', 'openai']; // Порядок
  // ...
};
```

### Модели AI

**Gemini:**
- Модель: `gemini-2.0-flash`
- Температура: `0.7`

**OpenAI:**
- Модель: `gpt-4o-mini` (быстрая и дешёвая)
- Альтернатива: `gpt-4o` (более качественная)
- Температура: `0.7`
- Max tokens: `1000`

Изменить в `services/aiService.ts`:
```typescript
// Для Gemini
const model = 'gemini-2.0-flash'; // или 'gemini-1.5-pro'

// Для OpenAI
model: 'gpt-4o-mini', // или 'gpt-4o', 'gpt-3.5-turbo'
```

---

## 💰 Стоимость и лимиты

### Google Gemini

**Бесплатный тарифный план:**
- 15 запросов в минуту
- 1,500 запросов в день
- 1 миллион токенов в месяц

**Платный тарифный план (Pay-as-you-go):**
- $0.000125 за 1K символов ввода
- $0.000375 за 1K символов вывода

### OpenAI

**Тарифы GPT-4o-mini:**
- $0.150 за 1M токенов ввода
- $0.600 за 1M токенов вывода

**Тарифы GPT-4o:**
- $2.50 за 1M токенов ввода
- $10.00 за 1M токенов вывода

**Лимиты (зависят от уровня аккаунта):**
- Tier 1 (новый): 500 RPM, 200K TPM
- Tier 2: 5,000 RPM, 2M TPM
- И так далее...

---

## 🧪 Тестирование

### Проверить переключение провайдеров

1. **Настройте только Gemini ключ:**
```bash
VITE_GEMINI_API_KEY=your_key
# VITE_OPENAI_API_KEY= # закомментировано
```

2. **Сделайте много запросов:**
Отправьте 20-30 сообщений подряд

3. **Наблюдайте в консоли:**
```
🤖 Попытка 1: используем gemini
⚠️ Провайдер gemini ошибка #1: quota exceeded
🔄 Переключение с gemini на openai
❌ Нет доступных провайдеров!
```

### Проверить индикатор статуса

1. Откройте приложение
2. Кликните на индикатор в правом нижнем углу
3. Проверьте статусы провайдеров
4. Нажмите "Сбросить" - счётчики обнулятся

---

## 🐛 Troubleshooting

### Проблема: "Нет доступных провайдеров"

**Причина:** Оба ключа недоступны или исчерпан лимит

**Решение:**
1. Проверьте `.env` файл - есть ли ключи?
2. Проверьте консоль - какие ошибки?
3. Откройте статус провайдера - какие провайдеры available?
4. Нажмите "Сбросить" в статусе провайдера
5. Подождите восстановления лимита (обычно 1 минута)

### Проблема: Всегда используется OpenAI

**Причина:** Gemini ключ некорректный или недоступен

**Решение:**
1. Проверьте `VITE_GEMINI_API_KEY` в `.env`
2. Убедитесь что ключ активен в Google AI Studio
3. Проверьте лимиты в Google AI Studio
4. Нажмите "Сбросить" в статусе провайдера

### Проблема: Переключение не работает

**Причина:** OpenAI ключ отсутствует

**Решение:**
1. Добавьте `VITE_OPENAI_API_KEY` в `.env`
2. Перезапустите dev сервер
3. Проверьте статус в индикаторе

### Проблема: Частое переключение

**Причина:** Нестабильное соединение или низкие лимиты

**Решение:**
1. Увеличьте `MAX_ERRORS` в `aiService.ts`
2. Добавьте retry логику с задержкой
3. Проверьте лимиты API

---

## 📝 Логирование

### В консоли разработчика

```typescript
// При каждом запросе
🤖 Попытка 1: используем gemini
✅ Успешный ответ от gemini

// При ошибке
❌ Ошибка gemini: quota exceeded
⚠️ Провайдер gemini ошибка #1: quota exceeded
⚠️ Лимит исчерпан для gemini

// При переключении
🔄 Переключение с gemini на openai
🤖 Попытка 2: используем openai
✅ Успешный ответ от openai

// При критической ошибке
❌ Провайдер gemini помечен как недоступный
❌ Нет доступных провайдеров!
```

### Включить детальное логирование

В `aiService.ts` добавьте:
```typescript
const DEBUG = true;

if (DEBUG) {
  console.log('📤 Отправка запроса:', messages);
  console.log('📊 Статус провайдеров:', getProviderInfo());
}
```

---

## 🔐 Безопасность

### Не коммитьте API ключи

**Всегда проверяйте `.gitignore`:**
```
.env
.env.local
.env.*.local
```

### Используйте .env.example

Для других разработчиков:
```bash
# .env.example
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_OPENAI_API_KEY=your_openai_key_here
```

### Ограничьте ключи

В Google AI Studio и OpenAI:
- Установите лимиты использования
- Ограничьте по IP (если возможно)
- Используйте отдельные ключи для dev/prod

---

## 🚀 Продакшн

### Переменные окружения

В продакшн используйте переменные окружения платформы:

**Vercel:**
```bash
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_OPENAI_API_KEY
```

**Netlify:**
```bash
netlify env:set VITE_GEMINI_API_KEY your_key
netlify env:set VITE_OPENAI_API_KEY your_key
```

**Railway/Render:**
Добавьте в Environment Variables в панели управления

### Мониторинг

Добавьте логирование в продакшн:
```typescript
import * as Sentry from '@sentry/react';

Sentry.captureMessage('AI Provider switched', {
  level: 'info',
  extra: { from: 'gemini', to: 'openai' }
});
```

---

## 📚 Дополнительные ресурсы

### Документация API

- [Google Gemini API](https://ai.google.dev/docs)
- [OpenAI API](https://platform.openai.com/docs)

### Управление лимитами

- [Gemini Pricing](https://ai.google.dev/pricing)
- [OpenAI Pricing](https://openai.com/pricing)

### Лучшие практики

- [Gemini Best Practices](https://ai.google.dev/docs/best_practices)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

---

## 🎯 Roadmap

### Планируемые улучшения

- [ ] Добавить Anthropic Claude как 3-й провайдер
- [ ] Умное переключение по качеству ответа
- [ ] Кэширование ответов
- [ ] Rate limiting на клиенте
- [ ] A/B тестирование провайдеров
- [ ] Метрики использования в UI
- [ ] Автоматический выбор оптимального провайдера

---

**Автор:** Claude (Anthropic)  
**Дата:** 14 января 2026  
**Версия:** 1.0
