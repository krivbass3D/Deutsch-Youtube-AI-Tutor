import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLessonStore } from '../../store/useLessonStore';
import TutorChat from '../TutorChat';
import VocabularyList from '../VocabularyList';

interface PracticeViewProps {
  onFeedback: (isCorrect: boolean, userAnswer: string) => void;
  onExerciseAttempt: (isCorrect: boolean, isFirstAttempt: boolean) => void;
  onReset: () => void;
}

const PracticeView: React.FC<PracticeViewProps> = ({ onFeedback, onExerciseAttempt, onReset }) => {
  const { selectedLesson, setView } = useAppStore();
  const { state } = useLessonStore();

  if (!selectedLesson || !state) return null;
  const { progress } = state;

  const currentExerciseIdx = progress.currentExerciseIdx || 0;
  const currentTaskIdx = progress.currentTaskIdx || 0;

  const currentExercise = selectedLesson.exercises?.[currentExerciseIdx];
  const currentTask = currentExercise?.tasks?.[currentTaskIdx];

  const totalTasks = useMemo(() => 
    selectedLesson.exercises.reduce((acc, ex) => acc + (ex.tasks?.length || 0), 0) || 0,
    [selectedLesson]
  );

  const currentGlobalIdx = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentExerciseIdx; i++) {
        count += selectedLesson.exercises[i].tasks?.length || 0;
    }
    return count + currentTaskIdx;
  }, [selectedLesson, currentExerciseIdx, currentTaskIdx]);

  const completionPercentage = totalTasks > 0 ? Math.round((currentGlobalIdx / totalTasks) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header & Progress */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
            <button 
              onClick={() => setView('lesson_overview')}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-xl shadow-sm transition-all"
              title="Назад к обзору"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div>
                <h3 className="font-black text-slate-800 leading-none mb-1">
                    {selectedLesson.title}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Задание {currentGlobalIdx + 1} из {totalTasks}
                </p>
            </div>
        </div>

        <div className="flex-1 max-w-md">
            <div className="flex justify-between items-center mb-1.5 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Прогресс занятия</span>
                <span className="text-[10px] font-black text-blue-600">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                    className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                />
            </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-2">
                <span className="text-green-500 font-black">{progress.statistics?.correct || 0}</span>
                <i className="fa-solid fa-check text-green-400 text-xs"></i>
            </div>
            <div className="w-px h-4 bg-slate-100" />
            <div className="flex items-center space-x-2">
                <span className="text-red-500 font-black">{progress.statistics?.incorrect || 0}</span>
                <i className="fa-solid fa-xmark text-red-400 text-xs"></i>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Task & Vocabulary */}
        <div className="lg:col-span-7 space-y-8">
            {/* Task Card */}
            <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-xl shadow-slate-200/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <i className="fa-solid fa-language text-8xl -rotate-12"></i>
                </div>
                
                <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100/50">
                    Переведите:
                </span>
                
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight tracking-tight">
                    {currentTask}
                </h2>

                <div className="mt-8 flex items-center space-x-4">
                    <button 
                       onClick={onReset}
                       className="px-6 py-2 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100 hover:bg-red-100 transition-all shadow-sm flex items-center"
                    >
                        <i className="fa-solid fa-trash-can mr-2"></i> Очистить прогресс урока
                    </button>
                </div>
            </div>

            {/* Compact Vocabulary Helper */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-700 flex items-center">
                    <i className="fa-solid fa-book-bookmark text-blue-500 mr-2 text-sm"></i>
                    Слова из урока
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedLesson.vocabulary?.length || 0} слов
                  </span>
               </div>
               
               <div className="flex flex-wrap gap-2">
                 {selectedLesson.vocabulary?.map((v, i) => (
                   <div 
                     key={i} 
                     className="group/chip relative bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 px-4 py-2 rounded-2xl transition-all cursor-default"
                   >
                     <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {v.word}
                     </p>
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/chip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl">
                        {v.translation}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                     </div>
                   </div>
                 ))}
               </div>
            </div>
        </div>

        {/* Right Side: Tutor Chat */}
        <div className="lg:col-span-5 sticky top-24">
            <TutorChat
                lesson={selectedLesson}
                lessonId={selectedLesson.lesson_id}
                currentExerciseIndex={currentExerciseIdx}
                currentTaskIndex={currentTaskIdx}
                onFeedback={onFeedback}
                onExerciseAttempt={onExerciseAttempt}
            />
        </div>
      </div>
    </div>
  );
};

export default PracticeView;
