
import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponse } from '../services/geminiService';
import { Lesson, ChatMessage } from '../types';

interface TutorChatProps {
  lesson: Lesson;
  currentExerciseIndex: number;
  currentTaskIndex: number;
  onFeedback: (isCorrect: boolean, userAnswer: string) => void;
  resetChat?: number; // timestamp to clear chat
}

const TutorChat: React.FC<TutorChatProps> = ({ lesson, currentExerciseIndex, currentTaskIndex, onFeedback, resetChat }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
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
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

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

      if (responseText.includes('✅')) {
        onFeedback(true, currentInput);
      } else if (responseText.includes('❌') || responseText.includes('🤔')) {
        onFeedback(false, currentInput);
      }

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        role: 'model',
        content: "Произошла ошибка при связи с репетитором.",
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
      <div className="bg-slate-50 p-4 border-bottom border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">
                <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div>
                <h3 className="font-bold text-slate-800">Репетитор</h3>
                <p className="text-xs text-green-500 font-medium">Онлайн</p>
            </div>
        </div>
      </div>

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
