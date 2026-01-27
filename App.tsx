import './index.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lesson, LessonProgress, Vocabulary, Exercise, Answer } from './types';
import { INITIAL_LESSONS } from './constants';
import VocabularyCard from './components/VocabularyCard';
import TutorChat from './components/TutorChat';
import ExamMode from './components/ExamMode';
import StatisticsDashboard from './components/StatisticsDashboard';
import GlobalDashboard from './components/GlobalDashboard';
import LessonCard from './components/LessonCard';
// Services
import { 
  sortBySpacedRepetition, 
  SRState, 
  getSpacedRepetitionData,
  recordSuccessfulReview,
  recordFailedReview
} from './services/spacedRepetition';
import { 
  VocabStatsState, 
  recordWordView, 
  recordExamAnswer 
} from './services/vocabularyStatistics';
import { 
  DifficultyState, 
  toggleDifficultWord, 
  isWordDifficult 
} from './services/difficultyTracker';
import { lessonService } from './services/lessonService';
import { userStateService } from './services/userStateService';

import { AIProviderSelectorCompact } from './components/AIProviderSelectorCompact';
import { ToastContainer, showToast } from './components/Toast';
import { useAuth } from './components/AuthContext';
import { AuthScreen } from './components/AuthScreen';

type ViewMode = 'dashboard' | 'lesson-overview' | 'vocabulary' | 'practice' | 'exam' | 'add-lesson' | 'summary';

