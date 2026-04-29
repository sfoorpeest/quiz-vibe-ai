import api from '../api/axiosClient';

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/api/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/profile', data);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/api/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getActivity: async () => {
    const response = await api.get('/api/profile/activity');
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get('/api/profile/summary');
    return response.data;
  },

  getQuizHistory: async () => {
    const response = await api.get('/api/quiz/quiz-history');
    return response.data?.data || [];
  },

  getRecommendation: async () => {
    const response = await api.get('/api/quiz/recommendation');
    return response.data || { message: '', suggestedLessons: [] };
  },

  getSavedMaterials: async () => {
    const response = await api.get('/my-lessons/saved');
    return response.data?.data || [];
  },

  getFavoriteMaterials: async () => {
    const response = await api.get('/my-lessons/favorite');
    return response.data?.data || [];
  },
};
