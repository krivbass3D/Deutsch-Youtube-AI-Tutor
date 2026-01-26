# 🛠️ Service Patterns - Паттерны сервисов

> Стандартные паттерны для создания сервисов (бизнес-логика)

---

## 🎯 Основной паттерн сервиса

```typescript
// services/myService.ts

import { MyType, MyResult } from '../types'

export const myService = {
  // Получение данных
  getData: async (id: string): Promise<MyType> => {
    try {
      const stored = localStorage.getItem(`my_key_${id}`)
      if (!stored) {
        throw new Error('Данные не найдены')
      }
      return JSON.parse(stored)
    } catch (error) {
      console.error('❌ Ошибка получения данных:', error)
      throw error
    }
  },

  // Сохранение данных
  saveData: (id: string, data: MyType): void => {
    try {
      localStorage.setItem(`my_key_${id}`, JSON.stringify(data))
      console.log('✅ Данные сохранены')
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error)
      throw error
    }
  },

  // Удаление данных
  deleteData: (id: string): void => {
    try {
      localStorage.removeItem(`my_key_${id}`)
      console.log('✅ Данные удалены')
    } catch (error) {
      console.error('❌ Ошибка удаления:', error)
      throw error
    }
  },

  // Обработка данных
  processData: (data: MyType): MyResult => {
    // Бизнес-логика здесь
    return { success: true, message: 'Обработано' }
  }
}
```

---

## 📋 Структура сервиса

### Хорошая структура

```typescript
export const myService = {
  // 1. Получение (get)
  getData: () => {},
  getAll: () => {},
  getByFilter: () => {},

  // 2. Создание (create)
  createData: () => {},
  
  // 3. Обновление (update)
  updateData: () => {},
  
  // 4. Удаление (delete)
  deleteData: () => {},
  
  // 5. Вспомогательные функции (helpers)
  normalizeData: () => {},
  validateData: () => {},
}
```

---

## 🎨 Паттерны по типам сервисов

### Паттерн 1: LocalStorage сервис

```typescript
// services/storageService.ts

interface StorageConfig {
  key: string
  defaultValue?: any
  version?: number
}

export const storageService = {
  // Получить из localStorage
  get: <T>(config: StorageConfig): T | null => {
    try {
      const item = localStorage.getItem(config.key)
      return item ? JSON.parse(item) : config.defaultValue || null
    } catch (error) {
      console.error(`❌ Ошибка чтения из ${config.key}:`, error)
      return config.defaultValue || null
    }
  },

  // Сохранить в localStorage
  set: <T>(config: StorageConfig, value: T): void => {
    try {
      localStorage.setItem(config.key, JSON.stringify(value))
    } catch (error) {
      console.error(`❌ Ошибка записи в ${config.key}:`, error)
      throw error
    }
  },

  // Удалить из localStorage
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`❌ Ошибка удаления ${key}:`, error)
      throw error
    }
  },

  // Очистить всё
  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('❌ Ошибка очистки localStorage:', error)
      throw error
    }
  },

  // Существует ли ключ?
  exists: (key: string): boolean => {
    return localStorage.getItem(key) !== null
  }
}
```

**Когда использовать:**
- Нужно сохранять/загружать данные
- Работа с localStorage
- Примеры: lessons, progress, settings

---

### Паттерн 2: API сервис

```typescript
// services/apiService.ts

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  data?: any
  headers?: Record<string, string>
}

export const apiService = {
  // Отправить запрос
  request: async <T>(config: RequestConfig): Promise<T> => {
    try {
      console.log(`🔄 ${config.method} ${config.url}`)
      
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: config.data ? JSON.stringify(config.data) : undefined
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log(`✅ ${config.method} ${config.url}`)
      return result as T
    } catch (error: any) {
      console.error(`❌ Ошибка ${config.method} ${config.url}:`, error)
      throw error
    }
  },

  // GET запрос
  get: async <T>(url: string): Promise<T> => {
    return apiService.request({ method: 'GET', url })
  },

  // POST запрос
  post: async <T>(url: string, data: any): Promise<T> => {
    return apiService.request({ method: 'POST', url, data })
  },

  // PUT запрос
  put: async <T>(url: string, data: any): Promise<T> => {
    return apiService.request({ method: 'PUT', url, data })
  },

  // DELETE запрос
  delete: async <T>(url: string): Promise<T> => {
    return apiService.request({ method: 'DELETE', url })
  }
}
```

**Когда использовать:**
- API запросы на сервер
- HTTP методы
- Примеры: geminiService, внешние API

---

### Паттерн 3: Валидация сервис

```typescript
// services/validationService.ts

interface ValidationResult {
  isValid: boolean
  error?: string
  message?: string
}

export const validationService = {
  // Валидировать ответ
  validateAnswer: (
    userAnswer: string,
    correctAnswers: string[]
  ): ValidationResult => {
    // Нормализация
    const normalize = (text: string) =>
      text.trim().toLowerCase().replace(/[,;.!?]/g, '')

    const userNorm = normalize(userAnswer)

    // Точное совпадение
    for (const correct of correctAnswers) {
      if (userNorm === normalize(correct)) {
        return { isValid: true }
      }
    }

    // Без артиклей
    const removeArticles = (text: string) => {
      const articles = ['der', 'die', 'das', 'ein', 'eine']
      let result = text
      articles.forEach(a => {
        result = result.replace(new RegExp(`\\b${a}\\b`, 'gi'), '')
      })
      return result.trim()
    }

    const userNoArticles = removeArticles(userNorm)
    for (const correct of correctAnswers) {
      if (userNoArticles === removeArticles(normalize(correct))) {
        return { isValid: true }
      }
    }

    return { isValid: false, error: 'Неправильный ответ' }
  },

  // Валидировать email
  validateEmail: (email: string): ValidationResult => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      isValid: regex.test(email),
      error: !regex.test(email) ? 'Неправильный email' : undefined
    }
  },

  // Валидировать число
  validateNumber: (
    value: any,
    min?: number,
    max?: number
  ): ValidationResult => {
    const num = Number(value)
    if (isNaN(num)) {
      return { isValid: false, error: 'Должно быть число' }
    }
    if (min !== undefined && num < min) {
      return { isValid: false, error: `Минимум: ${min}` }
    }
    if (max !== undefined && num > max) {
      return { isValid: false, error: `Максимум: ${max}` }
    }
    return { isValid: true }
  }
}
```

