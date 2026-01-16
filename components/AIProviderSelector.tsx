import React, { useState, useEffect } from 'react';

type AIProvider = 'gemini' | 'openai';

interface AIProviderSelectorProps {
  onProviderChange?: (provider: AIProvider) => void;
}

const PROVIDER_STORAGE_KEY = 'selected_ai_provider';

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({ onProviderChange }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(() => {
    // Загрузить из localStorage
    const saved = localStorage.getItem(PROVIDER_STORAGE_KEY);
    return (saved as AIProvider) || 'gemini';
  });
  
  const [isOpen, setIsOpen] = useState(false);

  // Сохранить выбор в localStorage
  useEffect(() => {
    localStorage.setItem(PROVIDER_STORAGE_KEY, selectedProvider);
    if (onProviderChange) {
      onProviderChange(selectedProvider);
    }
  }, [selectedProvider, onProviderChange]);

  const providers = [
    {
      id: 'gemini' as AIProvider,
      name: 'Google AI Studio',
      description: 'Gemini 2.0 Flash',
      icon: '🔵',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:bg-blue-50',
    },
    {
      id: 'openai' as AIProvider,
      name: 'ChatGPT',
      description: 'GPT-4o mini',
      icon: '🟢',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:bg-green-50',
    },
  ];

  const currentProvider = providers.find(p => p.id === selectedProvider);

  const handleSelect = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Кнопка выбора провайдера */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-md border-2 border-gray-200 transition-all ${
          isOpen ? 'border-blue-500 shadow-lg' : 'hover:border-gray-300 hover:shadow-lg'
        }`}
      >
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentProvider?.color} flex items-center justify-center text-xl shadow-inner`}>
          {currentProvider?.icon}
        </div>
        
        <div className="flex-1 text-left">
          <div className="font-bold text-gray-900 text-sm">
            {currentProvider?.name}
          </div>
          <div className="text-xs text-gray-500">
            {currentProvider?.description}
          </div>
        </div>
        
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <>
          {/* Overlay для закрытия при клике вне */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Меню */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden z-20 animate-fade-in">
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => handleSelect(provider.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  selectedProvider === provider.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : `${provider.hoverColor} border-l-4 border-transparent`
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center text-xl shadow-inner`}>
                  {provider.icon}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900 text-sm">
                    {provider.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {provider.description}
                  </div>
                </div>
                
                {selectedProvider === provider.id && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
            
            {/* Информация */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                💡 <span className="font-medium">Совет:</span> Выбор сохраняется автоматически
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Экспортируем функцию для получения текущего выбранного провайдера
export const getSelectedProvider = (): AIProvider => {
  const saved = localStorage.getItem(PROVIDER_STORAGE_KEY);
  return (saved as AIProvider) || 'gemini';
};

// Экспортируем функцию для установки провайдера программно
export const setSelectedProvider = (provider: AIProvider): void => {
  localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  // Триггерим событие для обновления всех компонентов
  window.dispatchEvent(new CustomEvent('providerChanged', { detail: provider }));
};
