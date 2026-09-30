import axiosClient from './axiosClient';

export const projectsApi = {
  getProjects: async () => {
    const res = await axiosClient.get('/api/projects/');
    return res.data;
  },

  getProject: async (id) => {
    const res = await axiosClient.get(`/api/projects/${id}/`);
    return res.data;
  },

  createProject: async (data) => {
    const res = await axiosClient.post('/api/projects/', data);
    return res.data;
  },

  updateProject: async (id, data) => {
    const res = await axiosClient.patch(`/api/projects/${id}/`, data);
    return res.data;
  },

  deleteProject: async (id) => {
    const res = await axiosClient.delete(`/api/projects/${id}/`);
    return res.data;
  },

  getProjectMetrics: async (id) => {
    const res = await axiosClient.get(`/api/projects/${id}/metrics/`);
    return res.data;
  },
};
