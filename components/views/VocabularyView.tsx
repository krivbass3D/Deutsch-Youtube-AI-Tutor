import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLessonStore } from '../../store/useLessonStore';
import VocabularyCard from '../VocabularyCard';
import { sortBySpacedRepetition, recordSuccessfulReview, recordFailedReview } from '../../services/spacedRepetition';
import { recordWordView, recordExamAnswer } from '../../services/vocabularyStatistics';
import { toggleDifficultWord } from '../../services/difficultyTracker';
import { Vocabulary } from '../../types';

interface VocabularyViewProps {
  onFinish: () => void;
  onSkip: () => void;
}

const VocabularyView: React.FC<VocabularyViewProps> = ({ onFinish, onSkip }) => {
  const { selectedLesson } = useAppStore();
  const { state, updateSRState, updateVocabStats, updateDifficultWords } = useLessonStore();
  const [stableVocab, setStableVocab] = useState<Vocabulary[]>([]);

  useEffect(() => {
    if (selectedLesson && state && stableVocab.length === 0) {
      const sorted = sortBySpacedRepetition(
        selectedLesson.vocabulary || [],
        state.srState,
        new Set(state.difficultWords),
        state.vocabStats
      );
      setStableVocab(sorted);
    }
  }, [selectedLesson, state, stableVocab.length]);

  if (!selectedLesson || !state || stableVocab.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto py-10 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Изучение слов</h2>
          <p className="text-sm text-slate-500 font-medium">Повторяйте за диктором и запоминайте значения</p>
        </div>
        <button 
          onClick={onSkip}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
        >
          Пропустить изучение →
        </button>
      </div>

      <VocabularyCard
        vocabulary={stableVocab}
        difficultWords={new Set(state.difficultWords)}
        onFinish={onFinish}
        onRecordView={(word, translation, timeSpent) => {
          const isDiff = state.difficultWords.includes(word);
          updateVocabStats(recordWordView(state.vocabStats, word, translation, timeSpent, isDiff));
        }}
        onReview={(word, translation, type, isCorrect) => {
          const isDiff = state.difficultWords.includes(word);
          // Update SR State
          let newSRState = { ...state.srState };
          if (isCorrect) {
            newSRState = recordSuccessfulReview(newSRState, word, translation, type, isDiff);
          } else {
            newSRState = recordFailedReview(newSRState, word, translation, type);
          }

          // Update Vocab Stats
          const newVocabStats = recordExamAnswer(state.vocabStats, word, isCorrect, translation);

          updateSRState(newSRState);
          updateVocabStats(newVocabStats);
        }}
        onToggleDifficulty={(word) => {
          updateDifficultWords(toggleDifficultWord(state.difficultWords, word));
        }}
      />
    </div>
  );
};

export default VocabularyView;
