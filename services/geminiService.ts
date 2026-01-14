import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { Lesson } from "../types";

// ИСПРАВЛЕНО: используем правильное имя переменной окружения для Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY отсутствует в .env файле!");
  console.log("📝 Добавьте в .env: VITE_GEMINI_API_KEY=your_key_here");
}

const ai = new GoogleGenAI({ apiKey });

export const getTutorResponse = async (
  lesson: Lesson,
  currentExerciseIndex: number,
  currentTaskIndex: number,
  userAnswer: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[]
) => {
  if (!apiKey) {
    throw new Error("API key is missing. Please add VITE_GEMINI_API_KEY to your .env file");
  }

  const currentExercise = lesson.exercises[currentExerciseIndex];
  const currentTask = currentExercise.tasks[currentTaskIndex];
  const correctAnswer = lesson.answers.find(a => a.exercise === (currentExerciseIndex + 1))?.solutions[currentTaskIndex];

  const contextMessage = {
    lesson_id: lesson.lesson_id,
    title: lesson.title,
    vocabulary: lesson.vocabulary,
    current_exercise: currentExerciseIndex + 1,
    current_task: currentTask,
    user_answer: userAnswer,
    correct_answer: correctAnswer
  };

  const model = "gemini-2.0-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: `Контекст текущего шага: ${JSON.stringify(contextMessage)}\n\nОтвет/Вопрос ученика: ${userAnswer}` }] }
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    }
  });

  return response.text || "Извините, я не смог сформировать ответ. Пожалуйста, попробуйте еще раз.";
};

export const getGeneralResponse = async (
  lesson: Lesson,
  userQuestion: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[]
) => {
  if (!apiKey) {
    throw new Error("API key is missing. Please add VITE_GEMINI_API_KEY to your .env file");
  }

  const contextMessage = {
    lesson_id: lesson.lesson_id,
    title: lesson.title,
    vocabulary: lesson.vocabulary
  };

  const model = "gemini-2.0-flash";

  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history,
      { role: 'user', parts: [{ text: `Контекст урока: ${JSON.stringify(contextMessage)}\n\nВопрос ученика: ${userQuestion}` }] }
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    }
  });

  return response.text || "Извините, я не смог ответить на ваш вопрос.";
};
