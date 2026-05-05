import api from '../api/axiosClient';
import { unwrapData } from '../utils/apiHelper';

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/api/profile');
    return unwrapData(response, 'Get profile');
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/profile', data);
    return unwrapData(response, 'Update profile');
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/api/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapData(response, 'Upload avatar');
  },

  getActivity: async () => {
    const response = await api.get('/api/profile/activity');
    return unwrapData(response, 'Get activity');
  },

  getDashboardSummary: async () => {
    const response = await api.get('/api/profile/summary');
    return unwrapData(response, 'Get dashboard summary');
  },

  getQuizHistory: async () => {
    const response = await api.get('/api/quiz/quiz-history');
    return unwrapData(response, 'Get quiz history') ?? [];
  },

  getRecommendation: async () => {
    const response = await api.get('/api/quiz/recommendation');
    return unwrapData(response, 'Get recommendation') ?? { message: '', suggestedLessons: [] };
  },

  getSavedMaterials: async () => {
    const response = await api.get('/my-lessons/saved');
    return unwrapData(response, 'Get saved materials') ?? [];
  },

  getFavoriteMaterials: async () => {
    const response = await api.get('/my-lessons/favorite');
    return unwrapData(response, 'Get favorite materials') ?? [];
  },
};
