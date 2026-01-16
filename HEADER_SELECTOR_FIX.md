# 🔧 Исправление: Размещение селектора AI в header

## Проблема
- ChatGPT не появляется в выпадающем меню
- Нужно переместить селектор в header слева от "Главная"

## Решение

### Шаг 1: Обновить импорты в App.tsx

Заменить импорт селектора на компактную версию:

```typescript
// ❌ Удалить:
import { AIProviderSelector } from './components/AIProviderSelector';

// ✅ Добавить:
import { AIProviderSelectorCompact } from './components/AIProviderSelectorCompact';
```

---

### Шаг 2: Найти header в App.tsx

Найдите в коде такую структуру (или похожую):

```tsx
<header className="...">
  <div>
    <h1>🇩🇪 DeutschMeister</h1>
    <p>Изучайте немецкий с ИИ-репетитором</p>
  </div>
  
  {/* Существующие элементы справа */}
  <div className="flex items-center gap-4">
    {/* Кнопки, ссылки и т.д. */}
    <button>Главная</button>
  </div>
</header>
```

---

### Шаг 3: Добавить селектор в header

```tsx
<header className="mb-8 flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-black text-slate-800">🇩🇪 DeutschMeister</h1>
    <p className="text-slate-400 text-sm">Изучайте немецкий с ИИ-репетитором</p>
  </div>
  
  {/* ДОБАВИТЬ СЕЛЕКТОР ЗДЕСЬ */}
  <div className="flex items-center gap-4">
    <AIProviderSelectorCompact />
    
    {/* Существующие кнопки */}
    <button>Главная</button>
  </div>
</header>
```

---

### Шаг 4: Удалить старый селектор из footer

Найдите и удалите этот код в конце App.tsx:

```tsx
{/* ❌ УДАЛИТЬ ЭТО: */}
<div className="fixed bottom-4 right-4 z-40">
  <AIProviderSelector />
</div>
```

---

## Полный пример header

```tsx
{currentView === 'dashboard' && (
  <div className="space-y-8">
    {/* Header */}
    <header className="flex items-center justify-between">
      {/* Левая часть - название */}
      <div>
        <h1 className="text-3xl font-black text-slate-800">
          🇩🇪 DeutschMeister
        </h1>
        <p className="text-slate-400 text-sm">
          Изучайте немецкий с ИИ-репетитором
        </p>
      </div>
      
      {/* Правая часть - селектор + кнопки */}
      <div className="flex items-center gap-3">
        {/* AI Provider Selector */}
        <AIProviderSelectorCompact />
        
        {/* Другие кнопки если есть */}
        {/* ... */}
      </div>
    </header>

    {/* Остальной контент dashboard */}
    {/* ... */}
  </div>
)}
```

---

## Как выглядит компактный селектор

### Закрытое состояние:
```
┌───────────────┐
│ 🔵 Gemini  ▼  │
└───────────────┘
```

### Открытое меню:
```
┌────────────────────────┐
│ 🔵 Google AI Studio ✓  │
├────────────────────────┤
│ 🟢 ChatGPT             │
└────────────────────────┘
```

---

## Проверка работы

1. Перезапустите сервер
```bash
npm run dev
```

2. Откройте приложение

3. В header должен быть селектор

4. Кликните на него - должны появиться оба варианта:
   - 🔵 Google AI Studio
   - 🟢 ChatGPT

5. Выберите ChatGPT - селектор закроется и покажет "🟢 ChatGPT"

---

## Если ChatGPT всё равно не появляется

### Проверьте z-index

Убедитесь что z-index меню достаточно высокий:

```tsx
// В AIProviderSelectorCompact.tsx
<div className="... z-[101]">  // z-index 101
```

### Проверьте в консоли браузера

Откройте DevTools (F12) и в консоли выполните:

```javascript
console.log(localStorage.getItem('selected_ai_provider'));
// Должно быть: "gemini" или "openai"
```

---

## Готово!

Теперь селектор должен:
- ✅ Находиться в header слева от "Главная"
- ✅ Показывать оба варианта: Google AI Studio и ChatGPT
- ✅ Работать корректно при выборе

---

*Инструкция создана: 14 января 2026*
