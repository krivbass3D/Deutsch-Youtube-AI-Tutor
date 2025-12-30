
import React, { useState } from 'react';
import { Vocabulary } from '../types';

interface VocabularyCardProps {
  vocabulary: Vocabulary[];
  onFinish: () => void;
}

const VocabularyCard: React.FC<VocabularyCardProps> = ({ vocabulary, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const current = vocabulary[currentIndex];

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'verb': return 'bg-blue-100 text-blue-700';
      case 'noun': return 'bg-green-100 text-green-700';
      case 'adjective': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-8">
      <div className="w-full flex justify-between items-center text-sm font-medium text-slate-500">
        <span>Карточка {currentIndex + 1} из {vocabulary.length}</span>
        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }}
          />
        </div>
      </div>

      <div 
        className="relative w-full aspect-[3/2] cursor-pointer perspective-1000 group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 flex flex-col items-center justify-center p-8 backface-hidden">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 ${getTypeColor(current.type)}`}>
              {current.type}
            </span>
            <h2 className="text-4xl font-bold text-slate-800 text-center">{current.word}</h2>
            <p className="mt-8 text-slate-400 text-sm animate-pulse">Нажмите, чтобы перевернуть</p>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 w-full h-full bg-blue-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180">
            <h2 className="text-4xl font-bold text-white text-center">{current.translation}</h2>
            <p className="mt-8 text-blue-200 text-sm">Нажмите, чтобы вернуться</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 w-full">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          disabled={currentIndex === 0}
          className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i> Назад
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
        >
          {currentIndex === vocabulary.length - 1 ? 'К упражнениям' : 'Дальше'} <i className="fa-solid fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};

export default VocabularyCard;
