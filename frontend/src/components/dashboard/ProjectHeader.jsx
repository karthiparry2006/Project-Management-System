import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  TrendingUp,
  FolderOpen
} from 'lucide-react';

export const ProjectHeader = ({ onNewTaskClick }) => {
  const { activeProject, metrics } = useProject();

  if (!activeProject) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl mb-6">
        <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-300">No project selected</h2>
        <p className="text-sm text-slate-500">Please choose or create a project to get started.</p>
      </div>
    );
  }

  const completion = metrics?.completion_rate || 0;
  const total = metrics?.total_tasks || 0;
  const inProgress = metrics?.status_counts?.['In Progress'] || 0;
  const overdue = metrics?.overdue_count || 0;

  return (
    <div className="mb-6 space-y-4">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/20">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white font-['Outfit']" id="active-project-title">
              {activeProject.name}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {activeProject.status}
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            {activeProject.description || 'Enterprise project management workspace.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            id="create-task-header-btn"
            onClick={onNewTaskClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks Card */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tasks</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-['Outfit']" id="metric-total-tasks">
            {total}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all workflow lanes</div>
        </div>

        {/* In Progress Card */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-400 font-['Outfit']" id="metric-in-progress">
            {inProgress}
          </div>
          <div className="text-xs text-slate-400 mt-1">Actively being worked on</div>
        </div>

        {/* Overdue Card */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-['Outfit']" id="metric-overdue">
            {overdue}
          </div>
          <div className="text-xs text-slate-400 mt-1">Passed scheduled deadline</div>
        </div>

        {/* Completion Rate Card */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/70 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completion</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 font-['Outfit']" id="metric-completion">
              {completion}%
            </span>
            <span className="text-xs text-slate-400">({metrics?.status_counts?.['Done'] || 0} done)</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, completion)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
