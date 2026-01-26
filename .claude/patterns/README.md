# 🎨 Patterns - Паттерны кодирования

> Стандартные паттерны и примеры кода для разработки DeutschMeister

---

## 📚 Содержание

1. **component-patterns.md** — Как писать React компоненты
2. **service-patterns.md** — Как писать сервисы
3. **state-management.md** — Как управлять состоянием
4. **error-handling.md** — Как обрабатывать ошибки

---

## 🎯 Что это?

**Паттерны** — это проверенные решения для повторяющихся задач.

Вместо того, чтобы каждый раз писать код с нуля:
- Используйте готовые паттерны
- Адаптируйте под вашу задачу
- Код будет консистентным и качественным

---

## 🚀 Быстрый старт

### "Мне нужно создать компонент"
→ Посмотри `component-patterns.md`

### "Мне нужно создать сервис"
→ Посмотри `service-patterns.md`

### "Мне нужно управлять состоянием"
→ Посмотри `state-management.md`

### "Мне нужна обработка ошибок"
→ Посмотри `error-handling.md`

---

## 📋 Структура файлов

```
patterns/
├── README.md (вы здесь)
├── component-patterns.md    # React компоненты
├── service-patterns.md      # Бизнес-логика
├── state-management.md      # useState, useEffect
└── error-handling.md        # try-catch, ошибки
```

---

## 💡 Принципы паттернов

### 1. Консистентность
Все компоненты выглядят и работают похоже.

### 2. Переиспользуемость
Один паттерн можно применить к разным задачам.

### 3. Масштабируемость
Легко добавлять новые компоненты и функции.

### 4. Читаемость
Код легко понять и поддерживать.

---

## 🔄 Как использовать паттерны?

### Шаг 1: Прочитай паттерн
Выбери нужный файл и посмотри примеры.

### Шаг 2: Адаптируй под себя
Скопируй паттерн и измени под свою задачу.

### Шаг 3: Следуй структуре
Используй тот же порядок файлов и функций.

### Шаг 4: Протестируй
Убедись, что всё работает как надо.

---

## 📐 Архитектурные решения

### Где файлы?
```
Компоненты:    components/MyComponent.tsx
Сервисы:       services/myService.ts
Типы:          types.ts
Константы:     constants.ts
```

### Как назвать?
```
Компоненты:    PascalCase (MyComponent)
Функции:       camelCase (myFunction)
Файлы:         kebab-case (my-component.ts) или camelCase (myComponent.ts)
```

### Структура файла
```typescript
// 1. Импорты
import React from 'react'

// 2. Интерфейсы/типы
interface MyProps {}

// 3. Компонент
const MyComponent: React.FC<MyProps> = () => {}

// 4. Экспорт
export default MyComponent
```

---

## ✨ Примеры

### Простой компонент

```typescript
import React from 'react'

interface ButtonProps {
  label: string
  onClick: () => void
}

const MyButton: React.FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white">
      {label}
    </button>
  )
}

export default MyButton
```

### Компонент с состоянием

```typescript
import React, { useState } from 'react'

const Counter: React.FC = () => {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Счёт: {count}</p>
      <button onClick={() => setCount(count + 1)}>Увеличить</button>
    </div>
  )
}

export default Counter
```

### Сервис

```typescript
export const myService = {
  getData: (id: string) => {
    // логика здесь
    return data
  },
  
  saveData: (data: any) => {
    // сохранение
  }
}
```

---

## 🎓 Для новичков

**Паттерны** — это как рецепты в кулинарии:

```
Рецепт печенья:
1. Смешай ингредиенты
2. Замеси тесто
3. Разложи на противень
4. Пеки 15 минут

Паттерн компонента:
1. ОпределиProps (ингредиенты)
2. Создай компонент (замеси)
3. Добавь логику (разложи)
4. Экспортируй (пеки)

Один рецепт можно использовать несколько раз!
Один паттерн можно использовать для разных компонентов!
```

---

## 🚀 Быстрые ссылки

| Нужен | Файл |
|------|------|
| **Новый компонент** | component-patterns.md |
| **Новый сервис** | service-patterns.md |
| **Управление состоянием** | state-management.md |
| **Обработка ошибок** | error-handling.md |

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Актуально ✅
