import React, { useMemo, useState } from 'react';
import { Lesson, Vocabulary } from '../types';

interface GlobalVocabularyProps {
  lessons: Lesson[];
  userStates: any[];
  onBack: () => void;
}

interface GroupedVocabulary {
  lessonId: string;
  lessonTitle: string;
  words: Vocabulary[];
  isCompleted: boolean;
}

const GlobalVocabulary: React.FC<GlobalVocabularyProps> = ({ lessons, userStates, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Aggregate user data
  const { aggregatedStats, allDifficultWords } = useMemo(() => {
    const statsMap: Record<string, any> = {};
    const diffSet = new Set<string>();

    userStates.forEach(state => {
      const vStats = state.vocabulary_stats || {};
      const diffWords = state.difficult_words || [];
      diffWords.forEach((w: string) => diffSet.add(w));
      
      Object.keys(vStats).forEach(word => {
        if (!statsMap[word]) statsMap[word] = { correct: 0, attempts: 0 };
        statsMap[word].correct += vStats[word].correctAttempts || vStats[word].correct || vStats[word].correctAnswersInExam || 0;
        statsMap[word].attempts += vStats[word].attempts || 0;
      });
    });

    return { aggregatedStats: statsMap, allDifficultWords: diffSet };
  }, [userStates]);

  // Group vocabulary by lesson
  const groupedVocab = useMemo(() => {
    const groups: GroupedVocabulary[] = lessons.map(lesson => ({
      lessonId: lesson.lesson_id,
      lessonTitle: lesson.title,
      words: lesson.vocabulary || [],
      isCompleted: userStates.find(s => s.lesson_id === lesson.lesson_id)?.progress?.completed || false
    }));

    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return groups.map(group => ({
        ...group,
        words: group.words.filter(v => 
          v.word.toLowerCase().includes(query) || 
          v.translation.toLowerCase().includes(query)
        )
      })).filter(group => group.words.length > 0);
    }

    return groups;
  }, [lessons, userStates, searchQuery]);

  const toggleLesson = (lessonId: string) => {
    const next = new Set(expandedLessons);
    if (next.has(lessonId)) next.delete(lessonId);
    else next.add(lessonId);
    setExpandedLessons(next);
  };

  const getProgressWidth = (word: string) => {
    const stats = aggregatedStats[word];
    if (!stats) return '0%';
    const correct = stats.correct || 0;
    const percent = Math.min((correct / 5) * 100, 100);
    return `${percent}%`;
  };

  const totalWordCount = useMemo(() => 
    lessons.reduce((acc, l) => acc + (l.vocabulary?.length || 0), 0),
    [lessons]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button 
            onClick={onBack}
            className="group mb-4 flex items-center text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mr-2 group-hover:border-blue-200 transition-all">
                <i className="fa-solid fa-arrow-left"></i>
            </div>
            Назад в Dashboard
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <i className="fa-solid fa-book-open text-xl"></i>
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Мой словарь</h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Все слова из пройденных уроков ({totalWordCount})
                </p>
            </div>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
          <input 
            type="text" 
            placeholder="Поиск слова или перевода..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-400 shadow-sm transition-all font-medium text-slate-700 placeholder:text-slate-300"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {groupedVocab.map((group) => {
          const isExpanded = expandedLessons.has(group.lessonId) || searchQuery.trim() !== '';
          
          return (
            <div key={group.lessonId} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button 
                onClick={() => toggleLesson(group.lessonId)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${group.isCompleted ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                    <i className={`fa-solid ${group.isCompleted ? 'fa-circle-check' : 'fa-list-ul'}`}></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 leading-tight">{group.lessonTitle}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {group.words.length} слов
                    </p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 transition-transform ${isExpanded ? 'rotate-180 bg-slate-100' : ''}`}>
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-3 md:px-6 py-3">Слово / Перевод</th>
                        <th className="px-3 md:px-6 py-3 text-center w-16 md:w-24">Тип</th>
                        <th className="px-3 md:px-6 py-3 text-right">Прогресс</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.words.map((v, idx) => {
                        const isDifficult = allDifficultWords.has(v.word);
                        return (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 md:px-6 py-4">
                              <div className="font-bold text-slate-800 flex items-center flex-wrap">
                                {v.word}
                                {isDifficult && (
                                  <i className="fa-solid fa-star text-amber-400 ml-2 text-[10px]"></i>
                                )}
                              </div>
                              <div className="text-sm text-slate-500 line-clamp-1">{v.translation}</div>
                            </td>
                            <td className="px-3 md:px-6 py-4 text-center">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-black text-slate-500 rounded uppercase tracking-wider">
                                {v.type}
                              </span>
                            </td>
                            <td className="px-3 md:px-6 py-4">
                              <div className="flex justify-end">
                                <div className="w-12 sm:w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-700"
                                    style={{ width: getProgressWidth(v.word) }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {groupedVocab.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-magnifying-glass text-slate-200 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Ничего не найдено</h3>
            <p className="text-slate-500 mt-2">Попробуйте изменить поисковый запрос</p>
            <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
                Очистить поиск
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalVocabulary;
