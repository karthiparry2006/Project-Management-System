import React from 'react';
import { CheckCircle2, ArrowRight, Calendar, Tag, ShieldAlert } from 'lucide-react';

export const ActionCard = ({ actionType, task }) => {
  if (!task) return null;

  const isCreate = actionType === 'CREATE_TASK';

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'High': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Medium': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-slate-700/30 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 shadow-md">
      <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isCreate ? 'Action Executed: Task Created' : 'Action Executed: Task Updated'}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getPriorityColor(task.priority)}`}>
          {task.priority} Priority
        </span>
      </div>

      <div className="text-xs font-bold text-slate-100 mb-1">
        {task.title}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-indigo-400" />
          <span>Lane: <strong className="text-slate-200">{task.status}</strong></span>
        </div>
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>Due: <strong className="text-slate-200">{task.due_date}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