// Type for the consolidated state we hold for the active lesson
interface ActiveLessonState {
  progress: LessonProgress;
  srState: SRState;
  vocabStats: VocabStatsState;
  difficultWords: DifficultyState;
}

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Lessons fetched from DB
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  
  // Global User States (for dashboard)
  const [allUserStates, setAllUserStates] = useState<any[]>([]);

  // Active Lesson State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  // The big consolidated state object for the current lesson
  const [lessonState, setLessonState] = useState<ActiveLessonState | null>(null);

  // Helper to get progress part easily
  const progress = lessonState?.progress || null;

  const [expandedVocabulary, setExpandedVocabulary] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  
  // Stable vocabulary list for the current session to prevent re-sorting on every interaction
  const [stableVocabulary, setStableVocabulary] = useState<Vocabulary[]>([]);

  // Update stable vocabulary when entering vocabulary view
  useEffect(() => {
    if (currentView === 'vocabulary' && selectedLesson && lessonState && stableVocabulary.length === 0) {
      const sorted = sortBySpacedRepetition(
        selectedLesson.vocabulary || [], 
        lessonState.srState, 
        new Set(lessonState.difficultWords), 
        lessonState.vocabStats 
      );
      setStableVocabulary(sorted);
    }
  }, [currentView, selectedLesson, lessonState, stableVocabulary.length]);

  // Reset stable vocabulary when view changes
  useEffect(() => {
    if (currentView !== 'vocabulary') {
      setStableVocabulary([]);
    }
  }, [currentView, selectedLesson?.lesson_id]);

  // const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Lessons on Mount
  useEffect(() => {
    const loadLessons = async () => {
      try {
        setLessonsLoading(true);
        const data = await lessonService.fetchLessons();
        if (data && data.length > 0) {
          setLessons(data);
        } else {
          // Fallback if DB is empty? Or just show empty.
          // For migration, we seeded, so it should be fine.
          setLessons([]); 
        }
      } catch (err) {
        console.error('Failed to load lessons:', err);
      } finally {
        setLessonsLoading(false);
      }
    };

    const loadGlobalStats = async () => {
      if (!user) return;
      try {
        const states = await userStateService.getAllUserLessonStates(user.id);
        setAllUserStates(states || []);
      } catch (err) {
        console.error('Failed to load global stats:', err);
      }
    };

    if (user) {
      loadLessons();
      loadGlobalStats();
    } else {
      setLessonsLoading(false);
    }
  }, [user]);

  // Refresh global stats when returning to dashboard
  useEffect(() => {
    if (currentView === 'dashboard' && user) {
      const loadGlobalStats = async () => {
        try {
          const states = await userStateService.getAllUserLessonStates(user.id);
          setAllUserStates(states || []);
        } catch (err) {
          console.error('Failed to refresh global stats:', err);
        }
      };
      loadGlobalStats();
    }
  }, [currentView, user]);


  // 2. Select Lesson -> Fetch User State
  const selectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setExpandedVocabulary(false);
    setCurrentView('lesson-overview');
    setLessonState(null); // Clear previous state while loading

    if (!user) return;

    try {
      console.log(`📖 Loading state for lesson #${lesson.lesson_id}...`);
      const data = await userStateService.getUserLessonState(user.id, lesson.lesson_id);
      
      if (data) {
        setLessonState({
          progress: data.progress as LessonProgress,
          srState: (data.spaced_repetition || {}) as SRState,
          vocabStats: (data.vocabulary_stats || {}) as VocabStatsState,
          difficultWords: (data.difficult_words || []) as DifficultyState
        });
      } else {
        // Initialize new state
        console.log(`ℹ️ Initializing new state for lesson #${lesson.lesson_id}`);
        setLessonState({
          progress: initializeProgress(),
          srState: {},
          vocabStats: {},
          difficultWords: []
        });
      }
    } catch (err) {
      console.error('Error loading lesson state:', err);
      alert('Failed to load lesson progress. Please try again.');
      setCurrentView('dashboard');
    }
  };

  // 3. Save State Effect
  // Debounce saving to Supabase when lessonState changes
  useEffect(() => {
    if (!user || !selectedLesson || !lessonState) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await userStateService.saveUserLessonState(user.id, selectedLesson.lesson_id, {
          progress: lessonState.progress,
          spaced_repetition: lessonState.srState,
          vocabulary_stats: lessonState.vocabStats,
          difficult_words: lessonState.difficultWords
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Error saving state:', err);
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [lessonState, selectedLesson, user]);

  const initializeProgress = (): LessonProgress => {
    return {
      vocabSkipped: false,
      vocabCompleted: false,
      currentExerciseIdx: 0,
      currentTaskIdx: 0,
      statistics: { correct: 0, incorrect: 0, skipped: 0, answers: {} },
      completed: false,
      lastActivityAt: new Date().toISOString()
    };
  };

  // Handlers need to update lessonState now
  const updateProgress = (newProgress: Partial<LessonProgress>) => {
    if (!lessonState) return;
    setLessonState(prev => prev ? ({
      ...prev,
      progress: { ...prev.progress, ...newProgress }
    }) : null);
  };


  const handleStartVocab = () => setCurrentView('vocabulary');
  const handleSkipVocab = () => {
    updateProgress({ vocabSkipped: true });
    setCurrentView('practice');
  };
  const handleVocabFinish = () => {
    updateProgress({ vocabCompleted: true });
    setCurrentView('practice');
  };

  const handleNextTask = () => {
    if (!selectedLesson || !progress) return;
    const currentEx = selectedLesson.exercises?.[progress.currentExerciseIdx];
    if (!currentEx) return;

    const key = `${progress.currentExerciseIdx}-${progress.currentTaskIdx}`;
    const result = progress.statistics.answers[key];
    
    let updatedStats = { ...progress.statistics };
    if (!result) {
        updatedStats.incorrect += 1;
        updatedStats.answers[key] = { userAnswer: '', correct: false };
    }

    if (progress.currentTaskIdx < (currentEx.tasks?.length || 0) - 1) {
      updateProgress({ currentTaskIdx: progress.currentTaskIdx + 1, statistics: updatedStats });
    } else if (progress.currentExerciseIdx < (selectedLesson.exercises?.length || 0) - 1) {
      updateProgress({ currentExerciseIdx: progress.currentExerciseIdx + 1, currentTaskIdx: 0, statistics: updatedStats });
    } else {
      updateProgress({ completed: true, statistics: updatedStats });
      setCurrentView('summary');
    }
  };

  const handlePrevTask = () => {
    if (!selectedLesson || !progress || (progress.currentTaskIdx === 0 && progress.currentExerciseIdx === 0)) return;
    if (progress.currentTaskIdx > 0) {
      updateProgress({ currentTaskIdx: progress.currentTaskIdx - 1 });
    } else if (progress.currentExerciseIdx > 0) {
      const prevEx = selectedLesson.exercises?.[progress.currentExerciseIdx - 1];
      if (prevEx) {
        updateProgress({ 
          currentExerciseIdx: progress.currentExerciseIdx - 1, 
          currentTaskIdx: (prevEx.tasks?.length || 1) - 1 
        });
      }
    }
  };

  const onFeedback = (isCorrect: boolean, userAnswer: string) => {
    if (!progress) return;
    const key = `${progress.currentExerciseIdx}-${progress.currentTaskIdx}`;
    const prevAnswer = progress.statistics.answers[key];
    if (prevAnswer?.correct) return;

    let updatedStats = { ...progress.statistics };
    if (isCorrect) {
        updatedStats.correct += 1;
    }
    updatedStats.answers[key] = { userAnswer, correct: isCorrect };
    updateProgress({ statistics: updatedStats });
  };

  const resetLesson = () => {
    if (!selectedLesson) return;
    setLessonState(prev => prev ? ({
        ...prev,
        progress: initializeProgress()
    }) : null);
    setCurrentView('lesson-overview');
  };

  // Dashboard View (Global)
  // Note: GlobalDashboard currently only shows progress based on what we pass. 
  // For Supabase, we would ideally fetch ALL user progress at once.
  // For now, let's keep it simple. If we need to show progress on cards, 
  // we might need another effect to load summary data. 
  // BUT: userStateService allows fetching single state. 
  // To avoid N+1 requests, we should have an endpoint for all progress.
  // Skipping global progress visualization on cards for this step (or showing 0%).

  const totalTasks = useMemo(() => {
    if (!selectedLesson?.exercises) return 0;
    return selectedLesson.exercises.reduce((acc, ex) => acc + (ex.tasks?.length || 0), 0);
  }, [selectedLesson]);

  const currentGlobalIdx = useMemo(() => {
    if (!selectedLesson || !progress || !selectedLesson.exercises) return 0;
    let idx = 0;
    for (let i = 0; i < progress.currentExerciseIdx; i++) {
        idx += (selectedLesson.exercises[i]?.tasks?.length || 0);
    }
    return idx + progress.currentTaskIdx;
  }, [selectedLesson, progress]);

  const progressPercent = totalTasks > 0 ? Math.round(((currentGlobalIdx + 1) / totalTasks) * 100) : 0;

  if (authLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your German lessons...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">DM</div>
            <h1 className="text-xl font-bold text-slate-800">DeutschMeister</h1>
          </div>
          <div className="flex items-center space-x-4">
             {/* AI Provider Selector */}
             <div className="flex items-center space-x-2">
               <span className="text-xs text-slate-600 font-medium">AI:</span>
               <AIProviderSelectorCompact />
             </div>
             
             {/* Save status indicator */}
             {saveStatus === 'saving' && (
               <div className="flex items-center space-x-2 text-blue-600 text-xs">
                 <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 <span>Saving...</span>
               </div>
             )}
             {saveStatus === 'saved' && (
               <div className="flex items-center space-x-2 text-green-600 text-xs">
                 <i className="fa-solid fa-check"></i>
                 <span>Saved</span>
               </div>
             )}
             {saveStatus === 'error' && (
               <div className="flex items-center space-x-2 text-red-600 text-xs">
                 <i className="fa-solid fa-exclamation-triangle"></i>
                 <span>Error</span>
               </div>
             )}
             
             <button onClick={() => setCurrentView('dashboard')} className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
               {currentView === 'dashboard' ? '' : 'Dashboard'}
             </button>
             <button onClick={signOut} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors ml-4" title="Sign Out">
               <i className="fa-solid fa-sign-out-alt"></i>
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-8">
        {currentView === 'dashboard' && (
          <div className="animate-fade-in space-y-8">
            {/* Глобальный прогресс */}
              <GlobalDashboard 
                lessons={lessons}
                userStates={allUserStates}
                onSelectLesson={(lessonId) => {
                  const lesson = lessons.find(l => l.lesson_id.toString() === lessonId.toString());
                  if (lesson) selectLesson(lesson);
                }}
              />

            {/* Список уроков */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">📚 All Lessons</h2>
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map(lesson => {
                  const state = allUserStates.find(s => s.lesson_id.toString() === lesson.lesson_id.toString());
                  const progress = state?.progress || null;
                  const vocabStats = state?.vocabulary_stats || {};
                  const srState = state?.spaced_repetition || {};
                  const difficultWords = new Set<string>(state?.difficult_words || []);

                  return (
                    <LessonCard
                      key={lesson.lesson_id}
                      lesson={lesson}
                      progress={progress}
                      vocabStats={vocabStats}
                      srState={srState}
                      difficultWords={difficultWords}
                      onSelect={selectLesson}
                      onDelete={(e) => { e.preventDefault(); alert('Deleting lessons is disabled in this version.'); }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentView === 'lesson-overview' && selectedLesson && lessonState && progress && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-md border border-slate-100 animate-fade-in">
            {/* Header + Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center leading-tight">
                <i className="fa-solid fa-graduation-cap mr-3 text-blue-600 shrink-0"></i> {selectedLesson.title}
              </h2>
              
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setShowStatistics(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    !showStatistics 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <i className="fa-solid fa-book-open mr-2"></i> Урок
                </button>
                <button
                  onClick={() => setShowStatistics(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    showStatistics 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <i className="fa-solid fa-chart-pie mr-2"></i> Статистика
                </button>
              </div>
            </div>

            {showStatistics ? (
              <StatisticsDashboard 
                lessonId={selectedLesson.lesson_id} 
                vocabulary={selectedLesson.vocabulary || []}
                vocabStats={lessonState.vocabStats}
                srState={lessonState.srState}
              />
            ) : (
              <div className="space-y-8">
                <div className="relative pl-6 border-l-2 border-blue-100">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500"></div>
                  <h4 className="font-bold text-slate-700">Этап 1: Изучение лексики</h4>
                  <p className="text-sm text-slate-500 mb-4">Слов: {(selectedLesson.vocabulary?.length || 0)}</p>
                  <div className="flex space-x-3">
                    <button onClick={handleStartVocab} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100">
                      {progress.vocabCompleted ? 'Повторить' : 'Начать'}
                    </button>
                    {!progress.vocabCompleted && !progress.vocabSkipped && (
                      <button onClick={handleSkipVocab} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">Пропустить →</button>
                    )}
                  </div>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-100">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${progress.vocabCompleted || progress.vocabSkipped ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <h4 className="font-bold text-slate-700">Этап 2: Режим экзамена</h4>
                  {(progress.vocabCompleted || progress.vocabSkipped) ? (
                    <p className="text-sm text-slate-500 mb-4">Проверьте себя на словах урока</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic flex items-center mb-4">
                      <i className="fa-solid fa-lock mr-2"></i> Заблокировано (изучите лексику или пропустите)
                    </p>
                  )}
                  {(progress.vocabCompleted || progress.vocabSkipped) && (
                    <button onClick={() => setCurrentView('exam')} className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-100 hover:bg-amber-700">
                      📝 Начать экзамен
                    </button>
                  )}
                </div>

                <div className="relative pl-6 border-l-2 border-slate-100">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${progress.vocabCompleted || progress.vocabSkipped ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <h4 className="font-bold text-slate-700">Этап 3: Практика</h4>
                  {(progress.vocabCompleted || progress.vocabSkipped) ? (
                     <div>
                       <p className="text-sm text-slate-500 mb-4">📍 Вы на задании {currentGlobalIdx + 1} из {totalTasks}</p>
                       <div className="flex space-x-3">
                         <button onClick={() => setCurrentView('practice')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100">
                           {currentGlobalIdx > 0 ? 'Продолжить' : 'Начать'}
                         </button>
                         {currentGlobalIdx > 0 && (
                           <button onClick={resetLesson} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">Сначала</button>
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
        )}

        {currentView === 'vocabulary' && selectedLesson && lessonState && (
          <VocabularyCard 
            vocabulary={stableVocabulary.length > 0 ? stableVocabulary : selectedLesson.vocabulary || []} 
            difficultWords={new Set(lessonState.difficultWords)}
            onFinish={handleVocabFinish} 
            onRecordView={(word, translation, timeSpent) => {
              setLessonState(prev => {
                if (!prev) return null;
                const newStats = recordWordView(
                  prev.vocabStats, 
                  word, 
                  translation, 
                  timeSpent, 
                  prev.difficultWords.includes(word)
                );
                return { ...prev, vocabStats: newStats };
              });
            }}
            onReview={(word, translation, type, isCorrect) => {
              setLessonState(prev => {
                if (!prev) return null;
                // Update SR
                let newSRState = { ...prev.srState };
                const isDiff = prev.difficultWords.includes(word);
                
                if (isCorrect) {
                  newSRState = recordSuccessfulReview(newSRState, word, translation, type, isDiff);
                } else {
                  newSRState = recordFailedReview(newSRState, word, translation, type);
                }

                // Update Stats (Exam answer)
                const newStats = recordExamAnswer(prev.vocabStats, word, isCorrect);

                return { 
                  ...prev, 
                  srState: newSRState,
                  vocabStats: newStats
                };
              });
            }}
            onToggleDifficulty={(word) => {
              setLessonState(prev => {
                if (!prev) return null;
                const newDiff = toggleDifficultWord(prev.difficultWords, word);
                return { ...prev, difficultWords: newDiff };
              });
            }}
          />
        )}

        {currentView === 'exam' && selectedLesson && lessonState && (
          <ExamMode 
            vocabulary={selectedLesson.vocabulary || []}
            lessonId={selectedLesson.lesson_id}
            lesson={selectedLesson}
            srState={lessonState.srState}
            difficultWords={new Set(lessonState.difficultWords)}
            vocabStats={lessonState.vocabStats}
            onExamAttempt={(word, isCorrect) => {
              setLessonState(prev => {
                if (!prev) return null;
                // Update vocab stats
                const newStats = recordExamAnswer(prev.vocabStats, word, isCorrect);
                
                // Update progress stats (optional, but good for summary)
                const newProgress = { ...prev.progress };
                newProgress.statistics = { ...newProgress.statistics };
                if (isCorrect) newProgress.statistics.correct++;
                else newProgress.statistics.incorrect++;

                return { 
                  ...prev, 
                  vocabStats: newStats,
                  progress: newProgress
                };
              });
            }}
            onFinish={() => setCurrentView('lesson-overview')}
          />
        )}

        {currentView === 'practice' && selectedLesson && progress && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-end">
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedLesson.title}</h2>
                     <p className="text-sm text-slate-400">Задание {currentGlobalIdx + 1} из {totalTasks}</p>
                   </div>
                   <div className="flex space-x-4 text-sm font-bold">
                     <span className="text-green-600" title="Правильно">✅ {progress.statistics.correct}</span>
                     <span className="text-red-500" title="Неправильно">❌ {progress.statistics.incorrect}</span>
                   </div>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{progressPercent}%</div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Переведите:</h3>
                <p className="text-2xl font-bold text-slate-800 leading-relaxed">
                  {selectedLesson.exercises?.[progress.currentExerciseIdx]?.tasks?.[progress.currentTaskIdx] || 'Задание не найдено'}
                </p>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={handlePrevTask} 
                  disabled={currentGlobalIdx === 0}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold disabled:opacity-30 flex items-center justify-center transition-colors hover:bg-slate-50"
                >
                  <i className="fa-solid fa-arrow-left mr-2"></i> Назад
                </button>
                <button 
                  onClick={handleNextTask} 
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
                >
                  Следующая <i className="fa-solid fa-arrow-right ml-2"></i>
                </button>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 mb-2 uppercase">Слова из урока:</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedLesson.vocabulary || [])
                    .slice(0, expandedVocabulary ? undefined : 15)
                    .map((v, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 bg-white border border-blue-100 rounded-lg text-blue-600 font-medium">
                        {v.word}
                      </span>
                    ))}
                  {selectedLesson.vocabulary.length > 15 && !expandedVocabulary && (
                    <button
                      onClick={() => setExpandedVocabulary(true)}
                      className="text-[10px] text-blue-400 px-2 py-1 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer font-medium"
                    >
                      ... ({selectedLesson.vocabulary.length - 15} ещё)
                    </button>
                  )}
                  {expandedVocabulary && selectedLesson.vocabulary.length > 15 && (
                    <button
                      onClick={() => setExpandedVocabulary(false)}
                      className="text-[10px] text-blue-400 px-2 py-1 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer font-medium"
                    >
                      ↑ Свернуть
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <TutorChat 
                lesson={selectedLesson}
                lessonId={selectedLesson.lesson_id}
                currentExerciseIndex={progress.currentExerciseIdx} 
                currentTaskIndex={progress.currentTaskIdx}
                onFeedback={onFeedback}
                onExerciseAttempt={(isCorrect, isFirstAttempt) => {
                  setLessonState(prev => {
                    if (!prev) return null;
                    const newProgress = { ...prev.progress };
                    newProgress.statistics = { ...newProgress.statistics };
                    
                    if (isCorrect) {
                      newProgress.statistics.correct++;
                    } else {
                      newProgress.statistics.incorrect++;
                    }
                    
                    // Note: 'isFirstAttempt' logic could be used for more detailed scoring if needed
                    
                    return { ...prev, progress: newProgress };
                  });
                }}
              />
            </div>
          </div>
        )}

        {currentView === 'summary' && selectedLesson && progress && (
          <div className="max-w-md mx-auto bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center animate-fade-in">
            <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Урок завершён!</h2>
            <p className="text-slate-500 mb-8 leading-tight">{selectedLesson.title}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-xs font-bold text-slate-400 uppercase">Верно</p>
                 <p className="text-2xl font-bold text-green-600">{progress.statistics.correct}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-xs font-bold text-slate-400 uppercase">Ошибки</p>
                 <p className="text-2xl font-bold text-red-500">{progress.statistics.incorrect}</p>
               </div>
               <div className="col-span-2 bg-slate-50 p-4 rounded-2xl">
                 <p className="text-xs font-bold text-slate-400 uppercase">Процент правильных</p>
                 <p className="text-2xl font-bold text-blue-600">
                   {Math.round((progress.statistics.correct / (progress.statistics.correct + progress.statistics.incorrect)) * 100) || 0}%
                 </p>
               </div>
            </div>

            <div className="space-y-3">
              <button onClick={resetLesson} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
                Повторить урок
              </button>
              <button onClick={() => setCurrentView('dashboard')} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                На главную
              </button>
            </div>
          </div>
        )}


      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
      
      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  );
};

export default App;
