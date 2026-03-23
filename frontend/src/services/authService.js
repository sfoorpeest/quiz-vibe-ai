import api from '../api/axiosClient';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  register: async (name, email, password, role = 'student', secretCode = '') => {
    const response = await api.post('/api/auth/register', { name, email, password, role, secretCode });
    return response.data;
  },
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/api/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
