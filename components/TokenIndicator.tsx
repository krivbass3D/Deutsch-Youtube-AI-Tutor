import React, { useState, useEffect } from 'react';
import {
  getOrInitializeTokenUsage,
  getUsagePercentage,
  getIndicatorColor,
  formatTokens,
  shouldShowWarning,
  TokenUsage,
} from '../services/tokenTracker';

const TokenIndicator: React.FC = () => {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [percentage, setPercentage] = useState(0);

  // Обновить состояние при загрузке и периодически
  useEffect(() => {
    const updateUsage = () => {
      const currentUsage = getOrInitializeTokenUsage();
      setUsage(currentUsage);
      setPercentage(getUsagePercentage());
    };

    updateUsage();

    // Обновлять каждые 10 секунд (для синхронизации между вкладками)
    const interval = setInterval(updateUsage, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!usage) return null;

  const colorClass = getIndicatorColor(percentage);
  const requestsUsed = usage.requestCount;
  const requestsLimit = usage.dailyLimit;
  const remainingRequests = usage.dailyLimit - usage.requestCount;
  const isWarning = shouldShowWarning(usage);

  return (
    <div className="flex items-center gap-2">
      {/* Компактный badge */}
      <div
        className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass} border border-current cursor-help`}
        title={`Локальная валидация: ${usage.localValidationCount} (токены не использованы)`}
      >
        📊 {requestsUsed} / {requestsLimit}
      </div>

      {/* Предупреждение если мало запросов */}
      {isWarning && (
        <div className="hidden sm:block text-red-600 text-xs font-bold animate-pulse">
          ⚠️ {remainingRequests} запросов осталось
        </div>
      )}
    </div>
  );
};

export default TokenIndicator;
