import api from '../api/axiosClient';

export const authService = {
  login: async (name, password) => {
    const response = await api.post('/api/auth/login', { name, password });
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
