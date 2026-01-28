import React from 'react';
import { useAppStore } from '../../store/useAppStore';

const Header: React.FC = () => {
  const { user, profile, currentView, setView, logout, selectedModel, setModel } = useAppStore();
  const [showModels, setShowModels] = React.useState(false);

  if (!user) return null;

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
            onClick={() => setView('dashboard')}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
            <span className="text-white font-black text-xl italic">dm</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors hidden xs:block">
            DeutschMeister
          </h1>
        </div>

        {/* Mobile "К уроку" button */}
        <div className="flex md:hidden flex-1 justify-center px-2">
          {['vocabulary', 'practice', 'exam'].includes(currentView) && (
            <button 
              onClick={() => setView('lesson_overview')}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center whitespace-nowrap"
            >
              <i className="fa-solid fa-arrow-left mr-1.5"></i> К уроку
            </button>
          )}
        </div>

        <nav className="hidden md:flex items-center space-x-1">
          {['vocabulary', 'practice', 'exam'].includes(currentView) && (
            <button 
              onClick={() => setView('lesson_overview')}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100 mr-2 flex items-center"
            >
              <i className="fa-solid fa-graduation-cap mr-2"></i> К уроку
            </button>
          )}
          <button 
            onClick={() => {
              if (currentView === 'dashboard') {
                document.getElementById('lesson-list')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                setView('dashboard');
                setTimeout(() => {
                  document.getElementById('lesson-list')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Уроки
          </button>
          <button 
            onClick={() => setView('vocab')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentView === 'vocab' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Словарь
          </button>
        </nav>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* AI Model Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowModels(!showModels)}
              className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-2 py-1.5 md:px-3 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${selectedModel === 'gpt-4o' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`} />
              <span className="text-[10px] md:text-xs font-bold text-slate-600">
                {selectedModel === 'gpt-4o' ? 'ChatGPT' : 'AI Studio'}
              </span>
              <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${showModels ? 'rotate-180' : ''}`} />
            </button>

            {showModels && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowModels(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in">
                  <button
                    onClick={() => {
                        setModel('gpt-4o');
                        setShowModels(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold hover:bg-slate-50 transition-colors ${selectedModel === 'gpt-4o' ? 'text-blue-600' : 'text-slate-600'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <span>ChatGPT</span>
                    </div>
                    {selectedModel === 'gpt-4o' && <i className="fa-solid fa-check" />}
                  </button>
                  <button
                    onClick={() => {
                        setModel('gemini-1.5-pro');
                        setShowModels(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold hover:bg-slate-50 transition-colors ${selectedModel === 'gemini-1.5-pro' ? 'text-blue-600' : 'text-slate-600'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      <span>Google AI Studio</span>
                    </div>
                    {selectedModel === 'gemini-1.5-pro' && <i className="fa-solid fa-check" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Profile & Logout Group */}
          <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center space-x-2 md:space-x-3 px-2 md:px-3 py-1.5 border-r border-slate-100">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] md:text-xs font-bold shadow-sm">
                {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ученик</p>
                <p className="text-xs font-bold text-slate-700 leading-none">
                  {profile?.full_name || user.email?.split('@')[0]}
                </p>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Выйти"
            >
              <i className="fa-solid fa-right-from-bracket text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
