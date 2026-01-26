# 📊 State Management - Управление состоянием

> Паттерны для управления состоянием с useState, useEffect и localStorage

---

## 🎯 Основной паттерн состояния

```typescript
import React, { useState, useEffect } from 'react'

const MyComponent: React.FC = () => {
  // 1. Инициализируй состояние
  const [state, setState] = useState<string>('начальное значение')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 2. Загрузи данные при монтировании
  useEffect(() => {
    loadData()
  }, [])  // Пустой массив = только при монтировании

  // 3. Функция для обновления состояния
  const loadData = async () => {
    setIsLoading(true)
    try {
      // Логика загрузки
      setState('новое значение')
    } catch (err) {
      setError('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Рендер
  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error}</div>
  
  return <div>{state}</div>
}

export default MyComponent
```

---

## 🔄 useState паттерны

### Паттерн 1: Простое состояние

```typescript
// ✅ ПРАВИЛЬНО
const [count, setCount] = useState<number>(0)
const [name, setName] = useState<string>('')
const [isVisible, setIsVisible] = useState<boolean>(false)

// Обновление
setCount(count + 1)
setName('John')
setIsVisible(!isVisible)
```

### Паттерн 2: Сложное состояние (объект)

```typescript
// ✅ ПРАВИЛЬНО: Типизированный объект
interface User {
  id: string
  name: string
  email: string
}

const [user, setUser] = useState<User | null>(null)

// Обновление отдельного поля
setUser(prev => 
  prev ? { ...prev, name: 'New Name' } : null
)

// Обновление всего объекта
setUser({ id: '1', name: 'John', email: 'john@example.com' })
```

### Паттерн 3: Массив в состоянии

```typescript
// ✅ ПРАВИЛЬНО: Типизированный массив
const [items, setItems] = useState<string[]>([])

// Добавить элемент (не мутируй!)
setItems(prev => [...prev, 'новый элемент'])

// Удалить элемент
setItems(prev => prev.filter((_, i) => i !== indexToRemove))

// Обновить элемент
setItems(prev =>
  prev.map((item, i) => i === indexToUpdate ? 'новое значение' : item)
)

// Очистить
setItems([])
```

### Паттерн 4: Множественные связанные состояния

```typescript
// ✅ ПРАВИЛЬНО: Группируй связанные состояния
interface FormState {
  email: string
  password: string
  rememberMe: boolean
}

const [form, setForm] = useState<FormState>({
  email: '',
  password: '',
  rememberMe: false
})

// Обновление
const handleEmailChange = (email: string) => {
  setForm(prev => ({ ...prev, email }))
}

// ❌ НЕПРАВИЛЬНО: Множество отдельных состояний
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [rememberMe, setRememberMe] = useState(false)
// Сложнее синхронизировать!
```

---

## ⏱️ useEffect паттерны

### Паттерн 1: Выполнить один раз при монтировании

```typescript
useEffect(() => {
  // Это выполнится один раз при монтировании компонента
  loadInitialData()
  console.log('Монтирование завершено')

  // Опционально: очистка при размонтировании
  return () => {
    console.log('Размонтирование')
  }
}, [])  // Пустой массив = только один раз!
```

### Паттерн 2: Выполнить когда зависимость изменится

```typescript
const [id, setId] = useState<string>('1')

useEffect(() => {
  // Это выполнится при монтировании и каждый раз когда `id` меняется
  loadDataById(id)
  console.log(`Загружаю данные для id=${id}`)
}, [id])  // id в зависимостях
```

### Паттерн 3: Синхронизация с localStorage

```typescript
const [theme, setTheme] = useState<'light' | 'dark'>('light')

// Загрузить при монтировании
useEffect(() => {
  const saved = localStorage.getItem('theme')
  if (saved) setTheme(saved as 'light' | 'dark')
}, [])

// Сохранить когда меняется
useEffect(() => {
  localStorage.setItem('theme', theme)
}, [theme])
```

