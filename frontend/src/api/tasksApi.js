import axiosClient from './axiosClient';

export const tasksApi = {
  getTasks: async (projectId) => {
    const params = projectId ? { project: projectId } : {};
    const res = await axiosClient.get('/api/tasks/', { params });
    return res.data;
  },

  getTask: async (id) => {
    const res = await axiosClient.get(`/api/tasks/${id}/`);
    return res.data;
  },

  createTask: async (data) => {
    const res = await axiosClient.post('/api/tasks/', data);
    return res.data;
  },

  updateTask: async (id, data) => {
    const res = await axiosClient.patch(`/api/tasks/${id}/`, data);
    return res.data;
  },

  deleteTask: async (id) => {
    const res = await axiosClient.delete(`/api/tasks/${id}/`);
    return res.data;
  },

  reorderTasks: async (items) => {
    const res = await axiosClient.post('/api/tasks/reorder/', items);
    return res.data;
  },

  getComments: async (taskId) => {
    const res = await axiosClient.get(`/api/tasks/${taskId}/comments/`);
    return res.data;
  },

  addComment: async (taskId, message) => {
    const res = await axiosClient.post(`/api/tasks/${taskId}/comments/`, { message });
    return res.data;
  },
};
