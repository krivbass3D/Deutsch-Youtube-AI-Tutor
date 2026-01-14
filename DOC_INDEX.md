# 📚 Полный индекс документации проекта

Все файлы документации организованы по категориям для быстрого доступа.

---

## 🚀 Быстрый старт

Если вы впервые в проекте, начните здесь:

1. **[README.md](./README.md)** ⭐ - Главная страница проекта
2. **[QUICKSTART.md](./QUICKSTART.md)** - Запуск за 5 минут
3. **[NEXT_STEPS.md](./NEXT_STEPS.md)** - Что делать дальше

---

## 🛠️ Для разработчиков

### Основная документация
- **[DEV_GUIDE.md](./DEV_GUIDE.md)** - Полное руководство разработчика
- **[CLAUDE_DEV_GUIDE.md](./CLAUDE_DEV_GUIDE.md)** - Руководство для Claude AI
- **[DEV_CHECKLIST.md](./DEV_CHECKLIST.md)** - Контрольные списки для разработки
- **[.claude-context.md](./.claude-context.md)** - Быстрый контекст для Claude

### Архитектура и структура
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Архитектура приложения
- **[FILES_STRUCTURE.md](./FILES_STRUCTURE.md)** - Структура файлов проекта
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Обзор проекта

### Методология и алгоритмы
- **[PEDAGOGICAL_GUIDE.md](./PEDAGOGICAL_GUIDE.md)** - Педагогический подход
- **[SPACED_REPETITION_GUIDE.md](./SPACED_REPETITION_GUIDE.md)** - Алгоритм интервального повторения

---

## 📋 Управление задачами

- **[TASKS.md](./TASKS.md)** - Текущие задачи и workflow
- **[SESSION_LOG.md](./SESSION_LOG.md)** - Журнал сессий разработки
- **[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)** - Дорожная карта развития

---

## 📝 История изменений

- **[CHANGELOG.md](./CHANGELOG.md)** - Подробная история изменений
- **[SUMMARY.md](./SUMMARY.md)** - Краткое резюме выполненных работ

---

## 🧪 Тестирование и отладка

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Руководство по тестированию
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Решение частых проблем

---

## 🗄️ База данных и миграция

- **[SUPABASE_MIGRATION_PLAN.md](./SUPABASE_MIGRATION_PLAN.md)** ⭐ - План миграции на Supabase
  - Полная схема базы данных
  - Пошаговый план миграции
  - Список файлов для создания
  - Тестирование и rollback

---

## 📂 Конфигурационные файлы

### Claude AI
- **[.clauderc](./.clauderc)** - Конфигурация для Claude
- **[.claude-context.md](./.claude-context.md)** - Контекст разработки

### VS Code
- **[.vscode/settings.json](./.vscode/settings.json)** - Настройки редактора
- **[.vscode/launch.json](./.vscode/launch.json)** - Конфигурация отладки
- **[.vscode/extensions.json](./.vscode/extensions.json)** - Рекомендуемые расширения

### Форматирование
- **[.prettierrc.js](./.prettierrc.js)** - Конфигурация Prettier
- **[.prettierignore](./.prettierignore)** - Игнорируемые файлы

---

## 📊 Структура документации по темам

### Начало работы
```
README.md → QUICKSTART.md → NEXT_STEPS.md
```

### Понимание проекта
```
PROJECT_OVERVIEW.md → ARCHITECTURE.md → FILES_STRUCTURE.md
```

### Разработка
```
DEV_GUIDE.md → DEV_CHECKLIST.md → TASKS.md → SESSION_LOG.md
```

### Работа с Claude
```
.claude-context.md → CLAUDE_DEV_GUIDE.md
```

### Миграция на Supabase
```
SUPABASE_MIGRATION_PLAN.md (всё в одном файле)
```

### Решение проблем
```
TROUBLESHOOTING.md → TESTING_GUIDE.md
```

---

## 🎯 Сценарии использования

### Сценарий 1: Новый разработчик присоединился к проекту

