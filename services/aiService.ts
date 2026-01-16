/**
 * Универсальный AI сервис с выбором провайдера пользователем
 * Поддерживает: Gemini и OpenAI
 */

import { Lesson } from '../types';
import { SYSTEM_PROMPT } from '../constants';
import { getSelectedProvider } from '../components/AIProviderSelector';

// Типы провайдеров
type AIProvider = 'gemini' | 'openai';

// История сообщений
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Конвертировать историю в формат Gemini
 */
const convertToGeminiHistory = (messages: Message[]) => {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
};

/**
 * Конвертировать историю в формат OpenAI
 */
const convertToOpenAIHistory = (messages: Message[]) => {
  return messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
};

/**
 * Вызов Gemini API
 */
const callGeminiAPI = async (messages: Message[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY не настроен. Добавьте ключ в .env файл.');
  }

  const { GoogleGenAI } = await import('@google/genai');
  
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.0-flash';
  
  const history = convertToGeminiHistory(messages);
  
  const response = await ai.models.generateContent({
    model,
    contents: history,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });
  
  return response.text || '';
};

/**
 * Вызов OpenAI API
 */
const callOpenAIAPI = async (messages: Message[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY не настроен. Добавьте ключ в .env файл.');
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  
  const history = convertToOpenAIHistory(messages);
  
  // Добавляем системный промпт в начало
  const messagesWithSystem = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ];
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Универсальный метод вызова AI на основе выбора пользователя
 */
const callAI = async (messages: Message[]): Promise<string> => {
  const provider = getSelectedProvider();
  
  console.log(`🤖 Используем провайдер: ${provider}`);
  
  try {
    let response: string;
    
    if (provider === 'gemini') {
      response = await callGeminiAPI(messages);
    } else if (provider === 'openai') {
      response = await callOpenAIAPI(messages);
    } else {
      throw new Error('Неизвестный провайдер');
    }
    
    console.log(`✅ Успешный ответ от ${provider}`);
    return response;
  } catch (error: any) {
    console.error(`❌ Ошибка ${provider}:`, error);
    
    // Показать пользователю понятное сообщение об ошибке
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('API key') || errorMessage.includes('не настроен')) {
      throw new Error(
        `Ошибка: API ключ для ${provider === 'gemini' ? 'Google AI Studio' : 'ChatGPT'} не настроен. ` +
        `Пожалуйста, добавьте ${provider === 'gemini' ? 'VITE_GEMINI_API_KEY' : 'VITE_OPENAI_API_KEY'} в .env файл.`
      );
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      throw new Error(
        `Лимит запросов исчерпан для ${provider === 'gemini' ? 'Google AI Studio' : 'ChatGPT'}. ` +
        `Попробуйте переключиться на другой AI провайдер или подождите несколько минут.`
      );
    }
    
    // Остальные ошибки
    throw new Error(`Ошибка AI (${provider}): ${errorMessage}`);
  }
};

/**
 * Получить ответ репетитора на упражнение
 */
export const getTutorResponse = async (
  lesson: Lesson,
  currentExerciseIndex: number,
  currentTaskIndex: number,
  userAnswer: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  const currentExercise = lesson.exercises[currentExerciseIndex];
  const currentTask = currentExercise.tasks[currentTaskIndex];
  const correctAnswer = lesson.answers.find(
    a => a.exercise === currentExerciseIndex + 1
  )?.solutions[currentTaskIndex];
  
  const contextMessage = {
    lesson_id: lesson.lesson_id,
    title: lesson.title,
    vocabulary: lesson.vocabulary,
    current_exercise: currentExerciseIndex + 1,
    current_task: currentTask,
    user_answer: userAnswer,
    correct_answer: correctAnswer,
  };
  
  // Конвертировать историю в универсальный формат
  const messages: Message[] = [
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' as const : 'user' as const,
      content: h.parts[0].text,
    })),
    {
      role: 'user' as const,
      content: `Контекст текущего шага: ${JSON.stringify(contextMessage)}\n\nОтвет/Вопрос ученика: ${userAnswer}`,
    },
  ];
  
  try {
    const response = await callAI(messages);
    return response || 'Извините, я не смог сформировать ответ. Пожалуйста, попробуйте еще раз.';
  } catch (error: any) {
    console.error('❌ Критическая ошибка AI:', error);
    return `${error.message}`;
  }
};

/**
 * Получить общий ответ на вопрос ученика
 */
export const getGeneralResponse = async (
  lesson: Lesson,
  userQuestion: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  const contextMessage = {
    lesson_id: lesson.lesson_id,
    title: lesson.title,
    vocabulary: lesson.vocabulary,
  };
  
  // Конвертировать историю в универсальный формат
  const messages: Message[] = [
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' as const : 'user' as const,
      content: h.parts[0].text,
    })),
    {
      role: 'user' as const,
      content: `Контекст урока: ${JSON.stringify(contextMessage)}\n\nВопрос ученика: ${userQuestion}`,
    },
  ];
  
  try {
    const response = await callAI(messages);
    return response || 'Извините, я не смог ответить на ваш вопрос.';
  } catch (error: any) {
    console.error('❌ Критическая ошибка AI:', error);
    return `${error.message}`;
  }
};

/**
 * Получить название текущего провайдера
 */
export const getCurrentProviderName = (): string => {
  const provider = getSelectedProvider();
  return provider === 'gemini' ? 'Google AI Studio (Gemini)' : 'ChatGPT (GPT-4o mini)';
};
