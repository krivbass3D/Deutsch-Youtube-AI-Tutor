import './index.css';
import React, { useEffect, useMemo } from 'react';
import { useAppStore } from './store/useAppStore';
import { useLessonStore } from './store/useLessonStore';
import { useLessonLogic } from './hooks/useLessonLogic';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useAuth } from './components/AuthContext';
import { lessonService } from './services/lessonService';

// Layout & Views
import Header from './components/layout/Header';
import DashboardView from './components/views/DashboardView';
import LessonView from './components/views/LessonView';
import VocabularyView from './components/views/VocabularyView';
import PracticeView from './components/views/PracticeView';
import SummaryView from './components/views/SummaryView';

// Existing Components
import ExamMode from './components/ExamMode';
import GlobalVocabulary from './components/GlobalVocabulary';
import { AuthScreen } from './components/AuthScreen';
import { ToastContainer } from './components/Toast';
import { Lesson } from './types';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    currentView, setView, loading: appLoading, 
    setSelectedLesson, setError, setAuth, allUserStates 
  } = useAppStore();
  
  const { 
    lesson, state, setLesson, updateProgress, 
    resetLesson, setShowStatistics 
  } = useLessonStore();

  const { onFeedback, handleExerciseAttempt, handleNextTask, handlePrevTask } = useLessonLogic();
  const { loadLessonState } = useSupabaseSync();

  // 1. Sync store auth with context auth
  useEffect(() => {
    if (user) {
      setAuth(user, user.user_metadata);
    }
  }, [user, setAuth]);

  // 2. Fetch Lessons
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = React.useState(true);
  
  useEffect(() => {
    if (user) {
      setLessonsLoading(true);
      lessonService.fetchLessons()
        .then(data => {
            if (data) setLessons(data);
        })
        .catch(err => setError(err.message))
        .finally(() => setLessonsLoading(false));
    }
  }, [user, setError]);

  // 3. Navigation Handlers
  const handleSelectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLesson(lesson);
    setView('lesson_overview');
    setShowStatistics('lesson');
    await loadLessonState(lesson.lesson_id);
  };

  const totalTasks = useMemo(() => 
    lesson?.exercises?.reduce((acc, ex) => acc + (ex?.tasks?.length || 0), 0) || 0,
    [lesson]
  );

  const currentGlobalIdx = useMemo(() => {
    if (!lesson || !state?.progress) return 0;
    const { progress } = state;
    let count = 0;
    const exerciseIdx = progress.currentExerciseIdx || 0;
    const taskIdx = progress.currentTaskIdx || 0;

    for (let i = 0; i < exerciseIdx; i++) {
        count += lesson.exercises[i]?.tasks?.length || 0;
    }
    return count + taskIdx;
  }, [lesson, state]);

  if (authLoading || (user && lessonsLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-slate-500">Загрузка DeutschMeister...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Header />

      <main className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-10">
        {currentView === 'dashboard' && (
          <DashboardView 
            lessons={lessons} 
            onSelectLesson={handleSelectLesson} 
            onToggleVocab={() => setView('vocab')}
          />
        )}

        {currentView === 'lesson_overview' && lesson && state && (
          <LessonView 
            onStartVocab={() => setView('vocabulary')}
            onSkipVocab={() => {
              updateProgress({ vocabSkipped: true });
              setView('practice');
            }}
            onStartExam={() => setView('exam')}
            onStartPractice={() => setView('practice')}
            onResetLesson={resetLesson}
            onClearLearned={() => {
              if (window.confirm('Очистить прогресс выученных предложений?')) {
                updateProgress({ learnedTasks: [] });
              }
            }}
            currentGlobalIdx={currentGlobalIdx}
            totalTasks={totalTasks}
          />
        )}

        {currentView === 'vocabulary' && (
          <VocabularyView 
            onFinish={() => {
              updateProgress({ vocabCompleted: true });
              setView('practice');
            }}
            onSkip={() => {
              updateProgress({ vocabSkipped: true });
              setView('practice');
            }}
          />
        )}

        {currentView === 'practice' && (
          <PracticeView 
            onFeedback={onFeedback}
            onExerciseAttempt={handleExerciseAttempt}
            onReset={resetLesson}
          />
        )}

        {currentView === 'exam' && lesson && state && (
           <ExamMode 
             vocabulary={lesson.vocabulary}
             lessonId={lesson.lesson_id}
             lesson={lesson}
             srState={state.srState}
             difficultWords={new Set(state.difficultWords)}
             vocabStats={state.vocabStats}
             onExamAttempt={(word, isCorrect) => {
                // ExamMode direct state update (legacy support for now)
             }}
             onFinish={() => setView('lesson_overview')}
           />
        )}

        {currentView === 'summary' && <SummaryView />}

        {currentView === 'vocab' && (
           <GlobalVocabulary 
             lessons={lessons} 
             userStates={allUserStates} 
             onBack={() => setView('dashboard')} 
           />
        )}
      </main>

      <ToastContainer />

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
