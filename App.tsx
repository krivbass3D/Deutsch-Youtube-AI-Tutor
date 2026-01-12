
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lesson, LessonProgress, Vocabulary, Exercise, Answer } from './types';
import { INITIAL_LESSONS } from './constants';
import VocabularyCard from './components/VocabularyCard';
import TutorChat from './components/TutorChat';

type ViewMode = 'dashboard' | 'lesson-overview' | 'vocabulary' | 'practice' | 'add-lesson' | 'summary';

const LESSONS_STORAGE_KEY = 'german_lessons_v1';

const App: React.FC = () => {
  // Persistence logic for Lessons
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    try {
      const saved = localStorage.getItem(LESSONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load lessons', e);
    }
    return INITIAL_LESSONS;
  });

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
  }, [lessons]);

  const selectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    const saved = localStorage.getItem(`lesson_${lesson.lesson_id}_progress`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LessonProgress;
        setProgress(parsed);
      } catch (e) {
        initializeProgress();
      }
    } else {
      initializeProgress();
    }
    setCurrentView('lesson-overview');
  };

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
      localStorage.setItem(`lesson_${selectedLesson.lesson_id}_progress`, JSON.stringify(progress));
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

    if (window.confirm(`Вы уверены, что хотите удалить урок #${idToDelete}: "${lesson.title}"?`)) {
      setLessons(prev => prev.filter(l => String(l.lesson_id) !== idToDelete));
      localStorage.removeItem(`lesson_${idToDelete}_progress`);
      if (selectedLesson && String(selectedLesson.lesson_id) === idToDelete) {
        setSelectedLesson(null);
        setCurrentView('dashboard');
      }
    }
  };

  const clearAllData = () => {
    if (window.confirm("Удалить ВСЕ уроки и весь прогресс обучения? Это действие необратимо.")) {
        // Clear all keys related to lessons progress
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('lesson_')) {
                localStorage.removeItem(key);
            }
        });
        localStorage.removeItem(LESSONS_STORAGE_KEY);
        setLessons([]);
        setSelectedLesson(null);
        setCurrentView('dashboard');
    }
  };

  const restoreDefaults = () => {
    if (window.confirm("Восстановить стандартные уроки? Ваши текущие уроки останутся.")) {
        const merged = [...lessons];
        INITIAL_LESSONS.forEach(initial => {
            if (!lessons.find(l => String(l.lesson_id) === String(initial.lesson_id))) {
                merged.push(initial);
            }
        });
        setLessons(merged);
    }
  };

  const handleAddLesson = () => {
    try {
      // Robust JSON extraction: finds the first '{' and last '}'
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

      if (!finalLesson.lesson_id || !finalLesson.title || !Array.isArray(finalLesson.vocabulary) || !Array.isArray(finalLesson.exercises)) {
        alert('❌ Ошибка валидации данных. Убедитесь, что JSON содержит lesson_id, title, vocabulary и exercises.');
        return;
      }

      const existingIndex = lessons.findIndex(l => String(l.lesson_id) === String(finalLesson.lesson_id));
      if (existingIndex !== -1) {
        if (!window.confirm(`Урок #${finalLesson.lesson_id} уже существует. Заменить его?`)) return;
        const updated = [...lessons];
        updated[existingIndex] = finalLesson;
        setLessons(updated);
      } else {
        setLessons(prev => [...prev, finalLesson]);
      }

      setJsonInput('');
      setCurrentView('dashboard');
      alert('✅ Урок успешно добавлен!');
    } catch (err) {
      console.error("JSON Parse Error:", err);
      alert('❌ Ошибка в формате JSON. Убедитесь, что вы вставили корректный объект в фигурных скобках {}.');
    }
  };

  const exportLessons = () => {
    if (lessons.length === 0) {
      alert('Нет уроков для экспорта');
      return;
    }
    const data = {
      export_date: new Date().toISOString(),
      lessons: lessons
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `german_lessons_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLessons = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.lessons && Array.isArray(data.lessons)) {
          if (window.confirm(`Импортировать ${data.lessons.length} уроков?`)) {
            const newLessonsMap = new Map();
            lessons.forEach(l => newLessonsMap.set(String(l.lesson_id), l));
            data.lessons.forEach((l: Lesson) => newLessonsMap.set(String(l.lesson_id), l));
            setLessons(Array.from(newLessonsMap.values()));
            alert(`✅ Импортировано ${data.lessons.length} уроков`);
          }
        }
      } catch (err) {
        alert('Ошибка чтения файла');
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
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-slate-800">Ваши уроки</h2>
              <div className="flex space-x-4">
                <button 
                    onClick={restoreDefaults}
                    className="text-xs font-bold text-blue-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                >
                    Вернуть стандартные
                </button>
                <button 
                    onClick={clearAllData}
                    className="text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                >
                    Очистить всё
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map(lesson => (
                <div 
                  key={lesson.lesson_id} 
                  onClick={() => selectLesson(lesson)} 
                  className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group shadow-sm relative overflow-hidden"
                >
                  <button 
                    onClick={(e) => deleteLesson(e, lesson.lesson_id)}
                    className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors z-20 opacity-0 group-hover:opacity-100"
                    title="Удалить урок"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><i className="fa-solid fa-book"></i></div>
                  <h3 className="text-lg font-bold text-slate-800 pr-8 leading-tight">{lesson.title}</h3>
                  <p className="text-xs text-slate-400 mt-2">Урок №{lesson.lesson_id} • {(lesson.vocabulary?.length || 0)} слов</p>
                </div>
              ))}
              <div onClick={() => setCurrentView('add-lesson')} className="border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-blue-400 transition-all cursor-pointer min-h-[160px]">
                <i className="fa-solid fa-plus-circle text-2xl mb-2"></i>
                <span className="font-semibold text-sm">Новый урок</span>
              </div>
            </div>
          </div>
        )}

        {currentView === 'lesson-overview' && selectedLesson && progress && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-md border border-slate-100 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center leading-tight">
              <i className="fa-solid fa-graduation-cap mr-3 text-blue-600 shrink-0"></i> {selectedLesson.title}
            </h2>
            
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
                <h4 className="font-bold text-slate-700">Этап 2: Практика</h4>
                {(progress.vocabCompleted || progress.vocabSkipped) ? (
                   <div>
                     <p className="text-sm text-slate-500 mb-4">📍 Вы на задании {currentGlobalIdx + 1} из {totalTasks}</p>
                     <div className="flex space-x-3">
                       <button onClick={() => setCurrentView('practice')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100">Продолжить</button>
                       <button onClick={resetLesson} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">Сначала</button>
                     </div>
                   </div>
                ) : (
                  <p className="text-sm text-slate-400 italic flex items-center"><i className="fa-solid fa-lock mr-2"></i> Заблокировано (изучите лексику)</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'vocabulary' && selectedLesson && (
          <VocabularyCard vocabulary={selectedLesson.vocabulary || []} onFinish={handleVocabFinish} />
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
                     <span className="text-green-600">✅ {progress.statistics.correct}</span>
                     <span className="text-red-500">❌ {progress.statistics.incorrect}</span>
                   </div>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">{progressPercent}%</div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Переведите:</h3>
                <p className="text-2xl font-bold text-slate-800 leading-relaxed">{selectedLesson.exercises?.[progress.currentExerciseIdx]?.tasks?.[progress.currentTaskIdx] || 'Задание не найдено'}</p>
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
                  {(selectedLesson.vocabulary || []).slice(0, 15).map((v, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-white border border-blue-100 rounded-lg text-blue-600 font-medium">{v.word}</span>
                  ))}
                  {selectedLesson.vocabulary.length > 15 && <span className="text-[10px] text-blue-400 px-1">...</span>}
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
            </div>

            <div className="space-y-3">
              <button onClick={resetLesson} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">Повторить ошибки</button>
              <button onClick={() => setCurrentView('dashboard')} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">На главную</button>
            </div>
          </div>
        )}

        {currentView === 'add-lesson' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Добавить урок</h2>
            <p className="text-sm text-slate-500 mb-6">Вставьте JSON-код урока. Если в тексте есть лишние пояснения, приложение постарается их проигнорировать.</p>
            <textarea 
              value={jsonInput} 
              onChange={e => setJsonInput(e.target.value)} 
              className="w-full h-80 bg-white border border-slate-200 rounded-3xl p-6 font-mono text-xs mb-6 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              placeholder='{ "lesson_id": "1", "title": "...", ... }'
            />
            <div className="flex space-x-4">
               <button onClick={() => setCurrentView('dashboard')} className="flex-1 py-3 bg-slate-200 rounded-xl font-bold hover:bg-slate-300 transition-colors">Отмена</button>
               <button onClick={handleAddLesson} className="flex-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">Сохранить</button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
