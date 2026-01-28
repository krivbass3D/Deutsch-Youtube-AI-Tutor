
import React from 'react';
import { Vocabulary } from '../types';

interface VocabularyListProps {
  vocabulary: Vocabulary[];
  title?: string;
  className?: string;
  stats?: Record<string, any>;
  srState?: Record<string, any>;
  difficultWords?: Set<string>;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ 
  vocabulary, 
  title, 
  className = "", 
  stats,
  srState,
  difficultWords
}) => {
  if (!vocabulary || vocabulary.length === 0) {
    return (
      <div className={`text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 ${className}`}>
        <p className="text-slate-500">Словарь пуст</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'verb': return 'bg-blue-100 text-blue-700';
      case 'noun': return 'bg-green-100 text-green-700';
      case 'adjective': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getProgressWidth = (word: string) => {
    if (!stats || !stats[word]) return '0%';
    const correct = stats[word].correctAttempts || stats[word].correct || stats[word].correctAnswersInExam || 0;
    // Assume 5 correct attempts = mastered for visual purposes
    const percent = Math.min((correct / 5) * 100, 100);
    return `${percent}%`;
  };

  const isReviewNeeded = (word: string) => {
    if (!srState || !srState[word]) return false;
    const nextReview = srState[word].nextReview;
    return nextReview && new Date(nextReview).getTime() < Date.now();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="text-xl font-bold text-slate-800 mb-4">{title}</h3>}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Слово / Перевод</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Тип</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Прогресс</th>
            </tr>
          </thead>
          <tbody>
            {vocabulary.map((v, idx) => {
              const difficulty = difficultWords?.has(v.word);
              const review = isReviewNeeded(v.word);
              
              return (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center">
                          {v.word}
                          {difficulty && (
                            <i className="fa-solid fa-star text-amber-400 ml-2 text-[10px]" title="Сложное слово"></i>
                          )}
                          {review && (
                            <i className="fa-solid fa-clock-rotate-left text-blue-400 ml-2 text-[10px]" title="Пора повторить"></i>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">{v.translation}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getTypeColor(v.type)}`}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-end space-y-1">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: getProgressWidth(v.word) }}
                        ></div>
                      </div>
                      {stats?.[v.word] && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          {stats[v.word].correctAttempts || stats[v.word].correct || stats[v.word].correctAnswersInExam || 0} верных
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VocabularyList;