### Паттерн 4: Отмена асинхронных операций

```typescript
useEffect(() => {
  let isMounted = true  // Флаг монтирования

  const loadData = async () => {
    try {
      const data = await fetch('/api/data').then(r => r.json())
      if (isMounted) {  // Проверь, ещё ли смонтирован
        setData(data)
      }
    } catch (error) {
      if (isMounted) {
        setError(error)
      }
    }
  }

  loadData()

  // Очистка: установи флаг в false при размонтировании
  return () => {
    isMounted = false
  }
}, [])
```

### Паттерн 5: Дебаунс (задержка выполнения)

```typescript
const [searchTerm, setSearchTerm] = useState('')

useEffect(() => {
  // Установи таймер
  const timer = setTimeout(() => {
    console.log(`Ищу: ${searchTerm}`)
    // API запрос здесь
  }, 500)  // Подожди 500мс

  // Очистка: отмени таймер если searchTerm изменился
  return () => clearTimeout(timer)
}, [searchTerm])
```

---

## 💾 Паттерны localStorage

### Паттерн 1: Загрузить при монтировании

```typescript
const [data, setData] = useState<MyData | null>(null)
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const stored = localStorage.getItem('my_data')
  try {
    setData(stored ? JSON.parse(stored) : null)
  } catch (error) {
    console.error('Ошибка парсинга JSON:', error)
  } finally {
    setIsLoading(false)
  }
}, [])

if (isLoading) return <div>Загрузка...</div>
return <div>{data ? JSON.stringify(data) : 'Нет данных'}</div>
```

### Паттерн 2: Сохранить при изменении

```typescript
const [items, setItems] = useState<Item[]>([])

// Сохраняй каждый раз когда items меняется
useEffect(() => {
  localStorage.setItem('items', JSON.stringify(items))
}, [items])

// Загрузи при монтировании
useEffect(() => {
  const stored = localStorage.getItem('items')
  if (stored) {
    try {
      setItems(JSON.parse(stored))
    } catch (error) {
      console.error('Ошибка:', error)
    }
  }
}, [])
```

### Паттерн 3: Батчинг обновлений (экономия сохранений)

```typescript
const [form, setForm] = useState({ name: '', email: '' })
const [isDirty, setIsDirty] = useState(false)

// Отметь как "грязное"
const handleChange = (field: string, value: string) => {
  setForm(prev => ({ ...prev, [field]: value }))
  setIsDirty(true)
}

// Сохрани с задержкой (дебаунс)
useEffect(() => {
  if (!isDirty) return

  const timer = setTimeout(() => {
    localStorage.setItem('form', JSON.stringify(form))
    setIsDirty(false)
  }, 1000)

  return () => clearTimeout(timer)
}, [form, isDirty])
```

---

## 🎯 Когда использовать какой паттерн?

### useState для чего?
- ✅ Локальное состояние компонента
- ✅ Для одного компонента (не нужно другим)
- ✅ Значения, которые изменяются часто
- ✅ UI состояния (видимость, выбор и т.д.)

### localStorage для чего?
- ✅ Сохранение между сеансами
- ✅ Данные пользователя (прогресс, настройки)
- ✅ Кеширование
- ✅ Черновики форм

### Комбинировать?
- ✅ useState для быстрых изменений
- ✅ localStorage для персистентности
- ✅ useEffect для синхронизации

---

## 🔄 Полный пример: LessonProgress

