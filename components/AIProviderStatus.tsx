import React, { useState, useEffect } from 'react';
import { getProviderInfo, resetProviders } from '../services/aiService';

export const AIProviderStatus: React.FC = () => {
  const [info, setInfo] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshInfo = () => {
    const providerInfo = getProviderInfo();
    setInfo(providerInfo);
  };

  useEffect(() => {
    refreshInfo();
    
    // Обновлять каждые 5 секунд
    const interval = setInterval(refreshInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (!info) return null;

  const currentProviderInfo = info.providers.find(
    (p: any) => p.name === info.current
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Компактный индикатор */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer bg-white rounded-lg shadow-lg p-3 flex items-center gap-2 hover:shadow-xl transition-shadow"
      >
        <div
          className={`w-3 h-3 rounded-full ${
            currentProviderInfo?.available ? 'bg-green-500' : 'bg-red-500'
          } animate-pulse`}
        />
        <span className="text-sm font-medium text-gray-700">
          AI: {info.current === 'gemini' ? 'Gemini' : 'OpenAI'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
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
      </div>

      {/* Развёрнутая информация */}
      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">AI Provider Status</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Текущий провайдер */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-blue-900">Активный:</span>
              <span className="text-blue-700">
                {info.current === 'gemini' ? '🟢 Gemini' : '🟠 OpenAI'}
              </span>
            </div>
          </div>

          {/* Список всех провайдеров */}
          <div className="space-y-2">
            {info.providers.map((provider: any) => (
              <div
                key={provider.name}
                className={`p-3 rounded-lg border-2 ${
                  provider.name === info.current
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize">
                    {provider.name === 'gemini' ? 'Google Gemini' : 'OpenAI GPT'}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      provider.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {provider.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>API Key:</span>
                    <span
                      className={
                        provider.hasApiKey ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {provider.hasApiKey ? '✓ Set' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span
                      className={
                        provider.errorCount > 0 ? 'text-orange-600' : 'text-gray-500'
                      }
                    >
                      {provider.errorCount}
                    </span>
                  </div>
                  {provider.lastError && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
                      <div className="font-medium">Last Error:</div>
                      <div className="text-xs break-words">
                        {provider.lastError.substring(0, 100)}
                        {provider.lastError.length > 100 ? '...' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Кнопки управления */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshInfo();
              }}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
            >
              🔄 Обновить
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetProviders();
                refreshInfo();
              }}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              ↺ Сбросить
            </button>
          </div>

          {/* Справка */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <div className="font-medium mb-1">ℹ️ Информация:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Gemini используется по умолчанию</li>
              <li>При исчерпании лимита автоматически переключается на OpenAI</li>
              <li>После 3 ошибок провайдер помечается недоступным</li>
              <li>Кнопка "Сбросить" восстанавливает все провайдеры</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
