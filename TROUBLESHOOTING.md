# 🐛 Распространенные проблемы и их решения

## Содержание
1. [Проблемы с запуском](#проблемы-с-запуском)
2. [Ошибки TypeScript](#ошибки-typescript)
3. [Проблемы с UI](#проблемы-с-ui)
4. [Проблемы с данными](#проблемы-с-данными)
5. [Проблемы с API](#проблемы-с-api)
6. [Проблемы с build](#проблемы-с-build)

---

## Проблемы с запуском

### ❌ `npm run dev` не запускается

**Симптомы:**
```
Error: Cannot find module 'vite'
```

**Решение:**
```bash
# Переустановить зависимости
rm -rf node_modules
rm package-lock.json
npm install
```

---

### ❌ Порт 5173 уже занят

**Симптомы:**
```
Port 5173 is in use, trying another one...
```

**Решение 1:** Убить процесс на порту
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5173
kill -9 <PID>
```

**Решение 2:** Изменить порт в `vite.config.ts`
```typescript
export default defineConfig({
  server: {
    port: 3000, // Другой порт
  }
});
```

---

### ❌ Module not found ошибки

**Симптомы:**
```
Error: Cannot find module '@/components/...'
```

**Решение:**
Проверить пути в `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## Ошибки TypeScript

### ❌ Type 'X' is not assignable to type 'Y'

**Причина:** Несоответствие типов

**Решение:**
```typescript
// ❌ Неправильно
const lesson: Lesson = someData; // someData не Lesson

// ✅ Правильно
const lesson: Lesson = {
  lesson_id: someData.id,
  title: someData.title,
  vocabulary: someData.vocabulary || [],
  exercises: someData.exercises || [],
  answers: someData.answers || []
};
```

---

### ❌ Property 'X' does not exist on type 'Y'

**Причина:** Обращение к несуществующему свойству

**Решение:**
```typescript
// ❌ Неправильно
const name = user.name; // name не определено в типе

// ✅ Решение 1: Добавить в тип
interface User {
  id: string;
  name: string; // Добавили
}

// ✅ Решение 2: Optional chaining
const name = user?.name;

// ✅ Решение 3: Type assertion (осторожно!)
const name = (user as any).name;
```

---

### ❌ Object is possibly 'null' or 'undefined'

**Причина:** TypeScript strict null checks

**Решение:**
```typescript
// ❌ Неправильно
const length = data.length; // data может быть null

// ✅ Решение 1: Optional chaining
const length = data?.length;

// ✅ Решение 2: Проверка
if (data) {
  const length = data.length;
}

// ✅ Решение 3: Nullish coalescing
const length = data?.length ?? 0;
```

---

### ❌ 'useState' is not defined

**Причина:** Забыли импортировать

**Решение:**
```typescript
// ❌ Неправильно
const [state, setState] = useState(0);

// ✅ Правильно
import { useState } from 'react';
const [state, setState] = useState(0);
```

---

## Проблемы с UI

### ❌ Tailwind классы не работают

**Причина 1:** Неправильная конфигурация

**Решение:**
Проверить `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Важно!
  ],
  // ...
}
```

**Причина 2:** Динамические классы

```typescript
// ❌ Не работает
const color = 'red';
className={`text-${color}-500`} // Tailwind не видит

// ✅ Работает
const color = 'red';
className={color === 'red' ? 'text-red-500' : 'text-blue-500'}

// ✅ Или используйте полные классы
const colorClasses = {
  red: 'text-red-500',
  blue: 'text-blue-500'
};
className={colorClasses[color]}
```

---

### ❌ Компонент не обновляется при изменении state

**Причина:** Мутация state напрямую

**Решение:**
```typescript
// ❌ Неправильно - мутация
const handleClick = () => {
  items.push(newItem);
  setItems(items); // React не видит изменений
};

// ✅ Правильно - новый массив
const handleClick = () => {
  setItems([...items, newItem]);
};

// ✅ Для объектов
const handleClick = () => {
  setUser({ ...user, name: 'New Name' });
};
```

---

### ❌ Бесконечный цикл useEffect

**Причина:** Неправильные зависимости

**Решение:**
```typescript
// ❌ Бесконечный цикл
useEffect(() => {
  setCount(count + 1); // Обновляет count
}, [count]); // count в зависимостях!

// ✅ Правильно
useEffect(() => {
  setCount(prev => prev + 1); // Functional update
}, []); // Пустой массив

// ✅ Или убрать из зависимостей если не нужно
useEffect(() => {
  // Выполнится один раз
}, []);
```

---

### ❌ "Warning: Each child in a list should have a unique key"

**Причина:** Отсутствует key prop в списках

**Решение:**
```typescript
// ❌ Неправильно
{items.map(item => (
  <div>{item.name}</div>
))}

// ✅ Правильно
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// ⚠️ Избегайте index как key если список может меняться
{items.map((item, index) => (
  <div key={index}>{item.name}</div> // Плохо для динамических списков
))}
```

---

## Проблемы с данными

### ❌ localStorage.getItem возвращает null

**Причина 1:** Данные не сохранены

**Решение:**
```typescript
// Проверить наличие
const data = localStorage.getItem('key');
if (data) {
  const parsed = JSON.parse(data);
} else {
  // Инициализировать дефолтные данные
  const defaultData = [];
  localStorage.setItem('key', JSON.stringify(defaultData));
}
```

**Причина 2:** Приватный режим браузера

**Решение:**
```typescript
// Проверить доступность localStorage
try {
  const testKey = '__test__';
  localStorage.setItem(testKey, 'test');
  localStorage.removeItem(testKey);
  console.log('✅ localStorage доступен');
} catch (e) {
  console.error('❌ localStorage недоступен (приватный режим?)');
  // Использовать fallback (например, in-memory storage)
}
```

---

### ❌ JSON.parse() выдает ошибку

**Причина:** Некорректный JSON

**Решение:**
```typescript
// ❌ Небезопасно
const data = JSON.parse(localStorage.getItem('key'));

// ✅ Безопасно с try-catch
try {
  const raw = localStorage.getItem('key');
  const data = raw ? JSON.parse(raw) : null;
} catch (error) {
  console.error('Ошибка парсинга JSON:', error);
  // Очистить поврежденные данные
  localStorage.removeItem('key');
  const data = null;
}
```

---

### ❌ Данные теряются после перезагрузки

**Причина 1:** Не сохраняются в localStorage

**Решение:**
```typescript
// Добавить логирование
const saveData = (data) => {
  console.log('💾 Сохранение данных:', data);
  localStorage.setItem('key', JSON.stringify(data));
  console.log('✅ Данные сохранены');
};
```

**Причина 2:** Cookies отключены

**Решение:**
Проверить в браузере: Settings → Privacy → Cookies (должны быть включены)

---

### ❌ QuotaExceededError: LocalStorage limit exceeded

**Причина:** Превышен лимит 5-10 MB

**Решение:**
```typescript
// Проверить размер данных
const getLocalStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return (total / 1024).toFixed(2) + ' KB';
};

console.log('📦 Размер localStorage:', getLocalStorageSize());

// Очистить старые данные
const clearOldData = () => {
  // Удалить неиспользуемые ключи
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('old_')) {
      localStorage.removeItem(key);
    }
  });
};
```

---

## Проблемы с API

### ❌ API ключ не работает

**Причина 1:** Ключ не в `.env`

**Решение:**
```bash
# Создать .env если нет
GEMINI_API_KEY=ваш_ключ_здесь
```

**Причина 2:** Неправильное имя переменной

**Решение:**
```typescript
// ❌ Неправильно
const apiKey = process.env.GEMINI_API_KEY; // Не работает в Vite

// ✅ Правильно для Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// В .env: VITE_GEMINI_API_KEY=...
```

**Причина 3:** Dev сервер не перезапущен

**Решение:**
```bash
# После изменения .env ОБЯЗАТЕЛЬНО перезапустить
Ctrl+C
npm run dev
```

---

### ❌ CORS ошибка

**Симптомы:**
```
Access to fetch at 'https://api...' has been blocked by CORS policy
```

**Решение:**
```typescript
// Добавить прокси в vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

---

### ❌ API возвращает 401 Unauthorized

**Причина:** Неверный или отсутствующий API ключ

**Решение:**
```typescript
// Проверить наличие ключа
console.log('🔑 API Key:', import.meta.env.VITE_GEMINI_API_KEY ? '✅ Есть' : '❌ Нет');

// Проверить headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`
};
console.log('📤 Headers:', headers);
```

---

### ❌ API возвращает 429 Too Many Requests

**Причина:** Превышен лимит запросов

**Решение:**
```typescript
// Добавить debounce
import { debounce } from 'lodash';

const debouncedApiCall = debounce(async (query) => {
  await apiCall(query);
}, 1000); // 1 секунда

// Добавить rate limiting
let lastCallTime = 0;
const MIN_DELAY = 1000; // мс

const rateLimitedApiCall = async (query) => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_DELAY - timeSinceLastCall)
    );
  }
  
  lastCallTime = Date.now();
  return await apiCall(query);
};
```

---

## Проблемы с build

### ❌ `npm run build` падает с ошибкой

**Причина:** TypeScript ошибки

**Решение:**
```bash
# Проверить TypeScript
npx tsc --noEmit

# Исправить все ошибки
# Затем
npm run build
```

---

### ❌ Build большого размера

**Симптомы:**
```
dist/assets/index-abc123.js  500 kB
```

**Решение:**
```typescript
// Анализировать bundle
npm install -D rollup-plugin-visualizer

// В vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

// После build откроется граф зависимостей
npm run build
```

---

### ❌ Build работает, но в production не работает

**Причина:** Переменные окружения

**Решение:**
```bash
# Для production создать .env.production
VITE_API_URL=https://production-api.com
VITE_GEMINI_API_KEY=production_key

# Build с production переменными
npm run build
```

---

## Общие советы по отладке

### 1. Используйте console.log стратегически

```typescript
// ✅ Хорошо
console.log('🔍 Входные данные:', inputData);
console.log('⚙️ Обработка...');
console.log('✅ Результат:', result);

// ❌ Плохо
console.log(inputData); // Непонятно что это
```

### 2. React DevTools

- Установите [React DevTools](https://react.dev/learn/react-developer-tools)
- Inspect компонентов
- Просмотр props и state
- Profiler для performance

### 3. Breakpoints в DevTools

```typescript
// В коде добавить
debugger; // Остановит выполнение

// Или в Chrome DevTools:
// Sources → Найти файл → Кликнуть на номер строки
```

### 4. Network Tab в DevTools

- Смотрите все HTTP запросы
- Проверяйте headers
- Смотрите response
- Проверяйте timing

### 5. Application Tab в DevTools

- LocalStorage
- SessionStorage
- Cookies
- Cache

---

## Когда ничего не помогает

1. **Очистить всё и начать заново**
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

2. **Очистить browser cache**
- Ctrl+Shift+Delete
- Или Hard Reload: Ctrl+Shift+R

3. **Проверить в другом браузере**
- Chrome / Firefox / Safari
- Приватное окно

4. **Откатить изменения в git**
```bash
git stash
# Проверить работает ли
git stash pop # Вернуть изменения
```

5. **Спросить Claude** 😊
Предоставьте:
- Описание проблемы
- Код где ошибка
- Сообщение об ошибке
- Что уже пробовали

---

*Этот документ будет обновляться с новыми проблемами и решениями*
