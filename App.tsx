
import React, { useState, useEffect } from 'react';
import { Lesson } from './types';
import { INITIAL_LESSONS } from './constants';
import VocabularyCard from './components/VocabularyCard';
import TutorChat from './components/TutorChat';

type ViewMode = 'dashboard' | 'vocabulary' | 'practice' | 'add-lesson';

const App: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [showKeyWarning, setShowKeyWarning] = useState(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setShowKeyWarning(true);
    }
  }, []);

  const startLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentView('vocabulary');
    setCurrentExerciseIdx(0);
    setCurrentTaskIdx(0);
  };

  const handleFinishVocab = () => {
    setCurrentView('practice');
  };

  const handleNextTask = () => {
    if (!selectedLesson) return;
    const currentEx = selectedLesson.exercises[currentExerciseIdx];
    
    if (currentTaskIdx < currentEx.tasks.length - 1) {
      setCurrentTaskIdx(prev => prev + 1);
    } else if (currentExerciseIdx < selectedLesson.exercises.length - 1) {
      setCurrentExerciseIdx(prev => prev + 1);
      setCurrentTaskIdx(0);
    } else {
      // Completed all
      alert('Поздравляем! Вы завершили урок.');
      setCurrentView('dashboard');
    }
  };

  const handleAddLesson = () => {
    try {
      const newLesson = JSON.parse(jsonInput) as Lesson;
      if (!newLesson.lesson_id || !newLesson.title) throw new Error("Invalid structure");
      setLessons(prev => [...prev, newLesson]);
      setJsonInput('');
      setCurrentView('dashboard');
    } catch (err) {
      alert('Ошибка при разборе JSON. Убедитесь, что формат соответствует примеру.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">DeutschMeister</h1>
          </div>
          <div className="flex items-center space-x-4">
             {currentView === 'dashboard' && (
                <button 
                    onClick={() => setCurrentView('add-lesson')}
                    className="text-sm font-semibold bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                >
                    <i className="fa-solid fa-plus mr-2"></i> Добавить урок
                </button>
             )}
             {currentView !== 'dashboard' && (
                <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    Выйти в меню
                </button>
             )}
          </div>
        </div>
      </nav>

      {showKeyWarning && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 text-center text-amber-800 text-sm font-medium">
          <i className="fa-solid fa-circle-exclamation mr-2"></i>
          API_KEY не обнаружен. Пожалуйста, убедитесь, что переменная окружения настроена.
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 pt-10">
        {currentView === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">С возвращением!</h2>
              <p className="text-slate-500">Выберите урок, чтобы продолжить обучение.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map(lesson => (
                <div 
                  key={lesson.lesson_id}
                  onClick={() => startLesson(lesson)}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-book-open"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{lesson.title}</h3>
                  <p className="text-sm text-slate-500 mb-6">Урок №{lesson.lesson_id} • {lesson.vocabulary.length} слов</p>
                  <div className="flex items-center text-blue-600 text-sm font-bold">
                    Начать обучение <i className="fa-solid fa-chevron-right ml-2 text-xs"></i>
                  </div>
                </div>
              ))}
              
              <div 
                onClick={() => setCurrentView('add-lesson')}
                className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-slate-400 cursor-pointer transition-all"
              >
                <i className="fa-solid fa-plus-circle text-2xl mb-2"></i>
                <span className="font-semibold">Добавить урок</span>
              </div>
            </div>
          </div>
        )}

        {currentView === 'add-lesson' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
             <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Импорт урока</h2>
              <p className="text-slate-500">Вставьте JSON-структуру вашего урока ниже.</p>
            </div>
            <textarea 
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "lesson_id": "3", "title": "...", "vocabulary": [...], ... }'
              className="w-full h-80 bg-white border border-slate-200 rounded-3xl p-6 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-6"
            />
            <div className="flex space-x-4">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-300 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleAddLesson}
                  className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                >
                  Импортировать
                </button>
            </div>
          </div>
        )}

        {currentView === 'vocabulary' && selectedLesson && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <span className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2 block">Этап 1: Лексика</span>
              <h2 className="text-3xl font-bold text-slate-800">{selectedLesson.title}</h2>
            </div>
            <VocabularyCard 
              vocabulary={selectedLesson.vocabulary} 
              onFinish={handleFinishVocab} 
            />
          </div>
        )}

        {currentView === 'practice' && selectedLesson && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in items-start">
            <div>
              <div className="mb-8">
                <span className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2 block">Этап 2: Практика</span>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">{selectedLesson.title}</h2>
                <div className="flex space-x-2">
                  {selectedLesson.exercises.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 flex-1 rounded-full ${i <= currentExerciseIdx ? 'bg-blue-600' : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
                <h3 className="font-bold text-slate-500 mb-4 uppercase text-xs tracking-widest">Текущее задание</h3>
                <p className="text-2xl font-bold text-slate-800 leading-tight">
                  {selectedLesson.exercises[currentExerciseIdx].tasks[currentTaskIdx]}
                </p>
                <div className="mt-8 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">
                        Задача {currentTaskIdx + 1} из {selectedLesson.exercises[currentExerciseIdx].tasks.length}
                    </span>
                    <button 
                        onClick={handleNextTask}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        Следующая задача <i className="fa-solid fa-arrow-right ml-2"></i>
                    </button>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <h4 className="font-bold text-blue-800 text-sm mb-3 flex items-center">
                    <i className="fa-solid fa-lightbulb mr-2"></i> Доступные слова
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLesson.vocabulary.map((v, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-sm rounded-full font-medium">
                      {v.word}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <TutorChat 
              lesson={selectedLesson}
              currentExerciseIndex={currentExerciseIdx}
              currentTaskIndex={currentTaskIdx}
              onSuccess={() => {}} 
            />
          </div>
        )}
      </main>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
