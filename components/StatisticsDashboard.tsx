import React, { useState } from 'react';
import { Vocabulary, Lesson, LessonProgress } from '../types';
import { 
  WordStatistics, 
  VocabStatsState, 
  calculateAggregateStats, 
  formatTime 
} from '../services/vocabularyStatistics';
import SpacedRepetitionStats from './SpacedRepetitionStats';
import { SRState } from '../services/spacedRepetition';

interface StatisticsDashboardProps {
  lessonId: string;
  vocabulary: Vocabulary[];
  vocabStats: VocabStatsState;
  srState: SRState;
  progress: LessonProgress;
  lesson: Lesson;
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ 
  lessonId, 
  vocabulary, 
  vocabStats,
  srState,
  progress,
  lesson
}) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'practice'>('vocab');

  // Calculate aggregated stats for vocabulary
  const aggStats = calculateAggregateStats(vocabStats);
  
  // Helper to filter words
  const getProblematic = (): WordStatistics[] => {
    return Object.values(vocabStats)
      .filter((w: WordStatistics) => w.repeatCount >= 3 || w.isDifficult)
      .sort((a: WordStatistics, b: WordStatistics) => b.repeatCount - a.repeatCount);
  };

  const problematic = getProblematic();

  // Practice Statistics Helpers
  const totalSentences = lesson.exercises.reduce((acc, ex) => acc + (ex.tasks?.length || 0), 0);
  const learnedCount = progress.learnedTasks?.length || 0;
  const completionPercentage = totalSentences > 0 ? Math.round((learnedCount / totalSentences) * 100) : 0;

  const getTaskStatus = (exIdx: number, taskIdx: number) => {
    const taskId = `${exIdx}_${taskIdx}`;
    const statsKey = `${exIdx}-${taskIdx}`;
    
    if (progress.learnedTasks?.includes(taskId)) return 'learned'; // ✅
    if (progress.statistics.answers[statsKey]) return 'attempted'; // 📝
    
    // Check if it's the current task or a future one
    if (exIdx < progress.currentExerciseIdx || (exIdx === progress.currentExerciseIdx && taskIdx <= progress.currentTaskIdx)) {
        return 'attempted';
    }
    
    return 'locked'; // 🔒
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-xs mx-auto">
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'vocab' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <i className="fa-solid fa-book-open mr-2"></i> Слова
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'practice' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <i className="fa-solid fa-pen-to-square mr-2"></i> Практика
        </button>
      </div>

      {activeTab === 'vocab' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Spaced Repetition Content */}
          <SpacedRepetitionStats vocabulary={vocabulary} srState={srState} />
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{aggStats.totalWordsStudied}</p>
              <p className="text-xs text-slate-600">слов изучено</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-2xl font-bold text-green-700">{aggStats.averageRepeatCount.toFixed(1)}</p>
              <p className="text-xs text-slate-600">средний повтор</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-2xl font-bold text-amber-700">{aggStats.wordsWithDifficulty}</p>
              <p className="text-xs text-slate-600">сложных слов</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">
                {Object.values(vocabStats).length > 0
                  ? formatTime(Object.values(vocabStats).reduce((sum, w: any) => sum + (w.totalTimeSpent || 0), 0))
                  : '0сек'}
              </p>
              <p className="text-xs text-slate-600">время обучения</p>
            </div>
          </div>

          {/* Problematic Words */}
          {problematic.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center">
                <i className="fa-solid fa-exclamation-triangle text-red-500 mr-2"></i>
                Слова, требующие внимания ({problematic.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {problematic.map((word) => (
                  <div key={word.word} className="bg-red-50 p-3 rounded-lg border border-red-200 flex justify-between items-center text-sm shadow-sm">
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

          {/* All Words */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center">
              <i className="fa-solid fa-list text-blue-600 mr-2"></i>
              Все слова урока
            </h3>
            <div className="space-y-1 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {Object.values(vocabStats)
                .sort((a: any, b: any) => (b.repeatCount || 0) - (a.repeatCount || 0))
                .map((word: any) => (
                  <div key={word.word} className={`p-2 rounded-lg text-xs flex justify-between items-center ${
                    (word.correctAnswersInExam || 0) > 0 ? 'bg-green-50 border border-green-200' : word.isDifficult ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'
                  }`}>
                    <div className="flex-1 flex gap-2">
                      <span className="font-semibold text-slate-800 min-w-[100px]">{word.word}</span>
                      <span className="text-slate-600 flex-1">{word.translation}</span>
                    </div>
                    <div className="flex gap-3 text-slate-600">
                      <span title="Повторов">🔄 {word.repeatCount || 0}</span>
                      {(word.correctAnswersInExam || 0) > 0 && <span title="Экзамен">✅ {word.correctAnswersInExam}</span>}
                      {word.isDifficult && <span>⭐</span>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Practice Summary Score */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * completionPercentage) / 100}
                  className="text-blue-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{completionPercentage}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Выучено</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-green-50 border border-green-100 p-3 rounded-2xl">
                    <p className="text-lg font-black text-green-600">{progress.statistics.correct}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Верно</p>
                </div>
                <div className="bg-red-50 border border-red-100 p-3 rounded-2xl">
                    <p className="text-lg font-black text-red-600">{progress.statistics.incorrect}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ошибок</p>
                </div>
            </div>
          </div>

          {/* Detailed Sentence List */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center">
              <i className="fa-solid fa-quote-left text-blue-600 mr-2"></i>
              Предложения урока ({totalSentences})
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {lesson.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="space-y-2">
                  <div className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {ex.title}
                  </div>
                  {ex.tasks.map((task, taskIdx) => {
                    const status = getTaskStatus(exIdx, taskIdx);
                    return (
                      <div key={taskIdx} className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                        status === 'learned' ? 'bg-green-50 border-green-100' : status === 'attempted' ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                           status === 'learned' ? 'bg-green-500 text-white' : status === 'attempted' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'
                         }`}>
                           {status === 'learned' ? <i className="fa-solid fa-check"></i> : status === 'attempted' ? <i className="fa-solid fa-pen"></i> : <i className="fa-solid fa-lock"></i>}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className={`text-sm font-medium truncate ${status === 'locked' ? 'text-slate-400' : 'text-slate-800'}`}>{task}</p>
                           {status === 'learned' && <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Выучено с первой попытки!</p>}
                         </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center pt-2">
        📊 Обновляется автоматически при изучении слов и прохождении практики
      </p>
    </div>
  );
};

export default StatisticsDashboard;
