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
  }
};
