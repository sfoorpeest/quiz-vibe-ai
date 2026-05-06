import api from '../api/axiosClient';
import { unwrapData } from '../utils/apiHelper';

export const materialService = {
  getMaterials: async (params) => {
    const response = await api.get('/materials', { params });
    return unwrapData(response, 'Get materials');
  },
  getMaterialDetail: async (id) => {
    const response = await api.get(`/materials/${id}`);
    return unwrapData(response, 'Get material detail');
  },
  getMyLessons: async () => {
    const response = await api.get('/my-lessons');
    return unwrapData(response, 'Get my lessons');
  },
  getTags: async () => {
    const response = await api.get('/materials/tags');
    return unwrapData(response, 'Get tags');
  },
  getSavedMaterials: async () => {
    const response = await api.get('/my-lessons/saved');
    return unwrapData(response, 'Get saved materials');
  },
  getFavoriteMaterials: async () => {
    const response = await api.get('/my-lessons/favorite');
    return unwrapData(response, 'Get favorite materials');
  },
  saveMaterial: async (materialId) => {
    const response = await api.post(`/my-lessons/${materialId}/save`);
    return unwrapData(response, 'Save material');
  },
  unsaveMaterial: async (materialId) => {
    const response = await api.delete(`/my-lessons/${materialId}/save`);
    return unwrapData(response, 'Unsave material');
  },
  favoriteMaterial: async (materialId) => {
    const response = await api.post(`/my-lessons/${materialId}/favorite`);
    return unwrapData(response, 'Favorite material');
  },
  unfavoriteMaterial: async (materialId) => {
    const response = await api.delete(`/my-lessons/${materialId}/favorite`);
    return unwrapData(response, 'Unfavorite material');
  }
};
