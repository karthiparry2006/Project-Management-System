import axiosClient from './axiosClient';

export const authApi = {
  login: async (username, password) => {
    const res = await axiosClient.post('/api/auth/token/', { username, password });
    return res.data;
  },

  register: async (userData) => {
    const res = await axiosClient.post('/api/auth/register/', userData);
    return res.data;
  },

  getMe: async () => {
    const res = await axiosClient.get('/api/auth/me/');
    return res.data;
  },

  getUsers: async () => {
    const res = await axiosClient.get('/api/auth/users/');
    return res.data;
  },
};
