# 🧩 Component Patterns - Паттерны React компонентов

> Стандартные паттерны для создания React компонентов с TypeScript и Hooks

---

## 🎯 Основной паттерн компонента

```typescript
// components/MyComponent.tsx

import React, { useState, useEffect } from 'react'
import { MyType } from '../types'

// 1. Определи Props интерфейс
interface MyComponentProps {
  title: string
  onAction?: () => void
  isLoading?: boolean
}

// 2. Создай компонент
const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  onAction, 
  isLoading = false 
}) => {
  // 3. Используй Hooks
  const [state, setState] = useState<string>('')

  useEffect(() => {
    // Побочные эффекты здесь
  }, [])

  // 4. Обработчики
  const handleClick = () => {
    setState('new value')
    onAction?.()
  }

  // 5. Рендер
  return (
    <div className="p-4 rounded-lg">
      <h2 className="text-lg font-bold">{title}</h2>
      <button 
        onClick={handleClick}
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isLoading ? 'Загрузка...' : 'Нажми'}
      </button>
      <p>{state}</p>
    </div>
  )
}

// 6. Экспорт
export default MyComponent
```

---

## 📋 Чеклист компонента

При создании компонента проверь:

- [ ] Интерфейс Props типизирован?
- [ ] Все Props имеют типы (нет `any`)?
- [ ] Используются Hooks (useState, useEffect)?
- [ ] Есть обработчики событий?
- [ ] Используется Tailwind CSS для стилей?
- [ ] Компонент экспортируется по умолчанию?
- [ ] Компонент функциональный (не класс)?

---

## 🎨 Паттерны по типам компонентов

### Паттерн 1: Простой компонент (без состояния)

```typescript
import React from 'react'

interface CardProps {
  title: string
  description: string
  icon?: React.ReactNode
}

const Card: React.FC<CardProps> = ({ title, description, icon }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500">
      <div className="flex items-center gap-3">
        {icon && <div className="text-2xl">{icon}</div>}
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default Card
```

**Когда использовать:**
- Компонент только отображает data
- Нет внутреннего состояния
- Примеры: Card, Badge, Label, Icon

---

### Паттерн 2: Компонент со состоянием

```typescript
import React, { useState } from 'react'

interface ToggleProps {
  initialValue?: boolean
  onChange?: (value: boolean) => void
}

const Toggle: React.FC<ToggleProps> = ({ initialValue = false, onChange }) => {
  const [isOn, setIsOn] = useState(initialValue)

  const handleToggle = () => {
    const newValue = !isOn
    setIsOn(newValue)
    onChange?.(newValue)
  }

  return (
    <button
      onClick={handleToggle}
      className={`w-12 h-6 rounded-full transition ${
        isOn ? 'bg-green-500' : 'bg-gray-300'
      }`}
    />
  )
}

export default Toggle
```

**Когда использовать:**
- Компонент управляет своим состоянием
- Состояние не нужно хранить в localStorage
- Примеры: Toggle, Accordion, Dropdown

---

### Паттерн 3: Компонент с localStorage

```typescript
import React, { useState, useEffect } from 'react'

interface PersistentInputProps {
  storageKey: string
  placeholder?: string
  onSave?: (value: string) => void
}

const PersistentInput: React.FC<PersistentInputProps> = ({
  storageKey,
  placeholder = 'Введи текст',
  onSave
}) => {
  const [value, setValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка из localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setValue(stored)
    }
    setIsLoading(false)
  }, [storageKey])

  // Сохранение в localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(storageKey, value)
      onSave?.(value)
    }
  }, [value, isLoading, storageKey, onSave])

  if (isLoading) return <div>Загрузка...</div>

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 border rounded"
    />
  )
}

export default PersistentInput
```

**Когда использовать:**
- Состояние нужно сохранять между сеансами
- Примеры: Форма с автосохранением, Настройки, Черновик

---

### Паттерн 4: Компонент с async операциями

```typescript
import React, { useState } from 'react'

interface ApiButtonProps {
  label: string
  onFetch: () => Promise<string>
}

const ApiButton: React.FC<ApiButtonProps> = ({ label, onFetch }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await onFetch()
      setResult(data)
    } catch (err: any) {
      const errorMessage = err?.message || JSON.stringify(err)
      setError(errorMessage)
      console.error('❌ Ошибка:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {isLoading ? 'Загрузка...' : label}
      </button>

      {error && <div className="text-red-500">Ошибка: {error}</div>}
      {result && <div className="text-green-500">Успех: {result}</div>}
    </div>
  )
}

export default ApiButton
```

**Когда использовать:**
- Компонент делает API запросы
- Нужна обработка ошибок и loading состояния
- Примеры: Кнопка отправки, Загрузка данных

---

### Паттерн 5: Компонент со списком

```typescript
import React, { useState } from 'react'

interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  onAdd?: () => void
  onRemove?: (index: number) => void
}

const List = <T,>({ 
  items, 
  renderItem, 
  onAdd, 
  onRemove 
}: ListProps<T>) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Элементы ({items.length})</h3>
        {onAdd && (
          <button 
            onClick={onAdd}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            +
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500 text-center py-4">Нет элементов</div>
      ) : (
        <ul className="space-y-1">
          {items.map((item, idx) => (
            <li 
              key={idx}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>{renderItem(item, idx)}</div>
              {onRemove && (
                <button
                  onClick={() => onRemove(idx)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default List
```

**Когда использовать:**
- Нужно отобразить список элементов
- Список может быть динамическим
- Примеры: TODO список, Таблица, История

---

## 🔄 Hooks паттерны

