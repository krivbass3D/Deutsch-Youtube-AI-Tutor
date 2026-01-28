
import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponse } from '../services/aiService';
import { validateAnswer } from '../services/validationService';
import { trackAPIRequest, trackLocalValidation } from '../services/tokenTracker';
import { Lesson, ChatMessage } from '../types';

interface TutorChatProps {
  lesson: Lesson;
  lessonId: string;
  currentExerciseIndex: number;
  currentTaskIndex: number;
  onFeedback: (isCorrect: boolean, userAnswer: string) => void;
  onExerciseAttempt: (isCorrect: boolean, isFirstAttempt: boolean) => void;
  resetChat?: number; // timestamp to clear chat
}

const TutorChat: React.FC<TutorChatProps> = ({ 
  lesson, 
  lessonId, 
  currentExerciseIndex, 
  currentTaskIndex, 
  onFeedback, 
  onExerciseAttempt,
  resetChat 
}) => {
  const currentTask = lesson.exercises[currentExerciseIndex]?.tasks[currentTaskIndex];
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firstAttemptTracker, setFirstAttemptTracker] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);



  // Отслеживать первую попытку при смене упражнения/задачи
  useEffect(() => {
    const exerciseKey = `${currentExerciseIndex}_${currentTaskIndex}`;
    setFirstAttemptTracker(prev => {
      // Если для этой задачи еще нет записи, значит это ПЕРВАЯ попытка
      if (prev[exerciseKey] === undefined) {
        return { ...prev, [exerciseKey]: true };
      }
      return prev;
    });
  }, [currentExerciseIndex, currentTaskIndex]);

  useEffect(() => {
    setMessages([]);
    // При сбросе чата (кнопкой Сначала) или смене задачи, 
    // если это не программная смена, мы можем хотеть сбросить трекер, 
    // но сейчас мы просто очищаем сообщения.
  }, [resetChat, currentExerciseIndex, currentTaskIndex]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const currentInput = inputValue;
    const userMsg: ChatMessage = {
      role: 'user',
      content: currentInput,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Получаем правильный ответ из данных урока
      const currentExercise = lesson.exercises[currentExerciseIndex];
      
      // Safety check: ensure answers array exists
      if (!lesson.answers) {
        console.warn('⚠️ Lesson answers array is missing!');
      }

      const correctAnswerObj = lesson.answers?.find(a => a.exercise === (currentExerciseIndex + 1));
      const correctAnswer = correctAnswerObj?.solutions?.[currentTaskIndex];

      console.log('🔍 Debug Validation:', {
        userInput: currentInput,
        expected: correctAnswer,
        exerciseIndex: currentExerciseIndex,
        taskIndex: currentTaskIndex,
        answersAvailable: !!lesson.answers
      });

      // 🚀 Сначала проверяем локально (без API)
      if (typeof correctAnswer === 'string') {
        const validationResult = validateAnswer(currentInput, correctAnswer);
        
        if (validationResult && !validationResult.shouldCallAPI) {
          // Ответ проверен локально - показываем результат БЕЗ API
          const modelMsg: ChatMessage = {
            role: 'model',
            content: validationResult.message,
            timestamp: Date.now(),
          };

          setMessages(prev => [...prev, modelMsg]);
          onFeedback(validationResult.isCorrect, currentInput);
          trackLocalValidation(); // 📊 Запись локальной валидации

          // 📈 Записываем результат через callback
          const exerciseKey = `${currentExerciseIndex}_${currentTaskIndex}`;
          const wasFirstAttempt = firstAttemptTracker[exerciseKey] === true;
          
          onExerciseAttempt(validationResult.isCorrect, wasFirstAttempt);
          
          // Отмечаем, что первая попытка уже использована
          setFirstAttemptTracker(prev => ({
            ...prev,
            [exerciseKey]: false
          }));

          setIsLoading(false);
          return;
        }
      } else {
        console.warn('⚠️ Correct answer not found locally for this task. Falling back to AI.');
      }

      // Если локальная валидация не прошла - вызываем API
      // Ограничиваем историю последними 3 сообщениями для экономии токенов
      const history = messages
        .slice(-3)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      // 📊 Записываем запрос ПЕРЕД вызовом API (в случае ошибки тоже считаем)
      trackAPIRequest();

      const responseText = await getTutorResponse(
        lesson,
        currentExerciseIndex,
        currentTaskIndex,
        currentInput,
        history
      );

      const modelMsg: ChatMessage = {
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, modelMsg]);

      const isCorrect = responseText.includes('✅');
      if (isCorrect) {
        onFeedback(true, currentInput);
      } else if (responseText.includes('❌') || responseText.includes('🤔')) {
        onFeedback(false, currentInput);
      }

      // 📈 Записываем результат через callback
      const exerciseKey = `${currentExerciseIndex}_${currentTaskIndex}`;
      const wasFirstAttempt = firstAttemptTracker[exerciseKey] === true;
      
      onExerciseAttempt(isCorrect, wasFirstAttempt);
      
      // Отмечаем, что первая попытка уже использована
      setFirstAttemptTracker(prev => ({
        ...prev,
        [exerciseKey]: false
      }));

    } catch (error: any) {
      console.error(error);
      
      let errorContent = "Произошла ошибка при связи с репетитором.";
      
      // Обработка ошибки превышения лимита API
      const errorMessage = error?.message || JSON.stringify(error);
      
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('exceeded your current quota')) {
        const retryMatch = errorMessage.match(/Retry in ([\d.]+)s/i);
        const retryTime = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
        errorContent = `⏳ Лимит запросов к AI превышен.\n\nПопробуйте через ${retryTime} секунд или обновите API ключ на платный тариф.\n\n🔗 https://ai.google.dev/pricing`;
      } else if (errorMessage.includes('API_KEY')) {
        errorContent = '❌ Ошибка: API ключ не установлен или неверный.\n\nУбедитесь, что переменная окружения API_KEY установлена.';
      }
      
      const errorMsg: ChatMessage = {
        role: 'model',
        content: errorContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
            <p key={i} className="mb-2 last:mb-0">
                {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part)}
            </p>
        );
    });
  };

  return (
    <div className="flex flex-col h-[500px] lg:h-[600px] w-full bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between relative">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">
                <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div>
                <h3 className="font-bold text-slate-800">Репетитор</h3>
                <p className="text-xs text-green-500 font-medium">Онлайн</p>
            </div>
        </div>

        {/* Task Hint - Always visible in the chat header area or just below it */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 max-w-[50%] hidden sm:block">
            <div className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg">
                <p className="text-[10px] font-bold text-blue-400 uppercase leading-none mb-1">Задача:</p>
                <p className="text-xs font-bold text-blue-700 truncate">{currentTask}</p>
            </div>
        </div>
      </div>

      {/* Persistent Task Label for Mobile (visible at the top of scroll area) */}
      {currentTask && (
        <div className="sm:hidden bg-blue-50/80 backdrop-blur-sm border-b border-blue-100 px-4 py-2 flex items-center space-x-2 shrink-0">
          <i className="fa-solid fa-language text-blue-400 text-xs"></i>
          <p className="text-xs font-bold text-blue-700 italic">«{currentTask}»</p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.length === 0 && (
            <div className="text-center py-6 px-4">
                <p className="text-sm text-slate-500">Отправьте перевод, я проверю!</p>
            </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-100'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{renderContent(msg.content)}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl border border-slate-100"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Перевод..."
          className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl disabled:opacity-50"
        >
          <i className="fa-solid fa-paper-plane text-xs"></i>
        </button>
      </form>
    </div>
  );
};

export default TutorChat;
