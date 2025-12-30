
import { Lesson } from './types';

export const SYSTEM_PROMPT = `
# СИСТЕМНЫЙ ПРОМПТ: ИИ-РЕПЕТИТОР НЕМЕЦКОГО ЯЗЫКА

## ВАША РОЛЬ
Вы - терпеливый, дружелюбный и профессиональный репетитор немецкого языка.

## РЕЖИМ 1: ПРОВЕРКА УПРАЖНЕНИЙ
### ПРАВИЛА ОБРАТНОЙ СВЯЗИ ПРИ ПРАВИЛЬНОМ ОТВЕТЕ (КРИТИЧЕСКИ ВАЖНО)
Когда ученик отвечает ПРАВИЛЬНО:
- Отвечайте максимально КРАТКО.
- Начните с ✅ и одного слова: **Верно!**, **Правильно!**, **Отлично!** или **Точно!**.
- Можно добавить ОДНО короткое предложение (не более 10 слов) с похвалой конкретного аспекта (например: "Отличное использование Perfekt.").
- НИКАКИХ длинных объяснений или разборов, если всё верно.

### ПРИ ЧАСТИЧНОЙ ОШИБКЕ ИЛИ НЕВЕРНОМ ОТВЕТЕ
- 👍 Отмечайте успех в деталях.
- ❌ Указывайте на конкретную ошибку.
- 💡 Дайте подсказку, но не сразу правильный ответ.

## СТИЛЬ ОБЩЕНИЯ
- Используйте эмодзи (✅ ❌ 💡 📚 🔄 👍).
- Выделяйте **ключевые слова**.
- Используйте русские эквиваленты для падежей.
`;

export const INITIAL_LESSONS: Lesson[] = [
  {
    lesson_id: "1",
    title: "Знакомство (Kennenlernen)",
    vocabulary: [
      { word: "heißen", translation: "называться", type: "verb" },
      { word: "wohnen", translation: "жить", type: "verb" },
      { word: "der Name", translation: "имя", type: "noun" },
      { word: "aus", translation: "из", type: "phrase" },
      { word: "schön", translation: "прекрасно/красиво", type: "adjective" }
    ],
    exercises: [
      {
        title: "Упражнение 1. Простые предложения",
        tasks: ["Меня зовут Макс.", "Я живу в Берлине.", "Это мое имя.", "Я из Германии."]
      }
    ],
    answers: [
      {
        exercise: 1,
        solutions: ["Ich heiße Max.", "Ich wohne in Berlin.", "Das ist mein Name.", "Ich komme aus Deutschland."]
      }
    ]
  },
  {
    lesson_id: "2",
    title: "Модальные глаголы (Modalverben)",
    vocabulary: [
      { word: "können", translation: "мочь/уметь", type: "verb" },
      { word: "müssen", translation: "быть должным", type: "verb" },
      { word: "wollen", translation: "хотеть", type: "verb" },
      { word: "sprechen", translation: "говорить", type: "verb" },
      { word: "Deutsch", translation: "немецкий", type: "noun" }
    ],
    exercises: [
      {
        title: "Упражнение 1. Возможности и желания",
        tasks: ["Я могу говорить по-немецки.", "Он хочет учиться."]
      }
    ],
    answers: [
      {
        exercise: 1,
        solutions: ["Ich kann Deutsch sprechen.", "Er will lernen."]
      }
    ]
  }
];
