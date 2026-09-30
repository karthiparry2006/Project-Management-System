import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

export const KanbanLane = ({ 
  laneId, 
  title, 
  tasks, 
  colorClass, 
  badgeColor,
  onTaskDrop, 
  onTaskClick,
  onStatusChange,
  onAddTaskInLane
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only leave if not entering a child element
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.id) {
        onTaskDrop(data.id, laneId);
      }
    } catch (err) {
      console.error('Failed to parse dropped data', err);
    }
  };

  return (
    <div
      id={`kanban-lane-${laneId.toLowerCase().replace(/\s+/g, '-')}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl glass-panel p-4 min-h-[580px] transition-all duration-200 border ${
        isDragOver 
          ? 'border-indigo-400 bg-indigo-950/20 shadow-lg shadow-indigo-500/10' 
          : 'border-slate-800/80 bg-slate-900/40'
      }`}
    >
      {/* Lane Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
          <h2 className="font-semibold text-sm text-slate-200 tracking-wide font-['Outfit']">
            {title}
          </h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTaskInLane(laneId)}
          title={`Add task to ${title}`}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List / Drop Zone */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
            onStatusChange={onStatusChange}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 font-medium">No tasks in {title}</p>
            <p className="text-[11px] text-slate-600 mt-1">Drag a task here or click +</p>
          </div>
        )}
      </div>
    </div>
  );
};
