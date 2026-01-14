# 🔄 Миграция на новый AI сервис

## Что нужно изменить

### 1. Обновить импорты

**В файле `components/TutorChat.tsx`:**

Заменить:
```typescript
import { getTutorResponse, getGeneralResponse } from '../services/geminiService';
```

На:
```typescript
import { getTutorResponse, getGeneralResponse } from '../services/aiService';
```

### 2. Добавить компонент статуса в App.tsx

**В файле `App.tsx`:**

Добавить импорт:
```typescript
import { AIProviderStatus } from './components/AIProviderStatus';
```

Добавить компонент в JSX (в конце, перед закрывающим тегом):
```typescript
return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    {/* ... существующий код ... */}
    
    {/* Добавить в самом конце */}
    <AIProviderStatus />
  </div>
);
```

### 3. Обновить .env файл

Добавить OpenAI ключ:
```bash
VITE_GEMINI_API_KEY=your_existing_gemini_key
VITE_OPENAI_API_KEY=your_openai_key_here
```

### 4. Установить зависимости (если нужно)

OpenAI SDK уже не нужен, мы используем Fetch API!

Проверьте что установлен Google Genai:
```bash
npm list @google/genai
```

Если нет:
```bash
npm install @google/genai
```

---

## Быстрая миграция (5 минут)

### Шаг 1: Найти и заменить
```bash
# В корне проекта
find ./components -name "*.tsx" -exec sed -i 's/geminiService/aiService/g' {} +
find ./components -name "*.ts" -exec sed -i 's/geminiService/aiService/g' {} +
```

Или вручную в редакторе:
- Найти: `from '../services/geminiService'`
- Заменить: `from '../services/aiService'`

### Шаг 2: Добавить компонент статуса

В `App.tsx` в конце перед `</div>`:
```typescript
<AIProviderStatus />
```

### Шаг 3: Обновить .env

Добавить строку:
```bash
VITE_OPENAI_API_KEY=sk-...your_key
```

### Шаг 4: Перезапустить

```bash
npm run dev
```

---

## Проверка миграции

### ✅ Чеклист

- [ ] Импорты обновлены с `geminiService` на `aiService`
- [ ] Компонент `AIProviderStatus` добавлен в `App.tsx`
- [ ] `.env` содержит оба ключа
- [ ] Dev сервер перезапущен
- [ ] Приложение запускается без ошибок
- [ ] Индикатор AI провайдера виден в правом нижнем углу
- [ ] Клик по индикатору показывает детали

### 🧪 Тестирование

1. Отправьте сообщение в чат
2. Проверьте консоль - должно быть `🤖 Попытка 1: используем gemini`
3. Если всё работает - миграция успешна! ✅

---

## Откат назад

Если что-то пошло не так:

### Шаг 1: Откатить импорты
```typescript
// Вернуть обратно
import { getTutorResponse } from '../services/geminiService';
```

### Шаг 2: Удалить компонент
```typescript
// Удалить из App.tsx
// <AIProviderStatus />
```

### Шаг 3: Перезапустить
```bash
npm run dev
```

---

## Файлы которые нужно изменить

### Обязательные изменения:

1. **`components/TutorChat.tsx`** - импорт
2. **`App.tsx`** - добавить `<AIProviderStatus />`
3. **`.env`** - добавить OpenAI ключ

### Возможные дополнительные файлы:

Если у вас есть другие компоненты использующие AI:
- `components/LessonGenerator.tsx`
- `components/QuizGenerator.tsx`
- Любые другие файлы импортирующие `geminiService`

Используйте поиск по проекту:
```bash
grep -r "geminiService" ./components
grep -r "geminiService" ./services
```

---

## Готово! 🎉

После миграции вы получите:
- ✅ Автоматическое переключение между Gemini и OpenAI
- ✅ Визуальный индикатор статуса провайдеров
- ✅ Защита от исчерпания лимитов
- ✅ Логирование всех переключений
- ✅ Возможность сброса состояния

**Время миграции: ~5 минут**  
**Сложность: Лёгкая** ⭐
