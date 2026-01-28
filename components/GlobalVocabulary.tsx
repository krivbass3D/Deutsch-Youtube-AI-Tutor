
import React, { useMemo, useState } from 'react';
import { Lesson, Vocabulary } from '../types';
import VocabularyList from './VocabularyList';

interface GlobalVocabularyProps {
  lessons: Lesson[];
  userStates: any[];
  onBack: () => void;
}

const GlobalVocabulary: React.FC<GlobalVocabularyProps> = ({ lessons, userStates, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { allVocabulary, aggregatedStats, aggregatedSR, allDifficultWords } = useMemo(() => {
    const vocabMap = new Map<string, Vocabulary>();
    const statsMap: Record<string, any> = {};
    const srMap: Record<string, any> = {};
    const diffSet = new Set<string>();

    // 1. Collect all unique words
    lessons.forEach(lesson => {
      lesson.vocabulary?.forEach(v => {
        if (!vocabMap.has(v.word)) {
          vocabMap.set(v.word, v);
        }
      });
    });

    // 2. Aggregate stats from userStates
    userStates.forEach(state => {
      const vStats = state.vocabulary_stats || {};
      const srState = state.spaced_repetition || {};
      const diffWords = state.difficult_words || [];

      // Difficulty
      diffWords.forEach((w: string) => diffSet.add(w));

      // Stats aggregation
      Object.keys(vStats).forEach(word => {
        if (!statsMap[word]) {
          statsMap[word] = { correct: 0, incorrect: 0, attempts: 0 };
        }
        statsMap[word].correct += vStats[word].correctAttempts || vStats[word].correct || vStats[word].correctAnswersInExam || 0;
        statsMap[word].incorrect += vStats[word].incorrectAttempts || vStats[word].incorrect || 0;
        statsMap[word].attempts += vStats[word].attempts || 0;
      });

      // SR aggregation (pick the one with the longest interval or furthest review date)
      Object.keys(srState).forEach(word => {
        if (!srMap[word] || (srState[word].interval > srMap[word].interval)) {
          srMap[word] = srState[word];
        }
      });
    });

    const sortedVocab = Array.from(vocabMap.values()).sort((a, b) => a.word.localeCompare(b.word));
    
    return { 
      allVocabulary: sortedVocab, 
      aggregatedStats: statsMap, 
      aggregatedSR: srMap, 
      allDifficultWords: diffSet 
    };
  }, [lessons, userStates]);

  const filteredVocabulary = useMemo(() => {
    if (!searchQuery.trim()) return allVocabulary;
    const query = searchQuery.toLowerCase();
    return allVocabulary.filter(v => 
      v.word.toLowerCase().includes(query) || 
      v.translation.toLowerCase().includes(query)
    );
  }, [allVocabulary, searchQuery]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={onBack}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 flex items-center transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Назад в Dashboard
          </button>
          <h2 className="text-3xl font-bold text-slate-800">📓 Мой словарь</h2>
          <p className="text-slate-500">Все слова из пройденных уроков ({allVocabulary.length})</p>
        </div>

        <div className="relative w-full md:w-64">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Поиск слова..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
          />
        </div>
      </div>

      <VocabularyList 
        vocabulary={filteredVocabulary} 
        stats={aggregatedStats}
        srState={aggregatedSR}
        difficultWords={allDifficultWords}
      />
    </div>
  );
};

export default GlobalVocabulary;
