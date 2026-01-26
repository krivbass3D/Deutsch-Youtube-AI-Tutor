# 🚨 Error Handling - Обработка ошибок

> Паттерны для правильной обработки ошибок в React приложении

---

## 🎯 Основной паттерн обработки ошибок

```typescript
import React, { useState } from 'react'

const MyComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  const handleFetch = async () => {
    // 1. Сброс состояния
    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      // 2. Основная операция
      const response = await fetch('/api/data')
      
      // 3. Проверка успеха
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // 4. Парсинг результата
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      // 5. Обработка ошибки
      const errorMessage = err?.message || JSON.stringify(err)
      setError(errorMessage)
      console.error('❌ Ошибка:', errorMessage)
    } finally {
      // 6. Финализация
      setIsLoading(false)
    }
  }

  // 7. Отображение
  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div className="text-red-500">Ошибка: {error}</div>
  if (!data) return <button onClick={handleFetch}>Загрузить</button>

  return <div>{JSON.stringify(data)}</div>
}

export default MyComponent
```

---

## 🔍 Типы ошибок и обработка

### Ошибка 1: Ошибка сети (Network Error)

```typescript
// Когда: Нет интернета, сервер недоступен

try {
  const response = await fetch('/api/data')
  // ...
} catch (error: any) {
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    // Это ошибка сети
    console.error('❌ Нет интернета или сервер недоступен')
    return 'Проверьте интернет и попробуйте снова'
  }
}
```

### Ошибка 2: HTTP ошибка (4xx, 5xx)

```typescript
// Когда: Сервер вернул ошибку

const response = await fetch('/api/data')

if (!response.ok) {
  const errorData = await response.json().catch(() => ({}))
  
  if (response.status === 400) {
    // Bad Request
    throw new Error(`Неправильные данные: ${errorData.message}`)
  } else if (response.status === 401) {
    // Unauthorized
    throw new Error('Нужна авторизация')
  } else if (response.status === 404) {
    // Not Found
    throw new Error('Ресурс не найден')
  } else if (response.status === 429) {
    // Rate limit
    throw new Error('Слишком много запросов. Подождите.')
  } else if (response.status >= 500) {
    // Server error
    throw new Error('Ошибка сервера. Попробуйте позже.')
  } else {
    throw new Error(`Ошибка ${response.status}`)
  }
}
```

### Ошибка 3: JSON парсинг ошибка

```typescript
// Когда: Ответ не валидный JSON

const response = await fetch('/api/data')
const data = await response.json()  // Может выбросить ошибку!

// Правильно:
try {
  const data = await response.json()
  console.log(data)
} catch (error) {
  console.error('❌ Ошибка парсинга JSON:', error)
  throw new Error('Неправильный формат ответа')
}
```

### Ошибка 4: Timeout (слишком долгое ожидание)

```typescript
// Когда: API отвечает очень долго

const fetchWithTimeout = async (url: string, timeout: number = 5000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('Запрос истёк (timeout)')
    }
    throw error
  }
}
```

### Ошибка 5: Ошибка валидации данных

```typescript
// Когда: Данные не проходят валидацию

interface User {
  id: string
  name: string
  email: string
}

const parseUser = (data: any): User => {
  if (!data.id || typeof data.id !== 'string') {
    throw new Error('Неправильный id')
  }
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Неправильное имя')
  }
  if (!data.email || typeof data.email !== 'string') {
    throw new Error('Неправильный email')
  }

  return data as User
}

try {
  const user = parseUser(receivedData)
  console.log(user)
} catch (error: any) {
  console.error('❌ Ошибка валидации:', error.message)
}
```

---

## 🎯 Паттерны по типам операций

### Паттерн 1: Простой try-catch

```typescript
try {
  // Код, который может выбросить ошибку
  const result = someFunction()
  console.log('✅ Успех:', result)
} catch (error: any) {
  // Обработка ошибки
  console.error('❌ Ошибка:', error?.message || error)
} finally {
  // Выполняется в любом случае
  console.log('🏁 Готово')
}
```

### Паттерн 2: Async операция с состояниями

```typescript
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
const [errorMsg, setErrorMsg] = useState<string>('')

const fetchData = async () => {
  setStatus('loading')
  setErrorMsg('')

  try {
    const data = await fetch('/api/data').then(r => r.json())
    // Использовать data
    setStatus('success')
  } catch (error: any) {
    setErrorMsg(error?.message || 'Неизвестная ошибка')
    setStatus('error')
  }
}

return (
  <div>
    {status === 'loading' && <p>Загрузка...</p>}
    {status === 'error' && <p className="text-red-500">{errorMsg}</p>}
    {status === 'success' && <p>Успешно загружено</p>}
  </div>
)
```

### Паттерн 3: Retry логика (повторить операцию)

