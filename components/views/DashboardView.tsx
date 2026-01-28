import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLessonStore } from '../../store/useLessonStore';
import GlobalDashboard from '../GlobalDashboard';
import LessonCard from '../LessonCard';
import { Lesson } from '../../types';

interface DashboardViewProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  onToggleVocab: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ lessons, onSelectLesson, onToggleVocab }) => {
  const { allUserStates } = useAppStore();

  const sortedLessons = React.useMemo(() => {
    return [...lessons].sort((a, b) => {
      const idA = parseInt(a.lesson_id.replace(/\D/g, ''), 10) || 0;
      const idB = parseInt(b.lesson_id.replace(/\D/g, ''), 10) || 0;
      return idA - idB;
    });
  }, [lessons]);

  return (
    <div className="space-y-8 animate-fade-in">
      <GlobalDashboard 
        lessons={sortedLessons} 
        userStates={allUserStates} 
        onToggleVocab={onToggleVocab}
      />
      
      <div id="lesson-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedLessons.map(lesson => {
          const state = allUserStates.find(s => s.lesson_id === lesson.lesson_id);
          return (
            <LessonCard
              key={lesson.lesson_id}
              lesson={lesson}
              progress={state?.progress || null}
              vocabStats={state?.vocabulary_stats || {}}
              srState={state?.spaced_repetition || {}}
              difficultWords={new Set(state?.difficult_words || [])}
              onSelect={onSelectLesson}
              onDelete={() => {}} // TODO: Implement delete logic if needed
            />
          );
        })}
        
        {/* Placeholder for "Add Lesson" if needed */}
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all cursor-pointer group">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-blue-50 transition-colors">
            <i className="fa-solid fa-plus text-xl"></i>
          </div>
          <p className="font-bold">Добавить урок</p>
          <p className="text-xs">из YouTube или текста</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