```typescript
import React, { useState, useEffect } from 'react'
import { LessonProgress } from '../types'

interface LessonProgressComponentProps {
  lessonId: string
  onSave?: (progress: LessonProgress) => void
}

const LessonProgressComponent: React.FC<LessonProgressComponentProps> = ({
  lessonId,
  onSave
}) => {
  // Состояние
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузить при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`lesson_${lessonId}_progress`)
      setProgress(stored ? JSON.parse(stored) : null)
    } catch (err) {
      setError('Ошибка загрузки прогресса')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])

  // Сохранить при изменении
  useEffect(() => {
    if (progress && !isLoading) {
      try {
        localStorage.setItem(
          `lesson_${lessonId}_progress`,
          JSON.stringify(progress)
        )
        onSave?.(progress)
      } catch (err) {
        console.error('Ошибка сохранения:', err)
      }
    }
  }, [progress, lessonId, isLoading, onSave])

  // Обработчик
  const handleNextTask = () => {
    setProgress(prev => {
      if (!prev) return null
      return {
        ...prev,
        currentTaskIdx: prev.currentTaskIdx + 1,
        lastActivityAt: new Date().toISOString()
      }
    })
  }

  // Рендер
  if (isLoading) return <div>Загрузка прогресса...</div>
  if (error) return <div className="text-red-500">Ошибка: {error}</div>
  if (!progress) return <div>Нет прогресса</div>

  return (
    <div className="p-4">
      <p>Задание: {progress.currentTaskIdx + 1}</p>
      <button
        onClick={handleNextTask}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Далее
      </button>
    </div>
  )
}

export default LessonProgressComponent
```

---

## ⚠️ Частые ошибки

### Ошибка 1: Забыли зависимость в useEffect

```typescript
// ❌ НЕПРАВИЛЬНО: Бесконечный цикл
useEffect(() => {
  setCount(count + 1)  // Создаёт бесконечный цикл!
})  // Нет зависимостей!

// ✅ ПРАВИЛЬНО
useEffect(() => {
  // Выполнится один раз
}, [])

// ✅ ПРАВИЛЬНО
useEffect(() => {
  // Выполнится когда `count` меняется
}, [count])
```

### Ошибка 2: Мутирование состояния

```typescript
// ❌ НЕПРАВИЛЬНО: Мутируешь напрямую
const [items, setItems] = useState([1, 2, 3])
items.push(4)  // НЕЛЬЗЯ!

// ✅ ПРАВИЛЬНО: Создай новый массив
setItems(prev => [...prev, 4])
```

### Ошибка 3: Забыли JSON.parse при загрузке из localStorage

```typescript
// ❌ НЕПРАВИЛЬНО
const stored = localStorage.getItem('data')
setData(stored)  // Это строка, не объект!

// ✅ ПРАВИЛЬНО
const stored = localStorage.getItem('data')
if (stored) {
  setData(JSON.parse(stored))
}
```

### Ошибка 4: Не обработал ошибки

```typescript
// ❌ НЕПРАВИЛЬНО
const stored = localStorage.getItem('data')
setData(JSON.parse(stored))  // Может крашнуться!

// ✅ ПРАВИЛЬНО
try {
  const stored = localStorage.getItem('data')
  if (stored) setData(JSON.parse(stored))
} catch (error) {
  console.error('Ошибка парсинга:', error)
}
```

---

## 📋 Чеклист управления состоянием

При создании компонента со состоянием:

- [ ] Всё состояние типизировано (нет `any`)?
- [ ] useState инициализирован с правильным типом?
- [ ] useEffect имеет правильные зависимости?
- [ ] localStorage операции обёрнуты в try-catch?
- [ ] Нет мутирования состояния напрямую?
- [ ] Есть loading и error состояния?
- [ ] Логика сохранения отделена от состояния?

---

## 🎓 Для новичков

**Состояние** — это как память компонента:

```
useState = память в мозгу
useEffect = когда что-то произойдёт
localStorage = запись в блокноте

Пример жизни:
- Просыпаешься (монтирование)
- Вспоминаешь, что нужно сделать (загрузить данные)
- Записываешь в блокнот (localStorage)
- Выполняешь дела (обновляешь состояние)
- Спишь (размонтирование, очистка)
```

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Готово к использованию ✅
