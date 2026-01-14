import './index.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lesson, LessonProgress, Vocabulary, Exercise, Answer } from './types';
import { INITIAL_LESSONS } from './constants';
import VocabularyCard from './components/VocabularyCard';
import TutorChat from './components/TutorChat';
import TokenIndicator from './components/TokenIndicator';
import ExamMode from './components/ExamMode';
import StatisticsDashboard from './components/StatisticsDashboard';
import GlobalDashboard from './components/GlobalDashboard';
import LessonCard from './components/LessonCard';
import { sortBySpacedRepetition } from './services/spacedRepetition';
import { AIProviderStatus } from './components/AIProviderStatus';
import { ToastContainer, showToast } from './components/Toast';
import { setToastFunction } from './services/aiService';

type ViewMode = 'dashboard' | 'lesson-overview' | 'vocabulary' | 'practice' | 'exam' | 'add-lesson' | 'summary';

const LESSONS_STORAGE_KEY = 'german_lessons_v1';

const App: React.FC = () => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Persistence logic for Lessons with improved error handling
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    console.log('🔄 Загрузка уроков из localStorage...');
    try {
      const saved = localStorage.getItem(LESSONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`✅ Загружено ${parsed.length} уроков из localStorage`);
          return parsed;
        }
      }
      console.log('ℹ️ localStorage пуст, загружаем стандартные уроки');
    } catch (e) {
      console.error('❌ Ошибка загрузки уроков:', e);
    }
    return INITIAL_LESSONS;
  });

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [expandedVocabulary, setExpandedVocabulary] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Инициализация Toast функции для aiService
  useEffect(() => {
    setToastFunction(showToast);
    console.log('✅ Toast функция подключена к aiService');
  }, []);

  // Enhanced save with visual feedback
  useEffect(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
      console.log(`💾 Сохранено ${lessons.length} уроков в localStorage`);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
      setSaveStatus('error');
      alert('⚠️ Не удалось сохранить данные. Возможно, переполнено хранилище браузера.');
    }
  }, [lessons]);

  const selectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setExpandedVocabulary(false);
    const saved = localStorage.getItem(`lesson_${lesson.lesson_id}_progress`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LessonProgress;
        console.log(`📖 Загружен прогресс урока #${lesson.lesson_id}`);
        setProgress(parsed);
      } catch (e) {
        console.log(`ℹ️ Создание нового прогресса для урока #${lesson.lesson_id}`);
        initializeProgress();
      }
    } else {
      console.log(`ℹ️ Новый прогресс для урока #${lesson.lesson_id}`);
      initializeProgress();
    }
    setCurrentView('lesson-overview');
  };

  const getLessonProgressFromStorage = (lessonId: string): LessonProgress | null => {
    try {
      const saved = localStorage.getItem(`lesson_${lessonId}_progress`);
      if (saved) {
        return JSON.parse(saved) as LessonProgress;
      }
    } catch (e) {
      console.error('Ошибка загрузки прогресса:', e);
    }
    return null;
  };

  // Состояние для триггера обновления прогресса
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);

  // Получаем прогресс для всех уроков (обновляется при изменении progress или lessons)
  const lessonProgress = useMemo(() => {
    const result: Record<string, LessonProgress> = {};
    lessons.forEach(lesson => {
      const prog = getLessonProgressFromStorage(lesson.lesson_id);
      if (prog) {
        result[lesson.lesson_id] = prog;
      }
    });
    console.log('🔄 Обновлён прогресс для всех уроков:', Object.keys(result).length);
    return result;
  }, [lessons, progressUpdateTrigger]);

  // Пересчитываем прогресс при изменении progress текущего урока
  useEffect(() => {
    if (progress && selectedLesson) {
      // Запускаем пересчет всех прогрессов с задержкой для гарантии сохранения в localStorage
      const timer = setTimeout(() => {
        setProgressUpdateTrigger(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, selectedLesson]);

  const initializeProgress = () => {
    setProgress({
      vocabSkipped: false,
      vocabCompleted: false,
      currentExerciseIdx: 0,
      currentTaskIdx: 0,
      statistics: { correct: 0, incorrect: 0, skipped: 0, answers: {} },
      completed: false,
      lastActivityAt: new Date().toISOString()
    });
  };

  useEffect(() => {
    if (selectedLesson && progress) {
      try {
        localStorage.setItem(`lesson_${selectedLesson.lesson_id}_progress`, JSON.stringify(progress));
        console.log(`💾 Прогресс урока #${selectedLesson.lesson_id} сохранён`);
      } catch (error) {
        console.error('❌ Ошибка сохранения прогресса:', error);
      }
    }
  }, [progress, selectedLesson]);

  const handleStartVocab = () => setCurrentView('vocabulary');
  const handleSkipVocab = () => {
    if (progress) setProgress({ ...progress, vocabSkipped: true });
    setCurrentView('practice');
  };
  const handleVocabFinish = () => {
    if (progress) setProgress({ ...progress, vocabCompleted: true });
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
      setProgress({ ...progress, currentTaskIdx: progress.currentTaskIdx + 1, statistics: updatedStats });
    } else if (progress.currentExerciseIdx < (selectedLesson.exercises?.length || 0) - 1) {
      setProgress({ ...progress, currentExerciseIdx: progress.currentExerciseIdx + 1, currentTaskIdx: 0, statistics: updatedStats });
    } else {
      setProgress({ ...progress, completed: true, statistics: updatedStats });
      setCurrentView('summary');
    }
  };

  const handlePrevTask = () => {
    if (!selectedLesson || !progress || (progress.currentTaskIdx === 0 && progress.currentExerciseIdx === 0)) return;
    if (progress.currentTaskIdx > 0) {
      setProgress({ ...progress, currentTaskIdx: progress.currentTaskIdx - 1 });
    } else if (progress.currentExerciseIdx > 0) {
      const prevEx = selectedLesson.exercises?.[progress.currentExerciseIdx - 1];
      if (prevEx) {
        setProgress({ 
          ...progress, 
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
    setProgress({ ...progress, statistics: updatedStats });
  };

  const resetLesson = () => {
    if (!selectedLesson) return;
    initializeProgress();
    setCurrentView('lesson-overview');
  };

  const deleteLesson = (e: React.MouseEvent, lessonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const idToDelete = String(lessonId);
    const lesson = lessons.find(l => String(l.lesson_id) === idToDelete);
    if (!lesson) return;

    // Check if there's progress
    const progressKey = `lesson_${idToDelete}_progress`;
    const hasProgress = localStorage.getItem(progressKey) !== null;

    let confirmMessage = `Вы уверены, что хотите удалить урок #${idToDelete}: "${lesson.title}"?`;
    if (hasProgress) {
      confirmMessage += '\n\n⚠️ У этого урока есть сохранённый прогресс, который будет потерян!';
    }

    if (window.confirm(confirmMessage)) {
      console.log(`🗑️ Удаление урока #${idToDelete}`);
      setLessons(prev => prev.filter(l => String(l.lesson_id) !== idToDelete));
      localStorage.removeItem(progressKey);
      
      if (selectedLesson && String(selectedLesson.lesson_id) === idToDelete) {
        setSelectedLesson(null);
        setCurrentView('dashboard');
      }
      
      console.log(`✅ Урок #${idToDelete} удалён`);
    }
  };

  const clearAllData = () => {
    const totalLessons = lessons.length;
    if (window.confirm(`⚠️ Удалить ВСЕ ${totalLessons} уроков и весь прогресс обучения?\n\nЭто действие НЕОБРАТИМО!`)) {
        console.log('🗑️ Очистка всех данных...');
        
        // Clear all lesson progress
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('lesson_')) {
                localStorage.removeItem(key);
            }
        });
        
        // Clear lessons
        localStorage.removeItem(LESSONS_STORAGE_KEY);
        setLessons([]);
        setSelectedLesson(null);
        setCurrentView('dashboard');
        
        console.log('✅ Все данные очищены');
        alert('✅ Все уроки и прогресс удалены');
    }
  };

  const restoreDefaults = () => {
    if (window.confirm("Восстановить стандартные уроки?\n\nВаши текущие уроки останутся, добавятся только отсутствующие.")) {
        console.log('🔄 Восстановление стандартных уроков...');
        const merged = [...lessons];
        let addedCount = 0;
        
        INITIAL_LESSONS.forEach(initial => {
            if (!lessons.find(l => String(l.lesson_id) === String(initial.lesson_id))) {
                merged.push(initial);
                addedCount++;
            }
        });
        
        setLessons(merged);
        console.log(`✅ Добавлено ${addedCount} стандартных уроков`);
        alert(`✅ Добавлено ${addedCount} стандартных уроков`);
    }
  };

  const handleAddLesson = () => {
    try {
      // Robust JSON extraction
      let cleanInput = jsonInput.trim();
      const firstBrace = cleanInput.indexOf('{');
      const lastBrace = cleanInput.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanInput = cleanInput.substring(firstBrace, lastBrace + 1);
      }

      let raw = JSON.parse(cleanInput);
      
      let transformedLesson: Partial<Lesson> = {};
      transformedLesson.lesson_id = String(raw.lesson_id || Date.now());
      transformedLesson.title = raw.title || "Новый урок";
      
      // Transform vocabulary if needed
      if (raw.vocabulary && !Array.isArray(raw.vocabulary) && typeof raw.vocabulary === 'object') {
        const flatVocab: Vocabulary[] = [];
        const mapping: Record<string, any> = { verbs: 'verb', nouns: 'noun', adverbs: 'adverb', adjectives: 'adjective' };
        
        Object.keys(raw.vocabulary).forEach(key => {
          if (Array.isArray(raw.vocabulary[key])) {
            raw.vocabulary[key].forEach((item: any) => {
              flatVocab.push({
                word: item.de || item.word || "Unknown",
                translation: item.ru || item.translation || "Неизвестно",
                type: mapping[key] || 'phrase'
              });
            });
          }
        });
        transformedLesson.vocabulary = flatVocab;
      } else {
        transformedLesson.vocabulary = raw.vocabulary || [];
      }

      // Transform exercises if needed
      if (Array.isArray(raw.exercises)) {
        const exercises: Exercise[] = [];
        const answers: Answer[] = [];
        
        raw.exercises.forEach((ex: any, idx: number) => {
          if (ex.items && Array.isArray(ex.items)) {
            exercises.push({
              title: ex.description || ex.title || `Упражнение ${idx + 1}`,
              tasks: ex.items.map((i: any) => i.ru)
            });
            answers.push({
              exercise: idx + 1,
              solutions: ex.items.map((i: any) => i.de)
            });
          } else if (ex.tasks && Array.isArray(ex.tasks)) {
            exercises.push(ex);
          }
        });
        
        transformedLesson.exercises = exercises;
        transformedLesson.answers = raw.answers && Array.isArray(raw.answers) ? raw.answers : answers;
      }

      const finalLesson = transformedLesson as Lesson;

      // Validation
      if (!finalLesson.lesson_id || !finalLesson.title || !Array.isArray(finalLesson.vocabulary) || !Array.isArray(finalLesson.exercises)) {
        alert('❌ Ошибка валидации данных. Убедитесь, что JSON содержит lesson_id, title, vocabulary и exercises.');
        return;
      }

      console.log(`➕ Добавление урока #${finalLesson.lesson_id}: ${finalLesson.title}`);

      // Check for existing lesson
      const existingIndex = lessons.findIndex(l => String(l.lesson_id) === String(finalLesson.lesson_id));
      if (existingIndex !== -1) {
        if (!window.confirm(`Урок #${finalLesson.lesson_id} уже существует. Заменить его?`)) return;
        const updated = [...lessons];
        updated[existingIndex] = finalLesson;
        setLessons(updated);
        console.log(`✅ Урок #${finalLesson.lesson_id} обновлён`);
      } else {
        setLessons(prev => [...prev, finalLesson]);
        console.log(`✅ Урок #${finalLesson.lesson_id} добавлен`);
      }

      setJsonInput('');
      setCurrentView('dashboard');
      alert('✅ Урок успешно добавлен!');
    } catch (err) {
      console.error("❌ Ошибка парсинга JSON:", err);
      alert('❌ Ошибка в формате JSON. Убедитесь, что вы вставили корректный объект в фигурных скобках {}.');
    }
  };

  const exportLessons = () => {
    if (lessons.length === 0) {
      alert('Нет уроков для экспорта');
      return;
    }
    
    console.log(`📤 Экспорт ${lessons.length} уроков...`);
    const data = {
      export_date: new Date().toISOString(),
      lessons_count: lessons.length,
      lessons: lessons
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `german_lessons_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Уроки экспортированы');
  };

  const importLessons = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log(`📥 Импорт из файла: ${file.name}`);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.lessons && Array.isArray(data.lessons)) {
          if (window.confirm(`Импортировать ${data.lessons.length} уроков?\n\nСуществующие уроки с такими же ID будут заменены.`)) {
            const newLessonsMap = new Map();
            lessons.forEach(l => newLessonsMap.set(String(l.lesson_id), l));
            data.lessons.forEach((l: Lesson) => newLessonsMap.set(String(l.lesson_id), l));
            
            const importedLessons = Array.from(newLessonsMap.values());
            setLessons(importedLessons);
            
            console.log(`✅ Импортировано ${data.lessons.length} уроков`);
            alert(`✅ Импортировано ${data.lessons.length} уроков`);
          }
        } else {
          alert('❌ Неверный формат файла');
        }
      } catch (err) {
        console.error('❌ Ошибка импорта:', err);
        alert('❌ Ошибка чтения файла');
      }
    };
    
    reader.readAsText(file);
  };

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

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">DM</div>
            <h1 className="text-xl font-bold text-slate-800">DeutschMeister</h1>
          </div>
          <div className="flex items-center space-x-4">
             {/* API Request Limit Indicator */}
             <div className="flex items-center space-x-2">
               <span className="text-xs text-slate-600 font-medium">Запросы AI:</span>
               <TokenIndicator />
             </div>
             
             {/* Save status indicator */}
             {saveStatus === 'saving' && (
               <div className="flex items-center space-x-2 text-blue-600 text-xs">
                 <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                 <span>Сохранение...</span>
               </div>
             )}
             {saveStatus === 'saved' && (
               <div className="flex items-center space-x-2 text-green-600 text-xs">
                 <i className="fa-solid fa-check"></i>
                 <span>Сохранено</span>
               </div>
             )}
             {saveStatus === 'error' && (
               <div className="flex items-center space-x-2 text-red-600 text-xs">
                 <i className="fa-solid fa-exclamation-triangle"></i>
                 <span>Ошибка</span>
               </div>
             )}
             
             {currentView === 'dashboard' && (
                <div className="flex space-x-2">
                  <button onClick={exportLessons} className="p-2 text-slate-500 hover:text-blue-600 transition-colors" title="Экспорт уроков">
                    <i className="fa-solid fa-file-export"></i>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-blue-600 transition-colors" title="Импорт уроков">
                    <i className="fa-solid fa-file-import"></i>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={importLessons} className="hidden" accept=".json" />
                </div>
             )}
             <button onClick={() => setCurrentView('dashboard')} className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
               {currentView === 'dashboard' ? '' : 'Главная'}
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
              lessonsProgress={Object.fromEntries(
                lessons.map(l => [
                  `lesson_${l.lesson_id}_progress`,
                  getLessonProgressFromStorage(l.lesson_id)
                ]).filter(([_, p]) => p !== null)
              )}
              onSelectLesson={(lessonId) => {
                const lesson = lessons.find(l => l.lesson_id === lessonId);
                if (lesson) selectLesson(lesson);
              }}
            />

            {/* Список уроков */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">📚 Все уроки</h2>
              <div className="flex justify-end gap-2 mb-4">
                <button 
                    onClick={restoreDefaults}
                    className="text-xs font-bold text-blue-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                    title="Добавить стандартные уроки (если отсутствуют)"
                >
                    Вернуть стандартные
                </button>
                <button 
                    onClick={clearAllData}
                    className="text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                    title="Удалить ВСЕ уроки и прогресс"
                >
                    Очистить всё
                </button>
              </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map(lesson => (
                  <LessonCard
                    key={lesson.lesson_id}
                    lesson={lesson}
                    progress={lessonProgress[lesson.lesson_id] || null}
                    onSelect={selectLesson}
                    onDelete={deleteLesson}
                  />
                ))}
                <div 
                  onClick={() => setCurrentView('add-lesson')} 
                  className="border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-blue-400 transition-all cursor-pointer min-h-[160px]"
                >
                  <i className="fa-solid fa-plus-circle text-2xl mb-2"></i>
                  <span className="font-semibold text-sm">Новый урок</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'lesson-overview' && selectedLesson && progress && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-md border border-slate-100 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center leading-tight">
                <i className="fa-solid fa-graduation-cap mr-3 text-blue-600 shrink-0"></i> {selectedLesson.title}
              </h2>
              <button
                onClick={() => setShowStatistics(!showStatistics)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  showStatistics
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Показать/скрыть статистику"
              >
                <i className="fa-solid fa-chart-bar mr-2"></i> Статистика
              </button>
            </div>

            {showStatistics ? (
              <StatisticsDashboard lessonId={selectedLesson.lesson_id} vocabulary={selectedLesson.vocabulary} />
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

        {currentView === 'vocabulary' && selectedLesson && (
          <VocabularyCard vocabulary={sortBySpacedRepetition(selectedLesson.vocabulary || [], selectedLesson.lesson_id)} onFinish={handleVocabFinish} lessonId={selectedLesson.lesson_id} />
        )}

        {currentView === 'exam' && selectedLesson && (
          <ExamMode 
            vocabulary={selectedLesson.vocabulary || []} 
            lessonId={selectedLesson.lesson_id}
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
                currentExerciseIndex={progress.currentExerciseIdx} 
                currentTaskIndex={progress.currentTaskIdx}
                onFeedback={onFeedback}
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

        {currentView === 'add-lesson' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Добавить урок</h2>
            <p className="text-sm text-slate-500 mb-6">
              Вставьте JSON-код урока. Приложение автоматически извлечёт данные даже если есть лишний текст.
            </p>
            <textarea 
              value={jsonInput} 
              onChange={e => setJsonInput(e.target.value)} 
              className="w-full h-80 bg-white border border-slate-200 rounded-3xl p-6 font-mono text-xs mb-6 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              placeholder='{ "lesson_id": "1", "title": "...", "vocabulary": [...], "exercises": [...], "answers": [...] }'
            />
            <div className="flex space-x-4">
               <button onClick={() => setCurrentView('dashboard')} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold hover:bg-slate-300 transition-colors">
                 Отмена
               </button>
               <button onClick={handleAddLesson} className="flex-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">
                 Сохранить
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
      
      {/* AI Provider Status Indicator */}
      <AIProviderStatus />
    </div>
  );
};

export default App;
