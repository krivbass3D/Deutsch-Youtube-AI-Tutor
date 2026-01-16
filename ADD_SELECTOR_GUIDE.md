# ✅ Инструкция: Добавление селектора AI провайдера

## 🎯 Что нужно сделать

Добавить компонент `<AIProviderSelector />` в header приложения.

---

## 📍 Где добавить

### Вариант 1: В header Dashboard (рекомендуется)

Найдите в `App.tsx` строку с заголовком "DeutschMeister" и добавьте селектор рядом:

```tsx
{currentView === 'dashboard' && (
  <>
    {/* Существующий header */}
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black text-slate-800">🇩🇪 DeutschMeister</h1>
        <p className="text-slate-400 text-sm">Изучайте немецкий с ИИ-репетитором</p>
      </div>
      
      {/* ДОБАВИТЬ СЮДА: */}
      <div className="flex items-center gap-4">
        <AIProviderSelector />
        
        {/* Существующие кнопки если есть */}
      </div>
    </header>
    
    {/* ... остальной код dashboard */}
  </>
)}
```

---

### Вариант 2: Фиксированная позиция (альтернатива)

Добавьте в конец JSX перед закрывающим `</div>`:

```tsx
      {/* Toast Container for notifications */}
      <ToastContainer />
      
      {/* AI Provider Selector - ДОБАВИТЬ */}
      <div className="fixed bottom-4 right-4 z-40">
        <AIProviderSelector />
      </div>
    </div>
  );
};
```

---

## 🔧 Полный код изменений

### 1. Замените в конце App.tsx:

**❌ Было:**
```tsx
      {/* Toast Container for notifications */}
      <ToastContainer />
      
      {/* AI Provider Status Indicator */}
      <AIProviderStatus />
    </div>
  );
};
```

**✅ Стало:**
```tsx
      {/* Toast Container for notifications */}
      <ToastContainer />
      
      {/* AI Provider Selector */}
      <div className="fixed bottom-4 right-4 z-40">
        <AIProviderSelector />
      </div>
    </div>
  );
};
```

---

## 🎨 Как будет выглядеть

### Закрытое состояние:
```
┌────────────────────────────────┐
│ 🔵  Google AI Studio       ▼   │
│     Gemini 2.0 Flash           │
└────────────────────────────────┘
```

### Открытое меню:
```
┌────────────────────────────────┐
│ 🔵  Google AI Studio       ✓   │
│     Gemini 2.0 Flash           │
├────────────────────────────────┤
│ 🟢  ChatGPT                    │
│     GPT-4o mini                │
├────────────────────────────────┤
│ 💡 Совет: Выбор сохраняется    │
│    автоматически               │
└────────────────────────────────┘
```

---

## 🚀 Перезапустите сервер

```bash
# Остановите (Ctrl+C)
npm run dev
```

---

## ✅ Готово!

Теперь пользователи могут выбирать AI провайдер через выпадающее меню! 🎉

---

*Создано: 14 января 2026*
