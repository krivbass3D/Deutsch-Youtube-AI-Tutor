
import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponse, getGeneralResponse } from '../services/geminiService';
import { Lesson, ChatMessage } from '../types';

interface TutorChatProps {
  lesson: Lesson;
  currentExerciseIndex: number;
  currentTaskIndex: number;
  onSuccess: () => void;
}

const TutorChat: React.FC<TutorChatProps> = ({ lesson, currentExerciseIndex, currentTaskIndex, onSuccess }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputValue,
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
        inputValue,
        history
      );

      const modelMsg: ChatMessage = {
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, modelMsg]);

      // Simple heuristic for success detection if not provided by model (though prompt asks for ✅)
      if (responseText.includes('✅')) {
        // We don't automatically move on, we let user read feedback first
      }

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        role: 'model',
        content: "Произошла ошибка при связи с репетитором. Проверьте ключ API.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
        // Very basic markdown bold renderer
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
            <p key={i} className="mb-2 last:mb-0">
                {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part)}
            </p>
        );
    });
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-4 border-bottom border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">
                <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div>
                <h3 className="font-bold text-slate-800">Ваш репетитор</h3>
                <p className="text-xs text-green-500 font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> На связи
                </p>
            </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.length === 0 && (
            <div className="text-center py-10 px-6">
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 text-2xl">
                    <i className="fa-solid fa-comment-dots"></i>
                </div>
                <h4 className="font-bold text-slate-700 mb-2">Начнем практику!</h4>
                <p className="text-sm text-slate-500">
                    Переведите предложение выше и отправьте мне свой ответ. Я проверю его и помогу разобраться с ошибками.
                </p>
            </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderContent(msg.content)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ваш ответ или вопрос..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-2xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TutorChat;
