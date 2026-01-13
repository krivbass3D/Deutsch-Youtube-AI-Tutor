/**
 * Компонент Dashboard с глобальной статистикой прогресса
 * Показывает прогресс по всем урокам и методические рекомендации
 */

import React, { useMemo } from 'react';
import { Lesson, LessonProgress } from '../types';
import { getGlobalProgress, getPedagogicalRecommendations, getLessonMetrics } from '../services/progressTracker';

interface GlobalDashboardProps {
  lessons: Lesson[];
  lessonsProgress: Record<string, LessonProgress>;
  onSelectLesson?: (lessonId: string) => void;
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ lessons, lessonsProgress, onSelectLesson }) => {
  const globalProgress = useMemo(() => {
    return getGlobalProgress(lessons, lessonsProgress);
  }, [lessons, lessonsProgress]);

  const allMetrics = useMemo(() => {
    return lessons.map(lesson => {
      const progress = lessonsProgress[`lesson_${lesson.lesson_id}_progress`] || null;
      return getLessonMetrics(lesson, progress);
    });
  }, [lessons, lessonsProgress]);

  const recommendations = useMemo(() => {
    return getPedagogicalRecommendations(globalProgress, allMetrics);
  }, [globalProgress, allMetrics]);

  return (
    <div className="space-y-8">
      {/* Заголовок и основные метрики */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">📊 Ваш прогресс обучения</h2>
        <p className="text-slate-600">Общая статистика по всем урокам</p>
      </div>

      {/* Основные KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Слов выучено за неделю */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border-2 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-green-600">{globalProgress.wordsLearnedThisWeek}</p>
              <p className="text-sm text-slate-600 mt-1">слов выучено за неделю</p>
            </div>
            <span className="text-3xl">📈</span>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 text-xs text-slate-600">
            💡 Отличный результат! Продолжайте в том же темпе.
          </div>
        </div>

        {/* Всего выучено */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border-2 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-blue-600">{globalProgress.totalWordsLearned}</p>
              <p className="text-sm text-slate-600 mt-1">всего слов выучено</p>
            </div>
            <span className="text-3xl">🎯</span>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 text-xs text-slate-600">
            Отличный прогресс в обучении!
          </div>
        </div>

        {/* Точность упражнений */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-purple-600">{globalProgress.overallAccuracy}%</p>
              <p className="text-sm text-slate-600 mt-1">точность упражнений</p>
            </div>
            <span className="text-3xl">✓</span>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 text-xs text-slate-600">
            {globalProgress.overallAccuracy >= 80 ? '✅ Отлично!' : globalProgress.overallAccuracy >= 60 ? '🟡 Хорошо' : '⚠️ Нужна работа'}
          </div>
        </div>

        {/* Уроки в прогрессе */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-amber-600">{globalProgress.lessonsInProgress}</p>
              <p className="text-sm text-slate-600 mt-1">уроков в процессе</p>
            </div>
            <span className="text-3xl">📚</span>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200 text-xs text-slate-600">
            {globalProgress.lessonsCompleted > 0 && `✅ ${globalProgress.lessonsCompleted} завершено`}
          </div>
        </div>
      </div>

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 text-lg">💡 Методические рекомендации</h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-4 border-2 ${
                  rec.type === 'warning'
                    ? 'bg-red-50 border-red-200'
                    : rec.type === 'suggestion'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-bold ${
                      rec.type === 'warning'
                        ? 'text-red-700'
                        : rec.type === 'suggestion'
                        ? 'text-amber-700'
                        : 'text-green-700'
                    }`}>
                      {rec.icon} {rec.title}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">{rec.description}</p>
                  </div>
                  {rec.actionLesson && (
                    <button
                      onClick={() => onSelectLesson?.(rec.actionLesson!)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Перейти →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статистика по урокам */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-lg">📋 Статистика по урокам</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Самый сложный урок */}
          {globalProgress.hardestLesson && (
            <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
              <p className="font-bold text-red-700 mb-2">⚠️ Самый сложный урок</p>
              <p className="font-semibold text-slate-800">{globalProgress.hardestLesson.title}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>📊 Точность: <span className="font-bold">{globalProgress.hardestLesson.exerciseAccuracy}%</span></p>
                <p>📚 Выучено: <span className="font-bold">{globalProgress.hardestLesson.learnedWords}/{globalProgress.hardestLesson.totalVocab}</span></p>
                {globalProgress.hardestLesson.difficultyLevel === 'hard' && (
                  <p className="text-red-600 mt-2">💡 Рекомендуем вернуться к грамматике и медленнее учить новые слова.</p>
                )}
              </div>
            </div>
          )}

          {/* Самый лёгкий урок */}
          {globalProgress.easiestLesson && (
            <div className="bg-green-50 rounded-2xl p-4 border-2 border-green-200">
              <p className="font-bold text-green-700 mb-2">✅ Лучший прогресс</p>
              <p className="font-semibold text-slate-800">{globalProgress.easiestLesson.title}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>📊 Точность: <span className="font-bold">{globalProgress.easiestLesson.exerciseAccuracy}%</span></p>
                <p>📚 Выучено: <span className="font-bold">{globalProgress.easiestLesson.learnedWords}/{globalProgress.easiestLesson.totalVocab}</span></p>
                <p className="text-green-600 mt-2">🎉 Отличная работа! Вы хорошо понимаете эту тему.</p>
              </div>
            </div>
          )}
        </div>

        {/* Рекомендуемый следующий урок */}
        {globalProgress.recommendedNextLesson && (
          <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
            <p className="font-bold text-blue-700 mb-2">🎯 Рекомендуется начать/повторить</p>
            <p className="font-semibold text-slate-800">{globalProgress.recommendedNextLesson.title}</p>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>📊 Точность: <span className="font-bold">{globalProgress.recommendedNextLesson.exerciseAccuracy}%</span></p>
              {globalProgress.recommendedNextLesson.daysSinceLastStudy !== null && (
                <p>⏰ Не занимались: <span className="font-bold">{globalProgress.recommendedNextLesson.daysSinceLastStudy} дней</span></p>
              )}
              <button
                onClick={() => onSelectLesson?.(globalProgress.recommendedNextLesson!.lessonId)}
                className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Начать урок →
              </button>
            </div>
          </div>
        )}

        {/* Уроки, требующие повторения */}
        {globalProgress.lessonsNeedingReview.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200">
            <p className="font-bold text-amber-700 mb-3">⏰ Требуют повторения ({globalProgress.lessonsNeedingReview.length})</p>
            <div className="space-y-2">
              {globalProgress.lessonsNeedingReview.map(lesson => (
                <button
                  key={lesson.lessonId}
                  onClick={() => onSelectLesson?.(lesson.lessonId)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{lesson.title}</p>
                      <p className="text-xs text-slate-600">Не повторяли {lesson.daysSinceLastStudy} дней</p>
                    </div>
                    <span className="text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Советы по эффективному обучению */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200">
        <h3 className="font-bold text-slate-800 mb-4">💡 Методические советы по языковому обучению</h3>
        <ul className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="text-lg">1️⃣</span>
            <span><strong>Ежедневность:</strong> 20-30 минут в день эффективнее, чем 3 часа раз в неделю. Мозг лучше запоминает при распределённом обучении (Spaced Repetition).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">2️⃣</span>
            <span><strong>Активное вспоминание:</strong> Тестирование себя важнее, чем просто повторение. Режим ПРОВЕРКИ помогает лучше запомнить.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">3️⃣</span>
            <span><strong>Чередование:</strong> Чередуйте лексику и грамматику. После изучения слов сразу делайте упражнения на грамматику.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">4️⃣</span>
            <span><strong>Сложные слова:</strong> Отмечайте ⭐ сложные слова — они будут повторяться в 1.5 раза чаще. Это критично для долгосрочного запоминания.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">5️⃣</span>
            <span><strong>Контекст:</strong> Старайтесь учить слова в контексте (фраза, предложение), а не отдельно. Это значительно улучшает усвоение.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GlobalDashboard;