### Паттерн 1: useEffect с зависимостями

```typescript
// ✅ ПРАВИЛЬНО: Загрузи данные при монтировании
useEffect(() => {
  loadData()
}, [])  // Пустой массив = только при монтировании

// ✅ ПРАВИЛЬНО: Загрузи когда ID изменился
useEffect(() => {
  loadDataById(id)
}, [id])  // ID в зависимостях

// ✅ ПРАВИЛЬНО: Синхронизируй с localStorage
useEffect(() => {
  localStorage.setItem('key', value)
}, [value])  // Каждый раз когда value меняется

// ❌ НЕПРАВИЛЬНО: Без зависимостей
useEffect(() => {
  loadData()  // Будет вызываться при каждом рендере! Бесконечный цикл!
})
```

---

### Паттерн 2: useMemo для оптимизации

```typescript
import React, { useMemo } from 'react'

interface ListProps {
  items: string[]
  filter: string
}

const FilteredList: React.FC<ListProps> = ({ items, filter }) => {
  // ✅ ПРАВИЛЬНО: Мемоизируй дорогое вычисление
  const filteredItems = useMemo(() => {
    console.log('Фильтрую...')  // Выведется только когда items или filter меняются
    return items.filter(item => item.includes(filter))
  }, [items, filter])

  return (
    <ul>
      {filteredItems.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default FilteredList
```

---

### Паттерн 3: useCallback для функций в props

```typescript
import React, { useCallback, useState } from 'react'

interface ButtonProps {
  onClick: (value: string) => void
}

const MyButton: React.FC<ButtonProps> = ({ onClick }) => {
  return (
    <button onClick={() => onClick('clicked')}>
      Нажми
    </button>
  )
}

const Parent: React.FC = () => {
  const [count, setCount] = useState(0)

  // ✅ ПРАВИЛЬНО: useCallback сохраняет функцию между рендерами
  const handleClick = useCallback((value: string) => {
    console.log(value)
    setCount(count + 1)
  }, [count])

  return (
    <div>
      <MyButton onClick={handleClick} />
      <p>Счёт: {count}</p>
    </div>
  )
}

export default Parent
```

---

## 📐 Типизация Props

### Обязательный prop

```typescript
interface Props {
  title: string  // ОБЯЗАТЕЛЬНО
}
```

### Опциональный prop

```typescript
interface Props {
  title?: string  // ОПЦИОНАЛЬНО, может быть undefined
}
```

### Prop с значением по умолчанию

```typescript
interface Props {
  title?: string
}

const MyComponent: React.FC<Props> = ({ title = 'По умолчанию' }) => {
  // title никогда не будет undefined благодаря значению по умолчанию
}
```

### Callback

```typescript
interface Props {
  onAction: (value: string) => void  // Функция, ничего не возвращает
  onFetch: (id: string) => Promise<Data>  // Async функция
}
```

### Union types

```typescript
interface Props {
  type: 'success' | 'error' | 'warning'  // Только эти значения!
  size: 'small' | 'medium' | 'large'
}
```

---

## 🎨 Стилизация (Tailwind)

### Базовый паттерн стилей

```typescript
const MyComponent: React.FC = () => {
  return (
    <div className={`
      p-4                          // Padding
      rounded-lg                   // Border radius
      bg-white                     // Background
      shadow-md                    // Shadow
      border border-gray-200       // Border
      hover:shadow-lg              // Hover effect
      transition duration-200      // Плавный переход
    `}>
      Содержимое
    </div>
  )
}
```

### Условные классы

```typescript
const Button: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <button
      className={`
        px-4 py-2 rounded
        ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
        hover:opacity-80 transition
      `}
    >
      Кнопка
    </button>
  )
}
```

---

## 🚀 Когда создавать новый компонент?

### ✅ ДЕЛАЙ новый компонент:

```
- Используешь один код несколько раз
- Код занимает > 50 строк
- Компонент имеет свою логику
- Нужна переиспользуемость

Примеры: Card, Button, Modal, Form
```

### ❌ НЕ ДЕЛАЙ новый компонент:

```
- Используешь код только один раз
- Код очень простой (< 10 строк)
- Это просто div или список

Примеры: Заголовок, Абзац, Список в одном месте
```

---

## 📊 Примеры полных компонентов

### Пример 1: VocabularyCard упрощённая версия

```typescript
import React, { useState, useEffect } from 'react'
import { Vocabulary } from '../types'

interface VocabularyCardProps {
  word: Vocabulary
  onComplete: (isCorrect: boolean) => void
}

const VocabularyCard: React.FC<VocabularyCardProps> = ({ word, onComplete }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')

  const handleSubmit = () => {
    const isCorrect = userAnswer.toLowerCase() === word.translation.toLowerCase()
    onComplete(isCorrect)
    setUserAnswer('')
    setIsFlipped(false)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="h-32 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg 
                   flex items-center justify-center cursor-pointer text-white 
                   text-2xl font-bold mb-4"
      >
        {isFlipped ? word.translation : word.word}
      </div>

      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Напиши ответ"
        className="w-full px-3 py-2 border rounded mb-3"
      />

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Проверить
      </button>
    </div>
  )
}

export default VocabularyCard
```

---

## 🎓 Для новичков

Компонент — это функция, которая возвращает JSX:

```typescript
// Обычная функция
function greet(name: string): string {
  return `Привет, ${name}!`
}

// React компонент (функция + JSX)
function Greeting({ name }: { name: string }) {
  return <div>Привет, {name}!</div>
}
```

Используй React FC для типизации, useState для состояния, useEffect для побочных эффектов!

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Готово к использованию ✅
