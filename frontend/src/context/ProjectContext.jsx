import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsApi } from '../api/projectsApi';
import { tasksApi } from '../api/tasksApi';
import { authApi } from '../api/authApi';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial projects & team members
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getProjects();
      const projList = Array.isArray(data) ? data : data.results || [];
      setProjects(projList);
      if (projList.length > 0 && !activeProject) {
        setActiveProject(projList[0]);
      }
    } catch (err) {
      console.error('Failed fetching projects', err);
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const users = await authApi.getUsers();
      setTeamMembers(Array.isArray(users) ? users : users.results || []);
    } catch (err) {
      console.error('Failed fetching team members', err);
    }
  }, []);

  // Fetch tasks and metrics when activeProject changes
  const fetchTasksAndMetrics = useCallback(async (projId) => {
    if (!projId) return;
    try {
      const [tasksData, metricsData] = await Promise.all([
        tasksApi.getTasks(projId),
        projectsApi.getProjectMetrics(projId),
      ]);
      const list = Array.isArray(tasksData) ? tasksData : tasksData.results || [];
      setTasks(list);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed fetching tasks/metrics', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (activeProject?.id) {
      fetchTasksAndMetrics(activeProject.id);
    }
  }, [activeProject?.id, fetchTasksAndMetrics]);

  // Synchronized state handler for LLM Tool events
  const handleTaskMutated = useCallback((updatedTask, actionType) => {
    if (!updatedTask) return;

    setTasks((prevTasks) => {
      const exists = prevTasks.some((t) => t.id === updatedTask.id);
      if (exists) {
        // Update existing task (e.g. status changed or edited)
        return prevTasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
      } else {
        // Prepend / append new task if it belongs to current project (or no filter)
        if (!activeProject || updatedTask.project === activeProject.id) {
          return [updatedTask, ...prevTasks];
        }
        return prevTasks;
      }
    });

    // Refresh metrics
    if (activeProject?.id) {
      projectsApi.getProjectMetrics(activeProject.id).then(setMetrics).catch(() => {});
    }

    if (actionType === 'CREATE_TASK') {
      showToast(`AI Assistant created task: "${updatedTask.title}"`, 'success');
    } else if (actionType === 'UPDATE_TASK_STATUS') {
      showToast(`AI Assistant moved "${updatedTask.title}" to ${updatedTask.status}`, 'success');
    }
  }, [activeProject]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        tasks,
        setTasks,
        metrics,
        teamMembers,
        loading,
        isChatOpen,
        setIsChatOpen,
        toastMessage,
        showToast,
        fetchProjects,
        refreshTasks: () => activeProject?.id && fetchTasksAndMetrics(activeProject.id),
        handleTaskMutated,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
