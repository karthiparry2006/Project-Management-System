import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { 
  Bot, 
  Layers, 
  FolderKanban, 
  LogOut, 
  Sparkles, 
  ChevronDown,
  User,
  Shield,
  Briefcase
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { projects, activeProject, setActiveProject, isChatOpen, setIsChatOpen } = useProject();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"><Shield size={12} /> Admin</span>;
      case 'Project Manager':
        return <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"><Briefcase size={12} /> Manager</span>;
      default:
        return <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><User size={12} /> Dev</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 bg-[#0c1222]/90 backdrop-blur-md px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <FolderKanban className="text-white w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  PMS Core
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  RAG + AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Intelligent Project Management</p>
            </div>
          </div>

          {/* Project Selector Dropdown */}
          {projects.length > 0 && (
            <div className="relative hidden md:flex items-center">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-sm shadow-inner">
                <Layers className="w-4 h-4 text-indigo-400" />
                <select
                  value={activeProject?.id || ''}
                  onChange={(e) => {
                    const sel = projects.find((p) => p.id === parseInt(e.target.value));
                    if (sel) setActiveProject(sel);
                  }}
                  className="bg-transparent text-slate-200 font-medium text-sm focus:outline-none cursor-pointer pr-3"
                  id="project-select-dropdown"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-3">
          {/* AI Assistant Button */}
          <button
            id="toggle-ai-chat-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              isChatOpen
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border-indigo-400/40 ring-2 ring-indigo-400/20'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-indigo-500/40 shadow-sm'
            }`}
          >
            <div className="relative">
              <Bot className={`w-4 h-4 ${isChatOpen ? 'text-white' : 'text-indigo-400'}`} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="hidden sm:inline">AI Assistant</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="text-right hidden lg:block">
                <div className="text-xs font-semibold text-slate-200">{user.first_name || user.username}</div>
                <div>{getRoleBadge(user.role)}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-700 flex items-center justify-center font-bold text-white text-sm border border-indigo-400/30 shadow">
                {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                id="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
