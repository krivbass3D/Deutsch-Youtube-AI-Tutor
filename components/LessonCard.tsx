/**
 * Компонент улучшенной карточки урока с полной статистикой
 * Этап 1: Основная структура + цветовая полоса слева
 */

import React, { useMemo } from 'react';
import { Lesson, LessonProgress } from '../types';
import { getLessonMetrics } from '../services/progressTracker';
import { VocabStatsState } from '../services/vocabularyStatistics';
import { SRState } from '../services/spacedRepetition';

interface LessonCardProps {
  lesson: Lesson;
  progress: LessonProgress | null;
  vocabStats: VocabStatsState;
  srState: SRState;
  difficultWords: Set<string>;
  onSelect: (lesson: Lesson) => void;
  onDelete: (e: React.MouseEvent, lessonId: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ 
  lesson, 
  progress, 
  vocabStats, 
  srState, 
  difficultWords,
  onSelect, 
  onDelete 
}) => {
  // Вычисляем метрики урока (Pure, derived from props)
  const metrics = useMemo(() => {
    const m = getLessonMetrics(
      lesson, 
      progress, 
      vocabStats, 
      srState, 
      difficultWords
    );
    console.log(`📊 LessonCard #${lesson.lesson_id}:`, {
      title: lesson.title,
      progress,
      overallProgress: m.overallProgress,
      learnedWords: m.learnedWords,
      totalVocab: m.totalVocab,
      daysSinceLastStudy: m.daysSinceLastStudy
    });
    return m;
  }, [lesson, progress, vocabStats, srState, difficultWords]);

  // Определяем цвет полосы и статус
  const getStatusColor = () => {
    // 🟢 Зелёный: завершён (>80% выучено)
    if (metrics.overallProgress >= 80) {
      return { bg: 'bg-emerald-500', text: 'Завершён', label: 'bg-emerald-100 text-emerald-700' };
    }
    // 🟡 Жёлтый: в процессе (40-80%)
    if (metrics.overallProgress >= 40) {
      return { bg: 'bg-amber-500', text: 'В процессе', label: 'bg-amber-100 text-amber-700' };
    }
    // 🔵 Голубой: новый (0-40%)
    if (metrics.overallProgress > 0) {
      return { bg: 'bg-blue-500', text: 'Новый', label: 'bg-blue-100 text-blue-700' };
    }
    // ⚪ Серый: не начинали
    return { bg: 'bg-slate-400', text: 'Не начинали', label: 'bg-slate-100 text-slate-700' };
  };

  // Проверяем, требуется ли повторение (не занимались > 7 дней)
  const needsReview = metrics.daysSinceLastStudy !== null && metrics.daysSinceLastStudy > 7 && metrics.overallProgress < 100;

  const status = getStatusColor();

  return (
    <div
      onClick={() => onSelect(lesson)}
      className={`
        relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer group
        ${needsReview 
          ? 'border-red-300 bg-white shadow-md hover:shadow-lg hover:border-red-400' 
          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'}
      `}
    >
      {/* ✅ ЭТАП 1: Цветная полоса слева (5px) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.bg}`} />

      {/* Кнопка удаления */}
      <button
        onClick={(e) => onDelete(e, lesson.lesson_id)}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-20"
        title="Удалить урок"
      >
        <i className="fa-solid fa-trash-can text-sm" />
      </button>

      {/* Основное содержимое */}
      <div className="p-5">
        {/* Заголовок с иконкой и статусом */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              status.label
            }`}>
              <i className="fa-solid fa-book text-base" />
            </div>
            <div className="flex-1 pr-2">
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {lesson.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Урок №{lesson.lesson_id}
              </p>
            </div>
          </div>
        </div>

        {/* Базовая информация */}
        <div className="text-xs text-slate-600 space-y-1 mb-4 pb-3 border-b border-slate-100">
          <p>
            <span className="font-semibold">{lesson.vocabulary?.length || 0}</span> слов в уроке
            {metrics.learnedWords > 0 && (
              <>
                {' • '}
                <span className="font-semibold text-emerald-600">{metrics.learnedWords}</span>
                {' выучено'}
              </>
            )}
          </p>
        </div>

        {/* Статус и время */}
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.label}`}>
            {status.text}
          </span>
          {metrics.lastStudiedAt && (
            <span className="text-slate-500">
              {metrics.daysSinceLastStudy === 0 
                ? '🔥 Сегодня'
                : `⏰ ${metrics.daysSinceLastStudy}д назад`}
            </span>
          )}
        </div>

        {/* Индикатор срочности */}
        {needsReview && (
          <div className="mt-3 pt-3 border-t border-red-200 text-xs text-red-600 font-semibold">
            ⏰ Пора повторять!
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonCard;
