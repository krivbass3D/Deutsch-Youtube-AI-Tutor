import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLessonStore } from '../../store/useLessonStore';
import StatisticsDashboard from '../StatisticsDashboard';
import VocabularyList from '../VocabularyList';

interface LessonViewProps {
  onStartVocab: () => void;
  onSkipVocab: () => void;
  onStartExam: () => void;
  onStartPractice: () => void;
  onResetLesson: () => void;
  onClearLearned: () => void;
  currentGlobalIdx: number;
  totalTasks: number;
}

const LessonView: React.FC<LessonViewProps> = ({ 
  onStartVocab, 
  onSkipVocab, 
  onStartExam, 
  onStartPractice,
  onResetLesson,
  onClearLearned,
  currentGlobalIdx,
  totalTasks
}) => {
  const { selectedLesson } = useAppStore();
  const { state, showStatistics, setShowStatistics, expandedVocabulary, setExpandedVocabulary } = useLessonStore();

  if (!selectedLesson || !state) return null;
  const { progress } = state;

  return (
    <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in">
      {/* Lesson Header */}
      <div className="p-8 pb-4">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className="text-3xl font-black text-slate-800 leading-tight mb-2 tracking-tight">
              {selectedLesson.title}
            </h3>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Урок {selectedLesson.lesson_id}
              </span>
              <span className="text-slate-400 text-xs">
                {selectedLesson.vocabulary.length} слов • {totalTasks} упражнений
              </span>
            </div>
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-2xl shrink-0 ml-4">
            <button
              onClick={() => setShowStatistics('lesson')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                showStatistics === 'lesson' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-graduation-cap mr-2"></i> Урок
            </button>
            <button
              onClick={() => setShowStatistics('stats')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                showStatistics === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-chart-pie mr-2"></i> Статистика
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        {showStatistics === 'stats' ? (
          <StatisticsDashboard 
            lessonId={selectedLesson.lesson_id} 
            vocabulary={selectedLesson.vocabulary || []}
            vocabStats={state.vocabStats}
            srState={state.srState}
            progress={state.progress}
            lesson={selectedLesson}
          />
        ) : showStatistics === 'vocab' ? (
          <VocabularyList 
            vocabulary={selectedLesson.vocabulary || []} 
            title="Слова этого урока"
            stats={state.vocabStats}
            difficultWords={new Set(state.difficultWords)}
            srState={state.srState}
          />
        ) : (
          <div className="space-y-8">
            {/* Phase 1: Vocabulary */}
            <div className="relative pl-6 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500"></div>
              <h4 className="font-bold text-slate-700">Этап 1: Изучение лексики</h4>
              <p className="text-sm text-slate-500 mb-4">Слов: {selectedLesson.vocabulary?.length || 0}</p>
              <div className="flex space-x-3">
                <button onClick={onStartVocab} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100">
                  {progress.vocabCompleted ? 'Повторить' : 'Начать'}
                </button>
                {!progress.vocabCompleted && !progress.vocabSkipped && (
                  <button onClick={onSkipVocab} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">Пропустить →</button>
                )}
              </div>
            </div>

            {/* Phase 2: Exam */}
            <div className="relative pl-6 border-l-2 border-slate-100">
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${progress.vocabCompleted || progress.vocabSkipped ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
              <h4 className="font-bold text-slate-700">Этап 2: Режим экзамена</h4>
              {(progress.vocabCompleted || progress.vocabSkipped) ? (
                <>
                  <p className="text-sm text-slate-500 mb-4">Проверьте себя на словах урока</p>
                  <button onClick={onStartExam} className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-100 hover:bg-amber-700">
                    📝 Начать экзамен
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic flex items-center mb-4">
                  <i className="fa-solid fa-lock mr-2"></i> Заблокировано (изучите лексику или пропустите)
                </p>
              )}
            </div>

            {/* Phase 3: Practice */}
            <div className="relative pl-6 border-l-2 border-slate-100">
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${progress.vocabCompleted || progress.vocabSkipped ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
              <h4 className="font-bold text-slate-700">Этап 3: Практика</h4>
              {(progress.vocabCompleted || progress.vocabSkipped) ? (
                 <div>
                   <p className="text-sm text-slate-500 mb-4">📍 Вы на задании {currentGlobalIdx + 1} из {totalTasks}</p>
                   <div className="flex space-x-3">
                     <button onClick={onStartPractice} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100">
                       {currentGlobalIdx > 0 ? 'Продолжить' : 'Начать'}
                     </button>
                     {currentGlobalIdx > 0 && (
                       <button onClick={onResetLesson} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold" title="Начать заново">Сначала</button>
                     )}
                     {(progress?.learnedTasks?.length || 0) > 0 && (
                       <button 
                         onClick={onClearLearned}
                         className="px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-bold border border-red-100 shadow-sm"
                         title="Сбросить выученные задачи"
                       >
                         <i className="fa-solid fa-trash-can"></i>
                       </button>
                     )}
                   </div>
                 </div>
              ) : (
                <p className="text-sm text-slate-400 italic flex items-center">
                  <i className="fa-solid fa-lock mr-2"></i> Заблокировано (изучите лексику или пропустите)
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonView;