```typescript
const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Попытка ${attempt}/${maxRetries}`)
      return await fn()
    } catch (error: any) {
      lastError = error
      console.warn(`❌ Попытка ${attempt} не удалась:`, error.message)

      if (attempt < maxRetries) {
        console.log(`⏳ Ожидаю ${delay}мс перед повтором...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Ошибка после ${maxRetries} попыток: ${lastError?.message}`)
}

// Использование
try {
  const data = await retryAsync(
    () => fetch('/api/data').then(r => r.json()),
    3,  // максимум 3 попытки
    1000  // задержка 1 секунда между попытками
  )
} catch (error) {
  console.error('❌ Все попытки неудачны:', error)
}
```

### Паттерн 4: Error Boundary (для React)

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  constructor(props: {}) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Ошибка в компоненте:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <h2>Что-то пошло не так</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Использование в App.tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

---

## 📋 Типизация ошибок

### Неправильно (без типизации)

```typescript
// ❌ НЕ ДЕЛАЙ ТАК
try {
  // ...
} catch (error) {
  console.log(error.message)  // error может быть null!
}
```

### Правильно (с типизацией)

```typescript
// ✅ ДЕЛАЙ ТАК
try {
  // ...
} catch (error: any) {
  const message = error?.message || JSON.stringify(error)
  console.error(message)
}

// ИЛИ ещё лучше:
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error(String(error))
  }
}
```

---

## 🎨 Отображение ошибок пользователю

### Паттерн 1: Простое сообщение

```typescript
const [error, setError] = useState<string | null>(null)

if (error) {
  return (
    <div className="p-4 bg-red-100 border border-red-500 rounded text-red-700">
      {error}
    </div>
  )
}
```

### Паттерн 2: С кнопкой повтора

```typescript
{error && (
  <div className="p-4 bg-red-100 text-red-700 rounded">
    <p>{error}</p>
    <button
      onClick={() => fetchData()}
      className="mt-2 px-3 py-1 bg-red-700 text-white rounded"
    >
      Повторить
    </button>
  </div>
)}
```

### Паттерн 3: Toast уведомление

```typescript
// Простая реализация
const showError = (message: string) => {
  const toast = document.createElement('div')
  toast.className = 'fixed bottom-4 right-4 p-4 bg-red-500 text-white rounded'
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// Использование
try {
  await fetch('/api/data')
} catch (error: any) {
  showError(error.message)
}
```

---

## 🔐 Безопасность при обработке ошибок

### ❌ НЕ ПОКАЗЫВАЙ пользователю:

```typescript
// ❌ НЕПРАВИЛЬНО: показываешь путь на сервере
console.error('❌ Ошибка в /var/www/app/services/api.ts')

// ❌ НЕПРАВИЛЬНО: показываешь структуру БД
console.error('❌ Table "users" not found in database')

// ❌ НЕПРАВИЛЬНО: показываешь API ключи
console.error('❌ API_KEY=sk_test_12345 not valid')
```

### ✅ ПОКАЗЫВАЙ пользователю:

```typescript
// ✅ ПРАВИЛЬНО: общее сообщение
const userMessage = 'Не удалось загрузить данные. Попробуйте позже.'

// ✅ ПРАВИЛЬНО: для разработчика в консоли
console.error('❌ Ошибка при запросе:', error)
```

---

## 📊 Полный пример: Gemini API с обработкой ошибок

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

export const geminiService = {
  getTutorResponse: async (
    lessonContext: any,
    userAnswer: string,
    history: any[]
  ): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('API ключ не найден в .env')
    }

    try {
      const client = new GoogleGenerativeAI(apiKey)
      const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: userAnswer }]
          }
        ]
      })

      return response.response.text()
    } catch (error: any) {
      const message = error?.message || JSON.stringify(error)

      // Специфичные ошибки Gemini
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('API лимит достигнут. Попробуйте позже.')
      }

      if (message.includes('403') || message.includes('PERMISSION_DENIED')) {
        throw new Error('Проблема с API ключом. Проверьте .env')
      }

      if (message.includes('400') || message.includes('INVALID_ARGUMENT')) {
        throw new Error('Неправильный формат запроса')
      }

      // Общая ошибка
      console.error('❌ Ошибка Gemini API:', error)
      throw new Error('Не удалось получить ответ от AI репетитора')
    }
  }
}
```

---

## 🎓 Для новичков

Ошибки — это **нормальная часть разработки**:

```
❌ Ошибка НЕ ЗНАЧИТ что код плохой
✅ Ошибка ЗНАЧИТ что код честный (рассказал что не так)

Хороший код:
1. Предусматривает возможные ошибки
2. Ловит их с try-catch
3. Показывает понятное сообщение пользователю
4. Логирует для разработчика

Плохой код:
1. Падает с крашем
2. Показывает непонятные ошибки
3. Оставляет приложение в ломанном состоянии
```

**Всегда используй try-catch!** ✅

---

**Последнее обновление:** 25 января 2026  
**Версия:** 1.0.0  
**Статус:** Готово к использованию ✅
