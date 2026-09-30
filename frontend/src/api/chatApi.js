import axiosClient from './axiosClient';

export const chatApi = {
  sendMessage: async (message, projectId = null, sessionId = 'default_session') => {
    const res = await axiosClient.post('/api/chat/', {
      message,
      project_id: projectId,
      session_id: sessionId,
    });
    return res.data;
  },

  getHistory: async (projectId = null, sessionId = 'default_session') => {
    const params = { session_id: sessionId };
    if (projectId) params.project_id = projectId;
    const res = await axiosClient.get('/api/chat/history/', { params });
    return res.data;
  },
};
