/**
 * Универсальный AI сервис с автоматическим переключением между провайдерами
 * Поддерживает: Gemini (основной) → OpenAI (резервный)
 */

import { Lesson } from '../types';
import { SYSTEM_PROMPT } from '../constants';

// Динамический импорт Toast (избегаем циклических зависимостей)
let showToastFn: ((message: string, type: 'info' | 'warning' | 'success' | 'error') => void) | null = null;

export const setToastFunction = (fn: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void) => {
  showToastFn = fn;
};

// Типы провайдеров
type AIProvider = 'gemini' | 'openai';

// История сообщений
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Конфигурация провайдера
interface ProviderConfig {
  apiKey: string;
  isAvailable: boolean;
  errorCount: number;
  lastError?: string;
}

// Хранилище конфигураций
const providers: Record<AIProvider, ProviderConfig> = {
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    isAvailable: true,
    errorCount: 0,
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    isAvailable: true,
    errorCount: 0,
  },
};

// Текущий активный провайдер
let currentProvider: AIProvider = 'gemini';

// Максимальное количество ошибок до переключения
const MAX_ERRORS = 3;

/**
 * Проверить доступность провайдера
 */
const isProviderAvailable = (provider: AIProvider): boolean => {
  const config = providers[provider];
  return config.apiKey !== '' && config.isAvailable && config.errorCount < MAX_ERRORS;
};

/**
 * Получить следующий доступный провайдер
 */
const getNextProvider = (currentProvider: AIProvider): AIProvider | null => {
  const providerList: AIProvider[] = ['gemini', 'openai'];
  
  for (const provider of providerList) {
    if (provider !== currentProvider && isProviderAvailable(provider)) {
      return provider;
    }
  }
  
  return null;
};

/**
 * Пометить провайдер как недоступный
 */
const markProviderUnavailable = (provider: AIProvider, error: string) => {
  providers[provider].errorCount++;
  providers[provider].lastError = error;
  
  console.warn(`⚠️ Провайдер ${provider} ошибка #${providers[provider].errorCount}:`, error);
  
  if (providers[provider].errorCount >= MAX_ERRORS) {
    providers[provider].isAvailable = false;
    console.error(`❌ Провайдер ${provider} помечен как недоступный`);
  }
};

/**
 * Переключиться на следующий провайдер
 */
const switchProvider = (): boolean => {
  const nextProvider = getNextProvider(currentProvider);
  
  if (nextProvider) {
    const providerNames = {
      gemini: 'Google Gemini',
      openai: 'OpenAI GPT',
    };
    
    console.log(`🔄 Переключение с ${currentProvider} на ${nextProvider}`);
    
    // Показать уведомление пользователю
    if (showToastFn) {
      showToastFn(
        `AI провайдер изменён: ${providerNames[currentProvider]} → ${providerNames[nextProvider]}`,
        'warning'
      );
    }
    
    currentProvider = nextProvider;
    return true;
  }
  
  console.error('❌ Нет доступных провайдеров!');
  
  // Показать критическое уведомление
  if (showToastFn) {
    showToastFn(
      'Все AI провайдеры недоступны. Проверьте API ключи и лимиты.',
      'error'
    );
  }
  
  return false;
};

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
  const { GoogleGenAI } = await import('@google/genai');
  
  const ai = new GoogleGenAI({ apiKey: providers.gemini.apiKey });
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
  const apiKey = providers.openai.apiKey;
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
      model: 'gpt-4o-mini', // Или gpt-4o для лучшего качества
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
 * Универсальный метод вызова AI с автоматическим переключением
 */
const callAI = async (messages: Message[]): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 2; // Gemini + OpenAI
  
  while (attempts < maxAttempts) {
    try {
      console.log(`🤖 Попытка ${attempts + 1}: используем ${currentProvider}`);
      
      let response: string;
      
      if (currentProvider === 'gemini') {
        response = await callGeminiAPI(messages);
      } else if (currentProvider === 'openai') {
        response = await callOpenAIAPI(messages);
      } else {
        throw new Error('Неизвестный провайдер');
      }
      
      // Успешный ответ
      console.log(`✅ Успешный ответ от ${currentProvider}`);
      
      // Сбросить счётчик ошибок при успехе
      providers[currentProvider].errorCount = 0;
      
      return response;
    } catch (error: any) {
      console.error(`❌ Ошибка ${currentProvider}:`, error);
      
      // Проверить специфичные ошибки лимита
      const errorMessage = error.message || error.toString();
      const isQuotaError = 
        errorMessage.includes('quota') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('Resource has been exhausted');
      
      if (isQuotaError) {
        console.warn(`⚠️ Лимит исчерпан для ${currentProvider}`);
        markProviderUnavailable(currentProvider, errorMessage);
        
        // Попытаться переключиться
        if (switchProvider()) {
          attempts++;
          continue; // Попробовать следующий провайдер
        } else {
          throw new Error('Все AI провайдеры недоступны. Проверьте API ключи и лимиты.');
        }
      } else {
        // Не quota ошибка - пробросить дальше
        throw error;
      }
    }
  }
  
  throw new Error('Не удалось получить ответ от AI после всех попыток');
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
    return `Извините, произошла ошибка при обработке вашего ответа: ${error.message}. Пожалуйста, попробуйте позже.`;
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
    return `Извините, произошла ошибка: ${error.message}. Пожалуйста, попробуйте позже.`;
  }
};

/**
 * Получить информацию о текущем провайдере (для отладки)
 */
export const getProviderInfo = () => {
  return {
    current: currentProvider,
    providers: Object.entries(providers).map(([name, config]) => ({
      name,
      available: isProviderAvailable(name as AIProvider),
      errorCount: config.errorCount,
      lastError: config.lastError,
      hasApiKey: config.apiKey !== '',
    })),
  };
};

/**
 * Сбросить счётчики ошибок (для отладки)
 */
export const resetProviders = () => {
  Object.keys(providers).forEach(key => {
    const provider = key as AIProvider;
    providers[provider].errorCount = 0;
    providers[provider].isAvailable = true;
    providers[provider].lastError = undefined;
  });
  currentProvider = 'gemini';
  console.log('✅ Провайдеры сброшены');
};
