import React from 'react';
import { 
  Calendar, 
  MessageSquare, 
  Clock, 
  User, 
  CheckCircle,
  MoreVertical,
  ArrowRight
} from 'lucide-react';

export const TaskCard = ({ task, onTaskClick, onStatusChange }) => {
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">Urgent</span>;
      case 'High':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">High</span>;
      case 'Medium':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Medium</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-600/30 text-slate-300 border border-slate-600/40">Low</span>;
    }
  };

  const isOverdue = task.due_date && task.status !== 'Done' && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: task.id, status: task.status }));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  return (
    <div
      id={`task-card-${task.id}`}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onTaskClick(task)}
      className="group relative glass-panel-subtle hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 cursor-grab active:cursor-grabbing transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Top Row: Priority & Quick Status Dropdown */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {getPriorityBadge(task.priority)}
        </div>
        
        {/* Quick Lane Jump Dropdown */}
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
          title="Change Status"
        >
          <option value="Backlog">Backlog</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Done">Done</option>
        </select>
      </div>

      {/* Task Title */}
      <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-200 transition-colors line-clamp-2 mb-1.5">
        {task.title}
      </h3>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Bottom Row: Metadata & Assignee */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-1">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.due_date}</span>
            </div>
          )}

          {/* Comments count */}
          <div className="flex items-center gap-1 text-slate-400 hover:text-slate-300">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{task.comment_count ?? task.comments?.length ?? 0}</span>
          </div>
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center">
          {task.assignee_details ? (
            <div 
              title={`Assigned to ${task.assignee_details.first_name || task.assignee_details.username}`}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10"
            >
              {(task.assignee_details.first_name?.[0] || task.assignee_details.username?.[0] || 'A').toUpperCase()}
            </div>
          ) : (
            <div 
              title="Unassigned"
              className="w-6 h-6 rounded-full bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-[10px] text-slate-400"
            >
              <User className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
