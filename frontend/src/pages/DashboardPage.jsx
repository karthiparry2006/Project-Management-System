import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Navbar } from '../components/common/Navbar';
import { ProjectHeader } from '../components/dashboard/ProjectHeader';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { ChatDrawer } from '../components/chat/ChatDrawer';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const DashboardPage = () => {
  const { toastMessage } = useProject();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [defaultNewTaskLane, setDefaultNewTaskLane] = useState('Backlog');

  const handleOpenNewTask = (laneId = 'Backlog') => {
    setDefaultNewTaskLane(laneId);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl glass-panel bg-slate-900/95 border border-indigo-500/40 text-xs font-semibold text-white shadow-2xl animate-fade-in">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <ProjectHeader onNewTaskClick={() => handleOpenNewTask('Backlog')} />

        <KanbanBoard
          isCreateModalOpen={isCreateModalOpen}
          setIsCreateModalOpen={setIsCreateModalOpen}
          defaultNewTaskLane={defaultNewTaskLane}
          setDefaultNewTaskLane={setDefaultNewTaskLane}
        />
      </main>

      {/* RAG Chatbot Drawer */}
      <ChatDrawer />
    </div>
  );
};
