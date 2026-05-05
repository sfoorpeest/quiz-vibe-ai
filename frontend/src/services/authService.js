import api from '../api/axiosClient';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const payload = response.data;
    if (!payload || payload.success === false) {
      throw new Error(payload?.message || 'Đăng nhập thất bại');
    }
    return payload.data;
  },

  register: async (name, email, password, secretCode = '') => {
    // Backend mới (Validator) chỉ chấp nhận name, email, password, secretCode
    const response = await api.post('/api/auth/register', { name, email, password, secretCode });
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

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/api/auth/reset-password', { token, newPassword });
    return response.data;
  }
};
