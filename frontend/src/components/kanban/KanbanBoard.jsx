import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { KanbanLane } from './KanbanLane';
import { TaskModal } from './TaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import { tasksApi } from '../../api/tasksApi';

const LANES = [
  {
    id: 'Backlog',
    title: 'Backlog',
    colorClass: 'bg-slate-400',
    badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700/60'
  },
  {
    id: 'In Progress',
    title: 'In Progress',
    colorClass: 'bg-blue-500',
    badgeColor: 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
  },
  {
    id: 'In Review',
    title: 'In Review',
    colorClass: 'bg-purple-500',
    badgeColor: 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
  },
  {
    id: 'Done',
    title: 'Done',
    colorClass: 'bg-emerald-500',
    badgeColor: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
  },
];

export const KanbanBoard = ({ isCreateModalOpen, setIsCreateModalOpen, defaultNewTaskLane, setDefaultNewTaskLane }) => {
  const { tasks, setTasks, refreshTasks, showToast } = useProject();
  const [selectedTask, setSelectedTask] = useState(null);

  const handleStatusChange = async (taskId, newStatus) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    // Optimistic state update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await tasksApi.updateTask(taskId, { status: newStatus });
      showToast(`Task moved to ${newStatus}`, 'success');
      refreshTasks();
    } catch (err) {
      console.error('Failed to update task status', err);
      setTasks(previousTasks);
      showToast('Failed to update task status on server', 'error');
    }
  };

  const handleTaskDrop = (taskId, targetLaneId) => {
    handleStatusChange(taskId, targetLaneId);
  };

  const handleAddTaskInLane = (laneId) => {
    setDefaultNewTaskLane(laneId);
    setIsCreateModalOpen(true);
  };

  return (
    <div>
      {/* 4 Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12" id="kanban-board-container">
        {LANES.map((lane) => {
          const laneTasks = tasks.filter((t) => t.status === lane.id);
          return (
            <KanbanLane
              key={lane.id}
              laneId={lane.id}
              title={lane.title}
              tasks={laneTasks}
              colorClass={lane.colorClass}
              badgeColor={lane.badgeColor}
              onTaskDrop={handleTaskDrop}
              onTaskClick={(task) => setSelectedTask(task)}
              onStatusChange={handleStatusChange}
              onAddTaskInLane={handleAddTaskInLane}
            />
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            setSelectedTask(null);
            refreshTasks();
          }}
        />
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          defaultStatus={defaultNewTaskLane}
          onClose={() => setIsCreateModalOpen(false)}
          onTaskCreated={() => {
            setIsCreateModalOpen(false);
            refreshTasks();
          }}
        />
      )}
    </div>
  );
};
