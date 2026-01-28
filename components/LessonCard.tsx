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
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              status.label
            }`}>
              <i className="fa-solid fa-graduation-cap text-base" />
            </div>
            <div className="flex-1 pr-2">
              <h3 className="text-base font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                {lesson.title}
              </h3>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  Урок №{lesson.lesson_id}
                </span>
                {lesson.tags?.map(tag => (
                   <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                     {tag}
                   </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Прогресс-бары */}
        <div className="space-y-4 mb-5">
          {/* Слова */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500 uppercase tracking-tighter">Слова</span>
              <span className="text-slate-800">{metrics.vocabProgressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${metrics.vocabProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-medium px-0.5">
               <span>Уровень владения</span>
               <span>
                 {metrics.masteredWords > 0 && <span>✅ {metrics.masteredWords} выучено</span>}
                 {metrics.inProgressWords > 0 && <span>{metrics.masteredWords > 0 ? ' • ' : ''}⏳ {metrics.inProgressWords} в процессе</span>}
                 {metrics.masteredWords === 0 && metrics.inProgressWords === 0 && <span>Новые слова</span>}
               </span>
            </div>
          </div>

          {/* Упражнения */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500 uppercase tracking-tighter">Задачи</span>
              <span className="text-slate-800">{metrics.exercisesCompleted} / {metrics.totalTasks}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-amber-500 transition-all duration-700 ease-out"
                style={{ width: `${metrics.exerciseProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Статистика и Сложность */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Точность</p>
              <p className={`text-xs font-bold ${metrics.exerciseAccuracy >= 80 ? 'text-emerald-600' : metrics.exerciseAccuracy >= 60 ? 'text-amber-600' : 'text-slate-800'}`}>
                {metrics.exerciseAccuracy}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Сложность</p>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(lvl => (
                  <div 
                    key={lvl}
                    className={`w-1.5 h-3 rounded-sm ${
                      metrics.difficultyLevel === 'easy' && lvl === 1 ? 'bg-emerald-400' :
                      metrics.difficultyLevel === 'medium' && lvl <= 2 ? 'bg-amber-400' :
                      metrics.difficultyLevel === 'hard' ? 'bg-red-400' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${status.label}`}>
            {status.text}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LessonCard;
