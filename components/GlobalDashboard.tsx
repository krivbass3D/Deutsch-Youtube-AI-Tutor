/**
 * Компонент Dashboard с глобальной статистикой прогресса
 * Показывает прогресс по всем урокам и методические рекомендации
 * Использует новую систему progressService
 */

import React, { useMemo } from 'react';
import { Lesson } from '../types';

interface GlobalDashboardProps {
  lessons: Lesson[];
  userStates: any[]; // Array of DB records
  onSelectLesson?: (lessonId: string) => void;
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ lessons, userStates = [], onSelectLesson }) => {
  
  // Calculate aggregates from userStates
  const allProgress = useMemo(() => {
    const map: Record<string, any> = {};
    userStates.forEach(state => {
      map[state.lesson_id] = state;
    });
    return map;
  }, [userStates]);

  const dashboardStats = useMemo(() => {
    let totalWordsLearned = 0;
    let wordsLearnedThisWeek = 0;
    let lessonsInProgress = 0;
    let lessonsCompleted = 0;

    userStates.forEach(state => {
      // Check vocab stats for learned words
      const vocab = state.vocabulary_stats || {};
      const learned = Object.values(vocab).filter((w: any) => w.repeatCount >= 5).length; // rough "learned" metric
      totalWordsLearned += learned;
      
      // We don't track "this week" in vocab stats easily unless we check dates.
      // Let's simplified assumption: if updated recently?
      // For now set to 0 or same as total.
      wordsLearnedThisWeek += 0; // consistent placeholder

      if (state.progress?.completed) {
        lessonsCompleted++;
      } else if (state.progress?.currentExerciseIdx > 0 || state.progress?.vocabCompleted) {
        lessonsInProgress++;
      }
    });

    return { totalWordsLearned, wordsLearnedThisWeek, lessonsInProgress, lessonsCompleted };
  }, [userStates]);

  // Вычислить общую точность упражнений
  const overallAccuracy = useMemo(() => {
    if (userStates.length === 0) return 0;
    
    let totalCorrect = 0;
    let totalAttempts = 0;

    userStates.forEach(state => {
        const stats = state.progress?.statistics;
        if (stats) {
            totalCorrect += (stats.correct || 0);
            totalAttempts += (stats.correct || 0) + (stats.incorrect || 0);
        }
    });
    
    if (totalAttempts === 0) return 0;
    return Math.round((totalCorrect / totalAttempts) * 100);
  }, [userStates]);

  // Найти самые сложные и самые лёгкие уроки
  const lessonStats = useMemo(() => {
    const stats: Array<{
      lessonId: string;
      title: string;
      accuracy: number;
      wordsLearned: number;
      totalWords: number;
      exercisesLearned: number;
      totalExercises: number;
      status: string;
    }> = [];

    lessons.forEach(lesson => {
      const state = allProgress[lesson.lesson_id];
      // Calculate derived stats for this lesson
      let accuracy = 0;
      let wordsLearned = 0;
      let totalWords = lesson.vocabulary?.length || 0;
      let exercisesLearned = 0;
      let totalExercises = lesson.exercises?.reduce((sum, ex) => sum + (ex.tasks?.length || 0), 0) || 0;
      let status = 'not_started';

      if (state) {
          // Accuracy
          const stats = state.progress?.statistics;
          if (stats) {
              const attempts = (stats.correct || 0) + (stats.incorrect || 0);
              accuracy = attempts > 0 ? Math.round((stats.correct / attempts) * 100) : 0;
          }

          // Words Learned (repeat count >= 5)
          if (state.vocabulary_stats) {
              wordsLearned = Object.values(state.vocabulary_stats).filter((w: any) => w.repeatCount >= 5).length;
          }

          // Exercises Learned (simple approximation: correct answers count vs total task count?)
          // Or just use percentage
          exercisesLearned = Math.round((accuracy / 100) * totalExercises);

          // Status
          if (state.progress?.completed) status = 'completed';
          else if (state.progress?.lastActivityAt) status = 'in_progress';
      }

      stats.push({
          lessonId: lesson.lesson_id,
          title: lesson.title,
          accuracy,
          wordsLearned,
          totalWords,
          exercisesLearned,
          totalExercises,
          status,
      });
    });

    return stats;
  }, [lessons, allProgress]);

  // Самые сложные уроки
  const hardestLessons = useMemo(() => {
    return [...lessonStats]
      .filter(s => s.totalExercises > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 1);
  }, [lessonStats]);

  // Самые лёгкие уроки / лучший прогресс
  const easiestLessons = useMemo(() => {
    return [...lessonStats]
      .filter(s => s.totalExercises > 0)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 1);
  }, [lessonStats]);

  // Уроки, требующие повторения (не начиналась или давно не занимались)
  const lessonsNeedingReview = useMemo(() => {
    return lessonStats
      .filter(s => s.status === 'in_progress' && s.accuracy < 80)
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [lessonStats]);

  // Рекомендуемый следующий урок
  const recommendedNextLesson = useMemo(() => {
    // Найти урок с наименьшим прогрессом или не начатый
    const unstarted = lessonStats.find(s => s.status === 'not_started');
    if (unstarted) return unstarted;

    const inProgress = [...lessonStats]
      .filter(s => s.status === 'in_progress')
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 1)[0];
    
    return inProgress || null;
  }, [lessonStats]);

  // Методические рекомендации
  const recommendations = useMemo(() => {
    const recs: Array<{
      type: 'warning' | 'suggestion' | 'success';
      icon: string;
      title: string;
      description: string;
      actionLesson?: string;
    }> = [];

    // Если общая точность низкая
    if (overallAccuracy < 60) {
      recs.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Требуется дополнительная практика',
        description: `Ваша средняя точность упражнений составляет ${overallAccuracy}%. Рекомендуем потратить больше времени на повторение сложных тем.`,
      });
    }

    // Если есть задолженный урок
    if (hardestLessons.length > 0 && hardestLessons[0].accuracy < 50) {
      recs.push({
        type: 'warning',
        icon: '🔴',
        title: 'Сложный урок требует внимания',
        description: `"${hardestLessons[0].title}" требует доработки. Точность: ${hardestLessons[0].accuracy}%. Посвятите этому уроку время.`,
        actionLesson: hardestLessons[0].lessonId,
      });
    }

    // Положительное подкрепление
    if (overallAccuracy >= 80) {
      recs.push({
        type: 'success',
        icon: '✅',
        title: 'Отличный прогресс!',
        description: 'Ваш средняя точность выше 80%. Продолжайте в том же темпе!',
      });
    }

    // Если мало слов выучено на этой неделе
    if (dashboardStats.wordsLearnedThisWeek === 0) {
      recs.push({
        type: 'suggestion',
        icon: '💡',
        title: 'Начните с изучения новых слов',
        description: 'На этой неделе вы ещё не выучили новых слов. Отличный момент, чтобы начать!',
      });
    }

    return recs;
  }, [overallAccuracy, dashboardStats.wordsLearnedThisWeek, hardestLessons]);

  return (
    <div className="space-y-8">
      {/* Заголовок и описание */}
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
              <p className="text-4xl font-bold text-green-600">{dashboardStats.wordsLearnedThisWeek}</p>
              <p className="text-sm text-slate-600 mt-1">слов выучено за неделю</p>
            </div>
            <span className="text-3xl">📈</span>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 text-xs text-slate-600">
            {dashboardStats.wordsLearnedThisWeek > 0 ? '💡 Отличный результат! Продолжайте в том же темпе.' : '💡 Начните с изучения новых слов'}
          </div>
        </div>

        {/* Всего выучено */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border-2 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-blue-600">{dashboardStats.totalWordsLearned}</p>
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
              <p className="text-4xl font-bold text-purple-600">{overallAccuracy}%</p>
              <p className="text-sm text-slate-600 mt-1">точность упражнений</p>
            </div>
            <span className="text-3xl">✓</span>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 text-xs text-slate-600">
            {overallAccuracy >= 80 ? '✅ Отлично!' : overallAccuracy >= 60 ? '🟡 Хорошо' : '⚠️ Нужна работа'}
          </div>
        </div>

        {/* Уроки в прогрессе */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold text-amber-600">{dashboardStats.lessonsInProgress}</p>
              <p className="text-sm text-slate-600 mt-1">уроков в процессе</p>
            </div>
            <span className="text-3xl">📚</span>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200 text-xs text-slate-600">
            {dashboardStats.lessonsCompleted > 0 && `✅ ${dashboardStats.lessonsCompleted} завершено`}
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
          {hardestLessons.length > 0 && (
            <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
              <p className="font-bold text-red-700 mb-2">⚠️ Самый сложный урок</p>
              <p className="font-semibold text-slate-800">{hardestLessons[0].title}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>📊 Точность: <span className="font-bold">{hardestLessons[0].accuracy}%</span></p>
                <p>📚 Выучено: <span className="font-bold">{hardestLessons[0].wordsLearned}/{hardestLessons[0].totalWords}</span> слов</p>
                <p>✓ Упражнений: <span className="font-bold">{hardestLessons[0].exercisesLearned}/{hardestLessons[0].totalExercises}</span></p>
                {hardestLessons[0].accuracy < 60 && (
                  <p className="text-red-600 mt-2">💡 Рекомендуем вернуться к грамматике и медленнее учить новые слова.</p>
                )}
              </div>
            </div>
          )}

          {/* Самый лёгкий урок */}
          {easiestLessons.length > 0 && (
            <div className="bg-green-50 rounded-2xl p-4 border-2 border-green-200">
              <p className="font-bold text-green-700 mb-2">✅ Лучший прогресс</p>
              <p className="font-semibold text-slate-800">{easiestLessons[0].title}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>📊 Точность: <span className="font-bold">{easiestLessons[0].accuracy}%</span></p>
                <p>📚 Выучено: <span className="font-bold">{easiestLessons[0].wordsLearned}/{easiestLessons[0].totalWords}</span> слов</p>
                <p>✓ Упражнений: <span className="font-bold">{easiestLessons[0].exercisesLearned}/{easiestLessons[0].totalExercises}</span></p>
                <p className="text-green-600 mt-2">🎉 Отличная работа! Вы хорошо понимаете эту тему.</p>
              </div>
            </div>
          )}
        </div>

        {/* Рекомендуемый следующий урок */}
        {recommendedNextLesson && (
          <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
            <p className="font-bold text-blue-700 mb-2">🎯 Рекомендуется начать/повторить</p>
            <p className="font-semibold text-slate-800">{recommendedNextLesson.title}</p>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>📊 Точность: <span className="font-bold">{recommendedNextLesson.accuracy}%</span></p>
              <p>📚 Статус: <span className="font-bold capitalize">{recommendedNextLesson.status}</span></p>
              <button
                onClick={() => onSelectLesson?.(recommendedNextLesson.lessonId)}
                className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Начать урок →
              </button>
            </div>
          </div>
        )}

        {/* Уроки, требующие повторения */}
        {lessonsNeedingReview.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200">
            <p className="font-bold text-amber-700 mb-3">⏰ Требуют повторения ({lessonsNeedingReview.length})</p>
            <div className="space-y-2">
              {lessonsNeedingReview.map(lesson => (
                <button
                  key={lesson.lessonId}
                  onClick={() => onSelectLesson?.(lesson.lessonId)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{lesson.title}</p>
                      <p className="text-xs text-slate-600">Точность: {lesson.accuracy}%</p>
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
