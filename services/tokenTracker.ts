// Отслеживание использования API запросов для Gemini (20 в день - бесплатный лимит)

export interface TokenUsage {
  requestCount: number;           // Количество API запросов
  dailyLimit: number;             // Дневной лимит (20 для бесплатного уровня)
  localValidationCount: number;   // Локальные валидации (не считаются)
  lastResetDate: string;          // Дата последнего сброса
}

const STORAGE_KEY = 'token_usage_v1';
const DAILY_REQUEST_LIMIT = 20; // Лимит на бесплатном уровне Gemini

/**
 * Проверить, новый ли день (нужен ли сброс счетчика)
 */
function isNewDay(lastResetDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return lastResetDate !== today;
}

/**
 * Получить или инициализировать использование токенов
 */
export function getOrInitializeTokenUsage(): TokenUsage {
  const saved = localStorage.getItem(STORAGE_KEY);
  const today = new Date().toISOString().split('T')[0];

  if (!saved) {
    const initial: TokenUsage = {
      requestCount: 0,
      dailyLimit: DAILY_REQUEST_LIMIT,
      localValidationCount: 0,
      lastResetDate: today,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  const usage: TokenUsage = JSON.parse(saved);
  
  // Миграция: если старый лимит (100000) - обновляем на новый (20)
  if (usage.dailyLimit !== DAILY_REQUEST_LIMIT) {
    usage.dailyLimit = DAILY_REQUEST_LIMIT;
  }

  // Если наступил новый день - сбросить счетчик
  if (isNewDay(usage.lastResetDate)) {
    usage.requestCount = 0;
    usage.localValidationCount = 0;
    usage.lastResetDate = today;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  return usage;
}

/**
 * Записать использование запроса к API
 */
export function trackAPIRequest(): TokenUsage {
  const usage = getOrInitializeTokenUsage();
  usage.requestCount += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  return usage;
}

/**
 * Записать локальную валидацию (не использует токены)
 */
export function trackLocalValidation(): TokenUsage {
  const usage = getOrInitializeTokenUsage();
  usage.localValidationCount += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  return usage;
}

/**
 * Получить процент использования запросов
 */
export function getUsagePercentage(): number {
  const usage = getOrInitializeTokenUsage();
  return Math.min(100, (usage.requestCount / usage.dailyLimit) * 100);
}

/**
 * Получить цвет индикатора
 */
export function getIndicatorColor(percentage: number): string {
  if (percentage < 50) return 'bg-green-100 text-green-700';
  if (percentage < 80) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

/**
 * Получить человеко-читаемый формат запросов
 */
export function formatTokens(requests: number): string {
  return requests.toString();
}

/**
 * Проверить нужно ли показывать предупреждение
 */
export function shouldShowWarning(usage: TokenUsage): boolean {
  const percentage = (usage.requestCount / usage.dailyLimit) * 100;
  return percentage >= 80;
}
