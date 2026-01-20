import React, { useState, useEffect, useRef } from 'react';
import { Vocabulary, Lesson } from '../types';
import { validateAnswer } from '../services/validationService';
import { sortBySpacedRepetition } from '../services/spacedRepetition';
import { recordExamAnswer } from '../services/vocabularyStatistics';
import { initializeLessonProgress, recordWordExamAttempt } from '../services/progressService';

interface ExamModeProps {
  vocabulary: Vocabulary[];
  lessonId: string;
  lesson: Lesson; // Добавляем полный объект урока для инициализации
  onFinish: () => void;
}

interface ExamResult {
  word: string;
  translation: string;
  userAnswer: string;
  isCorrect: boolean;
}

type ExamPhase = 'exam' | 'results';

const ExamMode: React.FC<ExamModeProps> = ({ vocabulary, lessonId, lesson, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<ExamPhase>('exam');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);

  // Инициализировать прогресс урока при загрузке экзамена
  useEffect(() => {
    initializeLessonProgress(lesson);
  }, [lesson, lessonId]);

  const sortedVocab = sortBySpacedRepetition(vocabulary, lessonId);
  const current = sortedVocab[currentIndex];

  const handleSubmitAnswer = () => {
    const validation = validateAnswer(userAnswer, current.translation);
    const isCorrect = validation !== null && !validation.shouldCallAPI;

    // Найти индекс слова в оригинальном массиве для создания правильного ID
    const originalVocabIndex = vocabulary.findIndex(
      v => v.word === current.word && v.translation === current.translation
    );
    const wordId = `word_${originalVocabIndex}`;

    // Записываем результат экзамена в статистику (старая система)
    recordExamAnswer(lessonId, current.word, isCorrect);
    
    // Записываем результат в новую систему прогресса
    recordWordExamAttempt(lessonId, wordId, isCorrect);

    const newResult: ExamResult = {
      word: current.word,
      translation: current.translation,
      userAnswer: userAnswer.trim(),
      isCorrect
    };

    setResults([...results, newResult]);
    setFeedback({
      message: isCorrect
        ? `✅ Правильно! "${current.word}" — это "${current.translation}"`
        : `❌ Неправильно. "${current.word}" — это "${current.translation}". Вы ответили: "${userAnswer}"`,
      isCorrect
    });
    setAnswered(true);
  };

  const handleNextWord = () => {
    if (currentIndex < sortedVocab.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
      setAnswered(false);
    } else {
      // Экзамен завершён
      setPhase('results');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !answered) {
      handleSubmitAnswer();
    } else if (e.key === 'Enter' && answered) {
      handleNextWord();
    }
  };

  if (phase === 'results') {
    const correctCount = results.filter(r => r.isCorrect).length;
    const percentage = Math.round((correctCount / results.length) * 100);

    return (
      <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-slate-800">📊 Результаты экзамена</h2>
          <div className="flex justify-center gap-4 text-center">
            <div className="bg-green-100 rounded-2xl p-6 flex-1">
              <p className="text-3xl font-bold text-green-700">{correctCount}</p>
              <p className="text-slate-600">правильных ответов</p>
            </div>
            <div className="bg-slate-100 rounded-2xl p-6 flex-1">
              <p className="text-3xl font-bold text-slate-700">{results.length}</p>
              <p className="text-slate-600">всего слов</p>
            </div>
            <div className={`rounded-2xl p-6 flex-1 ${percentage >= 80 ? 'bg-green-100' : percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <p className={`text-3xl font-bold ${percentage >= 80 ? 'text-green-700' : percentage >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                {percentage}%
              </p>
              <p className="text-slate-600">успешность</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          <h3 className="text-xl font-bold text-slate-800 sticky top-0 bg-white pb-2">
            📝 Подробные ответы
          </h3>
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 ${
                result.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{result.word}</p>
                  <p className="text-sm text-slate-600">Правильно: {result.translation}</p>
                  {!result.isCorrect && (
                    <p className="text-sm text-red-600 mt-1">Вы ответили: {result.userAnswer}</p>
                  )}
                </div>
                <div className="text-2xl">
                  {result.isCorrect ? '✅' : '❌'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onFinish}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Вернуться к уроку
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setUserAnswer('');
              setPhase('exam');
              setResults([]);
              setAnswered(false);
              setFeedback(null);
            }}
            className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors"
          >
            🔄 Повторить экзамен
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Прогресс */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-medium text-slate-600">
          <span>Вопрос {currentIndex + 1} из {sortedVocab.length}</span>
          <span className="text-amber-600 font-bold">📝 РЕЖИМ ЭКЗАМЕНА</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / sortedVocab.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Вопрос */}
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border-2 border-amber-200 text-center">
          <p className="text-sm text-slate-600 mb-2">Переведите слово:</p>
          <h2 className="text-5xl font-bold text-slate-800">{current.word}</h2>
          <p className="text-xs text-slate-500 mt-4">{current.type}</p>
        </div>

        {/* Ввод ответа */}
        <div className="space-y-3">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите перевод..."
            disabled={answered}
            autoFocus
            className="w-full px-4 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Обратная связь */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border-2 ${
              feedback.isCorrect
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <p className={`text-lg font-semibold ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {feedback.message}
            </p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3">
          {!answered ? (
            <>
              <button
                onClick={() => {
                  setCurrentIndex(Math.max(0, currentIndex - 1));
                  setUserAnswer('');
                  setFeedback(null);
                  setAnswered(false);
                  setResults(results.slice(0, -1));
                }}
                disabled={currentIndex === 0 || results.length === 0}
                className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i> Назад
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={userAnswer.trim() === ''}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                ✓ Проверить
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onFinish}
                className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <i className="fa-solid fa-times mr-2"></i> Выход
              </button>
              <button
                onClick={handleNextWord}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors"
              >
                {currentIndex === sortedVocab.length - 1 ? 'Завершить 🏁' : 'Дальше →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamMode;
