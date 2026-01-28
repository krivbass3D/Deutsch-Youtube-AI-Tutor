import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useLessonStore } from '../../store/useLessonStore';

const SummaryView: React.FC = () => {
    const { selectedLesson, setView: setAppView } = useAppStore();
    const { state } = useLessonStore();
    
    if (!state || !selectedLesson) return null;
    const { progress } = state;

    return (
        <div className="max-w-xl mx-auto py-20 text-center animate-fade-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-4xl mx-auto mb-8 shadow-inner">
                <i className="fa-solid fa-trophy"></i>
            </div>
            
            <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Урок завершен!</h2>
            <p className="text-slate-500 font-medium mb-12">Вы отлично поработали над «{selectedLesson.title}»</p>
            
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex justify-around mb-12">
                <div>
                    <p className="text-3xl font-black text-slate-800">{progress.statistics.correct}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Верно</p>
                </div>
                <div className="w-px h-12 bg-slate-100 my-auto"></div>
                <div>
                    <p className="text-3xl font-black text-slate-800">{progress.statistics.incorrect}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ошибок</p>
                </div>
            </div>
            
            <button 
                onClick={() => setAppView('dashboard')}
                className="px-10 py-5 bg-blue-600 text-white rounded-[24px] text-lg font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
            >
                На главную
            </button>
        </div>
    );
};

export default SummaryView;
