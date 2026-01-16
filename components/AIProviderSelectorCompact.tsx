import React, { useState, useEffect } from 'react';

type AIProvider = 'gemini' | 'openai';

const PROVIDER_STORAGE_KEY = 'selected_ai_provider';

export const AIProviderSelectorCompact: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(() => {
    const saved = localStorage.getItem(PROVIDER_STORAGE_KEY);
    return (saved as AIProvider) || 'gemini';
  });
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(PROVIDER_STORAGE_KEY, selectedProvider);
  }, [selectedProvider]);

  const providers = [
    {
      id: 'gemini' as AIProvider,
      name: 'Google AI Studio',
      shortName: 'Gemini',
      icon: '🔵',
    },
    {
      id: 'openai' as AIProvider,
      name: 'ChatGPT',
      shortName: 'ChatGPT',
      icon: '🟢',
    },
  ];

  const currentProvider = providers.find(p => p.id === selectedProvider);

  const handleSelect = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* Компактная кнопка */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-colors text-sm"
      >
        <span>{currentProvider?.icon}</span>
        <span className="font-medium text-gray-700">{currentProvider?.shortName}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] z-[101] py-1">
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => handleSelect(provider.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  selectedProvider === provider.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-lg">{provider.icon}</span>
                <span className="font-medium">{provider.name}</span>
                {selectedProvider === provider.id && (
                  <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const getSelectedProvider = (): AIProvider => {
  const saved = localStorage.getItem(PROVIDER_STORAGE_KEY);
  return (saved as AIProvider) || 'gemini';
};

export const setSelectedProvider = (provider: AIProvider): void => {
  localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
};
