import React, { useEffect, useState } from 'react';
import { getLessonStatistics, getProblematicWords, getNeedHelpWords, formatTime, WordStatistics } from '../services/vocabularyStatistics';

interface StatisticsDashboardProps {
  lessonId: string;
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ lessonId }) => {
  const [totalStats, setTotalStats] = useState(getLessonStatistics(lessonId));
  const [problematic, setProblematic] = useState<WordStatistics[]>([]);
  const [needHelp, setNeedHelp] = useState<WordStatistics[]>([]);

  useEffect(() => {
    const stats = getLessonStatistics(lessonId);
    setTotalStats(stats);
    setProblematic(getProblematicWords(lessonId));
    setNeedHelp(getNeedHelpWords(lessonId));
  }, [lessonId]);

  if (totalStats.totalWordsStudied === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 italic">
        📊 Статистика пока пуста. Начните изучение слов!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Основная статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{totalStats.totalWordsStudied}</p>
          <p className="text-xs text-slate-600">слов изучено</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{totalStats.averageRepeatCount.toFixed(1)}</p>
          <p className="text-xs text-slate-600">средний повтор</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-2xl font-bold text-amber-700">{totalStats.wordsWithDifficulty}</p>
          <p className="text-xs text-slate-600">сложных слов</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">
            {totalStats.wordStats.size > 0
              ? formatTime(
                  Array.from(totalStats.wordStats.values() as any[]).reduce((sum: number, w: any) => sum + (w.totalTimeSpent || 0), 0)
                )
              : '0сек'}
          </p>
          <p className="text-xs text-slate-600">время обучения</p>
        </div>
      </div>

      {/* Проблемные слова */}
      {problematic.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center">
            <i className="fa-solid fa-exclamation-triangle text-red-500 mr-2"></i>
            Слова, требующие внимания ({problematic.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {problematic.map((word) => (
              <div
                key={word.word}
                className="bg-red-50 p-3 rounded-lg border border-red-200 flex justify-between items-center text-sm"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{word.word}</p>
                  <p className="text-xs text-slate-600">{word.translation}</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>🔄 {word.repeatCount} раз</p>
                  <p>⏱️ {formatTime(word.totalTimeSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Слова, где нужна помощь */}
      {needHelp.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center">
            <i className="fa-solid fa-heart text-pink-500 mr-2"></i>
            Слова, где нужна помощь ({needHelp.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {needHelp.map((word) => (
              <div
                key={word.word}
                className="bg-pink-50 p-3 rounded-lg border border-pink-200 flex justify-between items-center text-sm"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{word.word}</p>
                  <p className="text-xs text-slate-600">{word.translation}</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>💭 {word.correctAnswersInExam} правильных</p>
                  <p>⏱️ {formatTime(word.totalTimeSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Все слова с прогрессом */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 flex items-center">
          <i className="fa-solid fa-list text-blue-600 mr-2"></i>
          Все слова урока
        </h3>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {(Array.from(totalStats.wordStats.values() as any[]) as any[])
            .sort((a: any, b: any) => (b.repeatCount || 0) - (a.repeatCount || 0))
            .map((word: any) => (
              <div
                key={word.word}
                className={`p-2 rounded-lg text-xs flex justify-between items-center ${
                  (word.correctAnswersInExam || 0) > 0
                    ? 'bg-green-50 border border-green-200'
                    : word.isDifficult
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <div className="flex-1 flex gap-2">
                  <span className="font-semibold text-slate-800 min-w-[100px]">{word.word}</span>
                  <span className="text-slate-600 flex-1">{word.translation}</span>
                </div>
                <div className="flex gap-3 text-slate-600">
                  <span title="Количество повторов">🔄 {word.repeatCount || 0}</span>
                  <span title="Время на слово">⏱️ {formatTime(word.totalTimeSpent || 0)}</span>
                  {(word.correctAnswersInExam || 0) > 0 && (
                    <span title="Правильные ответы">✅ {word.correctAnswersInExam}</span>
                  )}
                  {word.isDifficult && (
                    <span title="Отмечено как сложное">⭐</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center pt-2">
        📊 Обновляется автоматически при изучении слов и прохождении экзамена
      </p>
    </div>
  );
};

export default StatisticsDashboard;