**Когда использовать:**
- Валидация данных
- Проверка ответов
- Примеры: validationService, проверки форм

---

### Паттерн 4: Обработки данных сервис

```typescript
// services/dataProcessingService.ts

export const dataProcessingService = {
  // Фильтровать данные
  filter: <T>(
    data: T[],
    predicate: (item: T) => boolean
  ): T[] => {
    return data.filter(predicate)
  },

  // Трансформировать данные
  map: <T, U>(
    data: T[],
    transform: (item: T) => U
  ): U[] => {
    return data.map(transform)
  },

  // Сортировать данные
  sort: <T>(
    data: T[],
    compareFn: (a: T, b: T) => number
  ): T[] => {
    return [...data].sort(compareFn)
  },

  // Группировать данные
  groupBy: <T>(
    data: T[],
    keyFn: (item: T) => string
  ): Record<string, T[]> => {
    return data.reduce((acc, item) => {
      const key = keyFn(item)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {} as Record<string, T[]>)
  },

  // Удалить дубликаты
  unique: <T>(
    data: T[],
    keyFn: (item: T) => string
  ): T[] => {
    const seen = new Set<string>()
    return data.filter(item => {
      const key = keyFn(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}
```

**Когда использовать:**
- Фильтрация, сортировка, трансформация
- Обработка массивов и объектов
- Примеры: spacedRepetition, статистика

---

## 📐 Типизация функций сервиса

### Простая функция

```typescript
const getName = (): string => {
  return 'John'
}
```

### Функция с параметрами

```typescript
const getUser = (id: string): User => {
  return { id, name: 'John' }
}
```

### Async функция

```typescript
const fetchData = async (id: string): Promise<Data> => {
  return await fetch(`/api/${id}`).then(r => r.json())
}
```

### Функция с опциональными параметрами

```typescript
const getUsers = (filter?: string): User[] => {
  if (filter) {
    return users.filter(u => u.name.includes(filter))
  }
  return users
}
```

### Функция с дефолтным параметром

```typescript
const paginate = (data: any[], pageSize: number = 10) => {
  return data.slice(0, pageSize)
}
```

---

## 🔄 Обработка ошибок в сервисах

### Правильная обработка

```typescript
export const myService = {
  getData: async (id: string) => {
    try {
      // Логика здесь
      const data = await fetch(`/api/${id}`)
      return await data.json()
    } catch (error: any) {
      const errorMessage = error?.message || JSON.stringify(error)
      console.error('❌ Ошибка getData:', errorMessage)
      throw error  // Пробросить ошибку дальше
    }
  }
}
```

### Обработка в компоненте

```typescript
const MyComponent = () => {
  const handleFetch = async () => {
    try {
      const data = await myService.getData('123')
      // Использовать data
    } catch (error) {
      console.error('❌ Не удалось загрузить')
      // Показать пользователю сообщение об ошибке
    }
  }

  return <button onClick={handleFetch}>Загрузить</button>
}
```

---

## 📊 Полный пример: Lesson сервис

```typescript
// services/lessonService.ts

import { Lesson, LessonProgress } from '../types'
import { storageService } from './storageService'

const LESSONS_KEY = 'german_lessons_v1'
const PROGRESS_KEY_PREFIX = 'lesson_'

export const lessonService = {
  // CRUD операции
  getAllLessons: (): Lesson[] => {
    return storageService.get({ key: LESSONS_KEY, defaultValue: [] })
  },

  getLesson: (id: string): Lesson | null => {
    const lessons = lessonService.getAllLessons()
    return lessons.find(l => l.lesson_id === id) || null
  },

  saveLesson: (lesson: Lesson): void => {
    const lessons = lessonService.getAllLessons()
    const index = lessons.findIndex(l => l.lesson_id === lesson.lesson_id)
    
    if (index >= 0) {
      lessons[index] = lesson
    } else {
      lessons.push(lesson)
    }
    
    storageService.set({ key: LESSONS_KEY }, lessons)
  },

  deleteLesson: (id: string): void => {
    const lessons = lessonService.getAllLessons()
    const filtered = lessons.filter(l => l.lesson_id !== id)
    storageService.set({ key: LESSONS_KEY }, filtered)
  },

  // Прогресс
  getProgress: (lessonId: string): LessonProgress | null => {
    return storageService.get({
      key: `${PROGRESS_KEY_PREFIX}${lessonId}`,
      defaultValue: null
    })
  },

  saveProgress: (lessonId: string, progress: LessonProgress): void => {
    storageService.set(
      { key: `${PROGRESS_KEY_PREFIX}${lessonId}` },
      progress
    )
  }
}
```

---

## 🎓 Для новичков

Сервис — это объект с функциями для **бизнес-логики**:

```typescript
// НЕ компонент (UI)
const MyButton = () => <button>Нажми</button>

// НЕ сервис (логика)
export const myService = {
  // Функции для работы с данными
  getData: () => {},
  saveData: () => {},
  processData: () => {}
}
```

Компоненты используют сервисы для обработки логики!

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Готово к использованию ✅