**Путь:**
1. Прочитать [README.md](./README.md) - понять что за проект
2. Следовать [QUICKSTART.md](./QUICKSTART.md) - запустить локально
3. Изучить [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - общая картина
4. Прочитать [ARCHITECTURE.md](./ARCHITECTURE.md) - как устроено
5. Открыть [DEV_GUIDE.md](./DEV_GUIDE.md) - как разрабатывать
6. Использовать [DEV_CHECKLIST.md](./DEV_CHECKLIST.md) при работе

---

### Сценарий 2: Разработка новой фичи

**Путь:**
1. Открыть [TASKS.md](./TASKS.md) - добавить задачу
2. Проверить [DEV_CHECKLIST.md](./DEV_CHECKLIST.md) - что нужно сделать
3. Разработать фичу
4. Обновить [SESSION_LOG.md](./SESSION_LOG.md) - записать что сделано
5. Обновить [CHANGELOG.md](./CHANGELOG.md) - зафиксировать изменения

---

### Сценарий 3: Проблема с кодом

**Путь:**
1. Открыть [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - найти решение
2. Если не помогло → проверить [TESTING_GUIDE.md](./TESTING_GUIDE.md)
3. Если всё еще не работает → спросить Claude с контекстом из [CLAUDE_DEV_GUIDE.md](./CLAUDE_DEV_GUIDE.md)

---

### Сценарий 4: Миграция на Supabase

**Путь:**
1. Прочитать [SUPABASE_MIGRATION_PLAN.md](./SUPABASE_MIGRATION_PLAN.md) полностью
2. Следовать фазам по порядку (0→1→2→3→4)
3. Тестировать на каждом этапе
4. Использовать rollback план если что-то пошло не так

---

### Сценарий 5: Работа с Claude AI

**Путь:**
1. Начать с [.claude-context.md](./.claude-context.md) - быстрый контекст
2. Для глубокого понимания → [CLAUDE_DEV_GUIDE.md](./CLAUDE_DEV_GUIDE.md)
3. При разработке держать открытым [DEV_CHECKLIST.md](./DEV_CHECKLIST.md)

---

## 📚 Быстрый доступ к информации

### "Как запустить проект?"
→ [QUICKSTART.md](./QUICKSTART.md)

### "Как устроено приложение?"
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

### "Где найти компонент X?"
→ [FILES_STRUCTURE.md](./FILES_STRUCTURE.md)

### "Как работает spaced repetition?"
→ [SPACED_REPETITION_GUIDE.md](./SPACED_REPETITION_GUIDE.md)

### "Что делать если ошибка X?"
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### "Как мигрировать на Supabase?"
→ [SUPABASE_MIGRATION_PLAN.md](./SUPABASE_MIGRATION_PLAN.md)

### "Что нужно проверить перед коммитом?"
→ [DEV_CHECKLIST.md](./DEV_CHECKLIST.md)

### "Какая история изменений?"
→ [CHANGELOG.md](./CHANGELOG.md)

### "Что планируется разработать?"
→ [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)

---

## 🔍 Поиск по темам

### Архитектура
- [ARCHITECTURE.md](./ARCHITECTURE.md) - общая архитектура
- [FILES_STRUCTURE.md](./FILES_STRUCTURE.md) - структура файлов
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - обзор

### API и сервисы
- [DEV_GUIDE.md](./DEV_GUIDE.md) - как работать с API
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - проблемы с API

### Данные и LocalStorage
- [ARCHITECTURE.md](./ARCHITECTURE.md) - как хранятся данные
- [SUPABASE_MIGRATION_PLAN.md](./SUPABASE_MIGRATION_PLAN.md) - миграция на Supabase
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - проблемы с данными

### TypeScript
- [DEV_GUIDE.md](./DEV_GUIDE.md) - работа с типами
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - ошибки TypeScript

### React
- [DEV_GUIDE.md](./DEV_GUIDE.md) - паттерны React
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - проблемы React

### Tailwind CSS
- [DEV_GUIDE.md](./DEV_GUIDE.md) - использование Tailwind
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - проблемы со стилями

### Тестирование
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - полное руководство
- [DEV_CHECKLIST.md](./DEV_CHECKLIST.md) - чеклисты тестирования

### Git workflow
- [DEV_CHECKLIST.md](./DEV_CHECKLIST.md) - git команды и workflow

---

## 📦 Файлы по статусу

### ✅ Готовые к использованию
- README.md
- QUICKSTART.md
- TESTING_GUIDE.md
- ARCHITECTURE.md
- FILES_STRUCTURE.md
- CHANGELOG.md
- SUMMARY.md
- NEXT_STEPS.md
- DEV_GUIDE.md
- PEDAGOGICAL_GUIDE.md
- SPACED_REPETITION_GUIDE.md
- PROJECT_OVERVIEW.md
- DEVELOPMENT_ROADMAP.md
- **SUPABASE_MIGRATION_PLAN.md** ⭐ NEW
- **DEV_CHECKLIST.md** ⭐ NEW
- **TROUBLESHOOTING.md** ⭐ NEW
- **CLAUDE_DEV_GUIDE.md** ⭐ NEW
- **.claude-context.md** ⭐ NEW
- **SESSION_LOG.md** ⭐ NEW
- **TASKS.md** ⭐ NEW

### 🔄 Регулярно обновляемые
- TASKS.md - текущие задачи
- SESSION_LOG.md - журнал сессий
- CHANGELOG.md - история изменений
- DEVELOPMENT_ROADMAP.md - планы развития

### 📋 Справочные
- DOC_INDEX.md (этот файл)
- TROUBLESHOOTING.md
- DEV_CHECKLIST.md

---

## 🎓 Рекомендуемый порядок изучения

### Для начинающих (День 1)
1. README.md (10 мин)
2. QUICKSTART.md (15 мин)
3. PROJECT_OVERVIEW.md (20 мин)
4. NEXT_STEPS.md (10 мин)

**Итого: ~1 час**

### Для разработчиков (День 2-3)
1. ARCHITECTURE.md (30 мин)
2. FILES_STRUCTURE.md (15 мин)
3. DEV_GUIDE.md (1 час)
4. PEDAGOGICAL_GUIDE.md (30 мин)
5. SPACED_REPETITION_GUIDE.md (30 мин)

**Итого: ~3 часа**

### Для продвинутых (Неделя 1)
1. Всё из выше
2. TESTING_GUIDE.md (30 мин)
3. DEV_CHECKLIST.md (20 мин)
4. TROUBLESHOOTING.md (по необходимости)
5. CLAUDE_DEV_GUIDE.md (1 час)
6. SUPABASE_MIGRATION_PLAN.md (2 часа)

**Итого: ~7+ часов**

---

## 🛠️ Инструменты и ресурсы

### Конфигурация для инструментов
- `.vscode/` - настройки VS Code
- `.prettierrc.js` - форматирование кода
- `.clauderc` - конфигурация Claude
- `tsconfig.json` - TypeScript
- `tailwind.config.js` - Tailwind CSS
- `vite.config.ts` - Vite bundler

### Внешние ресурсы
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vite.dev/guide/)
- [Supabase Docs](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)

---

## 📞 Поддержка

### Если нужна помощь:

1. **Проверьте документацию** - скорее всего ответ уже есть
2. **TROUBLESHOOTING.md** - распространенные проблемы
3. **Спросите Claude** - используйте CLAUDE_DEV_GUIDE.md для контекста
4. **Git history** - посмотрите как было раньше
5. **Создайте issue** - если нашли баг

---

## 🎯 Цели документации

Эта документация создана чтобы:

✅ Новый разработчик мог начать работу за 1 час
✅ Любую проблему можно решить за 10 минут с помощью TROUBLESHOOTING
✅ Claude мог эффективно помогать с разработкой
✅ Миграция на Supabase была понятна и безопасна
✅ Код был понятен через 6 месяцев
✅ Проект мог масштабироваться

---

## 📊 Статистика документации

| Метрика | Значение |
|---------|----------|
| Всего файлов документации | 20+ |
| Конфигурационных файлов | 8 |
| Строк документации | ~6000+ |
| Примеров кода | 100+ |
| Диаграмм и схем | 5+ |
| Чеклистов | 10+ |

---

## 🔄 Обновление документации

Документация должна обновляться:

- **При добавлении фичи** → обновить CHANGELOG.md, DEV_GUIDE.md
- **При изменении архитектуры** → обновить ARCHITECTURE.md
- **При нахождении новой проблемы** → добавить в TROUBLESHOOTING.md
- **При завершении задачи** → обновить TASKS.md, SESSION_LOG.md
- **При изменении структуры** → обновить FILES_STRUCTURE.md

---

## 📌 Важные заметки

⚠️ **Перед удалением файлов документации** убедитесь что информация продублирована в других местах

⚠️ **Держите .env в актуальном состоянии** но НИКОГДА не коммитьте его в git

⚠️ **Используйте DEV_CHECKLIST.md** при каждом коммите

⚠️ **Читайте SUPABASE_MIGRATION_PLAN.md** полностью перед миграцией

---

*Этот индекс обновляется автоматически при добавлении новой документации*

**Последнее обновление:** 14 января 2026
**Версия:** 2.0 (с Supabase migration планом)
