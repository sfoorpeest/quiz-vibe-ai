import api from '../api/axiosClient';

export const materialService = {
  getMaterials: async (params) => {
    const response = await api.get('/materials', { params });
    return response.data;
  },
  getMaterialDetail: async (id) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },
  getMyLessons: async () => {
    const response = await api.get('/my-lessons');
    return response.data;
  },
  getTags: async () => {
    const response = await api.get('/materials/tags');
    return response.data;
  },
  getSavedMaterials: async () => {
    const response = await api.get('/my-lessons/saved');
    return response.data;
  },
  getFavoriteMaterials: async () => {
    const response = await api.get('/my-lessons/favorite');
    return response.data;
  },
  saveMaterial: async (materialId) => {
    const response = await api.post(`/my-lessons/${materialId}/save`);
    return response.data;
  },
  unsaveMaterial: async (materialId) => {
    const response = await api.delete(`/my-lessons/${materialId}/save`);
    return response.data;
  },
  favoriteMaterial: async (materialId) => {
    const response = await api.post(`/my-lessons/${materialId}/favorite`);
    return response.data;
  },
  unfavoriteMaterial: async (materialId) => {
    const response = await api.delete(`/my-lessons/${materialId}/favorite`);
    return response.data;
  }
};
