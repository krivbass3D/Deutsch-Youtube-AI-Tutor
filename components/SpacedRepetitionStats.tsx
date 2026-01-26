/**
 * Компонент отображения статистики Spaced Repetition
 * Показывает прогресс обучения с использованием алгоритма SR
 */

import React from 'react';
import { Vocabulary } from '../types';
import { SRState } from '../services/spacedRepetition';

const SpacedRepetitionStats: React.FC<{ 
  vocabulary: Vocabulary[]; 
  srState: SRState;
  // We can pass difficult words set if needed, but SR state might have easeFactor info
}> = ({ vocabulary, srState }) => {
  
  const calculateStats = () => {
    let totalWords = vocabulary.length;
    let dueWords = 0;
    let learnedWords = 0;
    let difficultWords = 0;

    vocabulary.forEach(word => {
      const data = srState[word.word];
      if (data) {
        if (data.isDue) dueWords++;
        if (data.isLearned) learnedWords++;
        // We can check easeFactor < 2.5 or if we had a difficulty set passed
        // But let's rely on data.easeFactor or similar if we don't pass difficultWords
        // Actually, let's keep it simple. If we don't have difficult count here perfectly it's fine.
        // Or we can count "struggling" words based on failureCount > 0
        if (data.failureCount > 0) difficultWords++;
      } else {
        // New word, treat as due?
        dueWords++;
      }
    });

    return {
      totalWords,
      dueWords,
      learnedWords,
      difficultWords,
      readyPercent: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0,
      needRepeatPercent: totalWords > 0 ? Math.round((dueWords / totalWords) * 100) : 0
    };
  };

  const stats = calculateStats();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-800">🔄 Система повторений (Spaced Repetition)</h3>
        <p className="text-sm text-slate-600">Умное распределение времени на повторение слов</p>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Выученные слова */}
        <div className="bg-white rounded-2xl p-4 border-2 border-green-200">
          <div className="text-3xl font-bold text-green-600">{stats.learnedWords}</div>
          <div className="text-xs text-slate-600 mt-1">Выученные слова</div>
          <div className="text-xs text-green-600 font-semibold">{stats.readyPercent}% готово</div>
        </div>

        {/* Слова к повторению */}
        <div className="bg-white rounded-2xl p-4 border-2 border-amber-200">
          <div className="text-3xl font-bold text-amber-600">{stats.dueWords}</div>
          <div className="text-xs text-slate-600 mt-1">Пора повторять</div>
          <div className="text-xs text-amber-600 font-semibold">{stats.needRepeatPercent}% требует</div>
        </div>

        {/* Сложные слова */}
        <div className="bg-white rounded-2xl p-4 border-2 border-red-200">
          <div className="text-3xl font-bold text-red-600">{stats.difficultWords}</div>
          <div className="text-xs text-slate-600 mt-1">Ошибки</div>
          <div className="text-xs text-red-600 font-semibold">⭐ были ошибки</div>
        </div>

        {/* Всего слов */}
        <div className="bg-white rounded-2xl p-4 border-2 border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{stats.totalWords}</div>
          <div className="text-xs text-slate-600 mt-1">Всего в уроке</div>
          <div className="text-xs text-blue-600 font-semibold">📚 словарь</div>
        </div>
      </div>

      {/* Объяснение алгоритма */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">📋 Как это работает:</h4>
        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">1.</span>
            <span><strong>День 1:</strong> Первое повторение на следующий день</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span><strong>День 3:</strong> Второе повторение через 3 дня</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">3.</span>
            <span><strong>День 7:</strong> Третье повторение через 7 дней</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold">4.</span>
            <span><strong>День 14:</strong> Четвёртое повторение через 2 недели</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600 font-bold">5.</span>
            <span><strong>День 30:</strong> Пятое повторение — слово считается выученным! ✅</span>
          </li>
        </ul>
        
        <div className="mt-4 pt-4 border-t-2 border-slate-200 text-xs text-slate-600">
          <p>⚠️ <strong>Важно:</strong> Если вы ошибётесь, счётчик сбросится, и начнётся заново!</p>
        </div>
      </div>

      {/* Рекомендация */}
      <div className="bg-blue-100 rounded-2xl p-4 border-2 border-blue-300">
        <p className="text-sm text-blue-900">
          💡 <strong>Совет:</strong> Практикуйте слова в порядке приоритета SR. Сначала те, которые пора повторять, затем сложные, затем новые!
        </p>
      </div>
    </div>
  );
};

export default SpacedRepetitionStats;
