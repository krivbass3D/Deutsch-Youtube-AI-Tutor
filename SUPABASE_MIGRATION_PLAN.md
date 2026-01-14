 { success: true };
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    return { success: false, error };
  }
}

// Использование:
// await migrateLocalStorageToSupabase(currentUser.id);
```

### 6. Environment Variables

**Файл:** `.env` (добавить)
```bash
# Существующие
GEMINI_API_KEY=ваш_ключ

# Новые для Supabase
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_анонимный_ключ
VITE_SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ
```

### 7. Auth Context для React

**Файл:** `contexts/AuthContext.tsx`
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/supabase/auth';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверить текущего пользователя при загрузке
    authService.getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Слушать изменения auth
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 8. Login компонент

**Файл:** `components/Auth/Login.tsx`
```typescript
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Регистрация' : 'Вход'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {isSignUp ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:underline text-sm"
          >
            {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🧪 Тестирование

### Контрольный список тестирования:

**Фаза 1: Dual-write**
- [ ] Данные сохраняются в LocalStorage
- [ ] Данные сохраняются в Supabase
- [ ] При отключении Supabase - LocalStorage работает
- [ ] Нет потери данных

**Фаза 2: Миграция**
- [ ] Все уроки мигрированы
- [ ] Весь прогресс мигрирован
- [ ] Вся статистика мигрирована
- [ ] Количество записей совпадает

**Фаза 3: Чтение**
- [ ] Данные читаются из Supabase
- [ ] Fallback на LocalStorage работает
- [ ] Кэширование работает
- [ ] Офлайн режим работает

**Фаза 4: Полное переключение**
- [ ] LocalStorage больше не используется (кроме кэша)
- [ ] Все операции CRUD работают
- [ ] Real-time синхронизация работает
- [ ] Производительность приемлема

### Тестовые сценарии:

```typescript
// 1. Тест миграции
describe('Supabase Migration', () => {
  it('should migrate all lessons', async () => {
    const userId = 'test-user-id';
    const result = await migrateLocalStorageToSupabase(userId);
    expect(result.success).toBe(true);
  });

  it('should preserve data integrity', async () => {
    const localLessons = JSON.parse(localStorage.getItem('lessons_v1'));
    const { data: supabaseLessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('user_id', userId);
    
    expect(supabaseLessons.length).toBe(localLessons.length);
  });
});

// 2. Тест CRUD операций
describe('Supabase CRUD', () => {
  it('should create lesson', async () => {
    const lesson = { lesson_id: '999', title: 'Test' };
    await storage.saveLesson(lesson);
    
    const saved = await storage.getLessons();
    expect(saved.find(l => l.lesson_id === '999')).toBeDefined();
  });

  it('should update lesson progress', async () => {
    const progress = { vocabCompleted: true, completed: false };
    await storage.saveLessonProgress('1', progress);
    
    const saved = await storage.getLessonProgress('1');
    expect(saved.vocabCompleted).toBe(true);
  });
});
```

---

## ⚠️ Rollback План

Если что-то пойдёт не так, можно откатиться назад:

### Шаг 1: Отключить Supabase
```typescript
// В storageAdapter.ts переключить провайдера:
const storage = new StorageAdapter(new LocalStorageProvider());
```

### Шаг 2: Восстановить из бэкапа
```typescript
// Экспортировать данные из Supabase
const { data } = await supabase
  .from('lessons')
  .select('*')
  .eq('user_id', userId);

// Сохранить обратно в LocalStorage
localStorage.setItem('lessons_v1', JSON.stringify(data));
```

### Шаг 3: Удалить Supabase код
```bash
# Откатить изменения в git
git revert <commit-hash>

# Или удалить вручную файлы Supabase
rm -rf services/supabase
rm -rf services/storage
```

---

## 📊 Временные оценки

| Фаза | Время | Сложность |
|------|-------|-----------|
| 0. Подготовка | 1-2 часа | Легко |
| 1. Dual-write | 3-5 часов | Средне |
| 2. Миграция | 2-3 часа | Средне |
| 3. Чтение | 2-3 часа | Средне |
| 4. Переключение | 1-2 часа | Легко |
| 5. Новые фичи | 5+ часов | Сложно |
| **Итого** | **14-20 часов** | |

---

## ✅ Чеклист готовности

Перед началом миграции убедитесь:

- [ ] Есть аккаунт на Supabase
- [ ] Создан проект в Supabase
- [ ] Получены API ключи
- [ ] Установлен `@supabase/supabase-js`
- [ ] Создана схема БД в Supabase
- [ ] Настроен RLS (Row Level Security)
- [ ] Есть тестовый пользователь
- [ ] Создан бэкап LocalStorage данных
- [ ] Прочитана вся документация
- [ ] Выделено достаточно времени

---

## 🎯 Следующие шаги

1. **Прочитайте этот план полностью**
2. **Создайте проект в Supabase**
3. **Создайте все необходимые файлы** (список ниже)
4. **Следуйте фазам по порядку**
5. **Тестируйте на каждом шаге**

---

## 📝 Итоговый список файлов для создания

### Новые файлы:

1. `services/supabase/client.ts` - Клиент Supabase
2. `services/supabase/auth.ts` - Аутентификация
3. `services/storage/storageAdapter.ts` - Абстракция хранилища
4. `services/storage/localStorageProvider.ts` - LocalStorage провайдер
5. `services/storage/supabaseProvider.ts` - Supabase провайдер
6. `services/storage/dualWriteProvider.ts` - Dual-write логика
7. `services/migration/dataTransformer.ts` - Трансформация данных
8. `services/migration/validator.ts` - Валидация
9. `scripts/migrateToSupabase.ts` - Скрипт миграции
10. `contexts/AuthContext.tsx` - React контекст для auth
11. `components/Auth/Login.tsx` - Компонент входа
12. `components/Auth/Register.tsx` - Компонент регистрации
13. `hooks/useSupabase.ts` - Хук для Supabase
14. `utils/supabaseHelpers.ts` - Вспомогательные функции

### Модифицируемые файлы:

1. `App.tsx` - Добавить AuthProvider и миграцию
2. `services/progressTracker.ts` - Использовать StorageAdapter
3. `services/spacedRepetition.ts` - Использовать StorageAdapter
4. `services/vocabularyStatistics.ts` - Использовать StorageAdapter
5. `services/difficultyTracker.ts` - Использовать StorageAdapter
6. `.env` - Добавить Supabase ключи
7. `package.json` - Добавить зависимости

### SQL файлы:

1. `supabase/schema.sql` - Схема базы данных
2. `supabase/migrations/001_initial.sql` - Миграция
3. `supabase/seed.sql` - Тестовые данные (опционально)

---

## 🚀 Готовы начать?

Следуйте плану поэтапно, тестируйте на каждом шаге, и у вас всё получится!

**Удачи! 🎉**

---

*Последнее обновление: 14 января 2026 г.*
