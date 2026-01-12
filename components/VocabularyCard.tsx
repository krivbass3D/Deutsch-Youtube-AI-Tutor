
import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary } from '../types';
import { isWordDifficult, toggleDifficultWord } from '../services/difficultyTracker';
import { recordWordView } from '../services/vocabularyStatistics';
import { validateAnswer } from '../services/validationService';
import { recordSuccessfulReview, recordFailedReview } from '../services/spacedRepetition';

interface VocabularyCardProps {
  vocabulary: Vocabulary[];
  onFinish: () => void;
  lessonId: string;
}

type VocabularyPhase = 'learning' | 'testing'; // Обучение или Проверка
type TestDirection = 'de-to-ru' | 'ru-to-de'; // Немецкий→Русский или Русский→Немецкий

const VocabularyCard: React.FC<VocabularyCardProps> = ({ vocabulary, onFinish, lessonId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<VocabularyPhase>('learning');
  const [testDirection, setTestDirection] = useState<TestDirection>('de-to-ru');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDifficultWord, setIsDifficultWord] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [testFeedback, setTestFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const cardStartTimeRef = useRef<number>(Date.now());

  const current = vocabulary[currentIndex];

  // Проверяем, отмечено ли текущее слово как сложное при смене индекса
  // И записываем время, потраченное на предыдущую карточку
  useEffect(() => {
    if (currentIndex > 0) {
      const timeSpent = (Date.now() - cardStartTimeRef.current) / 1000; // в секундах
      const prevWord = vocabulary[currentIndex - 1];
      recordWordView(
        lessonId,
        prevWord.word,
        prevWord.translation,
        timeSpent,
        isWordDifficult(lessonId, prevWord.word)
      );
    }
    
    cardStartTimeRef.current = Date.now(); // Сбросить таймер для новой карточки
    setIsDifficultWord(isWordDifficult(lessonId, current.word));
    setIsFlipped(false);
    setUserAnswer('');
    setTestFeedback(null);
  }, [currentIndex, current.word, lessonId]);

  const handleNext = () => {
    if (phase === 'learning') {
      // В режиме обучения просто переходим на следующее слово
      if (currentIndex < vocabulary.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Записываем время последней карточки перед завершением
        const timeSpent = (Date.now() - cardStartTimeRef.current) / 1000;
        recordWordView(
          lessonId,
          current.word,
          current.translation,
          timeSpent,
          isDifficultWord
        );
        // Автоматический переход в режим проверки после обучения
        setCurrentIndex(0);
        setPhase('testing');
        setTestDirection('de-to-ru');
      }
    } else {
      // В режиме проверки - переход на следующее слово (независимо от правильности)
      if (testFeedback) {
        if (currentIndex < vocabulary.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setUserAnswer('');
          setTestFeedback(null);
        } else {
          // Проверка завершена
          onFinish();
        }
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setUserAnswer('');
      setTestFeedback(null);
    }
  };

  const handleTestAnswer = () => {
    let isCorrect = false;
    let message = '';

    if (testDirection === 'de-to-ru') {
      // Студент пишет русский перевод немецкого слова
      const validation = validateAnswer(userAnswer, current.translation);
      isCorrect = validation !== null && !validation.shouldCallAPI;
      message = isCorrect
        ? `✅ Правильно! "${current.word}" = "${current.translation}"`
        : `❌ Неправильно. "${current.word}" = "${current.translation}". Вы ответили: "${userAnswer}"`;
    } else {
      // Студент пишет немецкое слово по русскому переводу
      const validation = validateAnswer(userAnswer, current.word);
      isCorrect = validation !== null && !validation.shouldCallAPI;
      message = isCorrect
        ? `✅ Правильно! "${current.translation}" = "${current.word}"`
        : `❌ Неправильно. "${current.translation}" = "${current.word}". Вы ответили: "${userAnswer}"`;
    }

    // 🔄 Интеграция Spaced Repetition алгоритма
    if (isCorrect) {
      // Успешный повтор → увеличиваем интервал повторения
      recordSuccessfulReview(
        lessonId,
        current.word,
        current.translation,
        current.type
      );
    } else {
      // Ошибка → сбрасываем прогресс
      recordFailedReview(
        lessonId,
        current.word,
        current.translation,
        current.type
      );
    }

    setTestFeedback({ isCorrect, message });
  };

  const handleSkipPhases = () => {
    // Пропустить режим обучения и перейти сразу к проверке
    if (phase === 'learning') {
      setCurrentIndex(0);
      setPhase('testing');
      setTestDirection('de-to-ru');
    }
  };

  const handleFinishTest = () => {
    // Завершить проверку и выйти
    onFinish();
  };

  const handleToggleDifficult = () => {
    const newState = toggleDifficultWord(lessonId, current.word);
    setIsDifficultWord(newState);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'verb': return 'bg-blue-100 text-blue-700';
      case 'noun': return 'bg-green-100 text-green-700';
      case 'adjective': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-8">
      {/* Индикатор режима и прогресс */}
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-sm font-medium">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            phase === 'learning'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {phase === 'learning' ? '📚 ОБУЧЕНИЕ' : '✏️ ПРОВЕРКА'}
          </span>
          <span className="text-slate-500">Карточка {currentIndex + 1} из {vocabulary.length}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${phase === 'learning' ? 'bg-blue-500' : 'bg-amber-500'}`}
            style={{ width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }}
          />
        </div>
      </div>

      {/* РЕЖИМ ОБУЧЕНИЯ */}
      {phase === 'learning' && (
        <>
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
              onClick={(e) => { e.stopPropagation(); handleToggleDifficult(); }}
              className={`px-4 py-4 rounded-2xl font-bold transition-colors ${
                isDifficultWord
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={isDifficultWord ? 'Удалить из сложных' : 'Отметить как сложное'}
            >
              ⭐
            </button>
            <button 
              onClick={() => handleSkipPhases()}
              className="px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              title="Пропустить обучение и перейти к проверке"
            >
              <i className="fa-solid fa-forward mr-2"></i> Проверка
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
            >
              {currentIndex === vocabulary.length - 1 ? 'На проверку →' : 'Дальше →'} <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </>
      )}

      {/* РЕЖИМ ПРОВЕРКИ */}
      {phase === 'testing' && (
        <>
          <div className="w-full space-y-4">
            <div className={`rounded-3xl p-8 border-2 text-center ${
              testDirection === 'de-to-ru'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-purple-50 border-purple-200'
            }`}>
              <p className="text-xs text-slate-600 mb-3">
                {testDirection === 'de-to-ru'
                  ? 'Переведите с немецкого на русский:'
                  : 'Переведите с русского на немецкий:'}
              </p>
              <h2 className={`text-5xl font-bold text-center ${
                testDirection === 'de-to-ru'
                  ? 'text-amber-700'
                  : 'text-purple-700'
              }`}>
                {testDirection === 'de-to-ru' ? current.word : current.translation}
              </h2>
            </div>

            {/* Ввод ответа */}
            {!testFeedback && (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTestAnswer()}
                placeholder={testDirection === 'de-to-ru' ? 'Напишите перевод...' : 'Напишите слово...'}
                autoFocus
                className="w-full px-4 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            )}

            {/* Обратная связь */}
            {testFeedback && (
              <div className={`p-4 rounded-2xl border-2 ${
                testFeedback.isCorrect
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <p className={`text-lg font-semibold ${
                  testFeedback.isCorrect
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}>
                  {testFeedback.message}
                </p>
              </div>
            )}
          </div>

          {/* Кнопки для проверки */}
          <div className="flex gap-3 w-full">
            {!testFeedback ? (
              <>
                <button
                  onClick={() => setUserAnswer('')}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  🔄 Очистить
                </button>
                <button
                  onClick={handleTestAnswer}
                  disabled={userAnswer.trim() === ''}
                  className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  ✓ Проверить
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handlePrev()}
                  disabled={currentIndex === 0}
                  className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <i className="fa-solid fa-arrow-left mr-2"></i> Назад
                </button>
                <button
                  onClick={() => setTestDirection(testDirection === 'de-to-ru' ? 'ru-to-de' : 'de-to-ru')}
                  className="px-4 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-colors"
                  title="Переключить направление перевода"
                >
                  🔀
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors"
                >
                  {currentIndex === vocabulary.length - 1 ? 'Завершить 🏁' : 'Дальше →'}
                </button>
              </>
            )}
          </div>

          {/* Быстрый выход */}
          {testFeedback && (
            <button
              onClick={handleFinishTest}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors text-sm"
            >
              ✕ Закончить проверку и вернуться
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default VocabularyCard;
