import api from '../api/axiosClient';

export const itemActionService = {
  save: async ({ itemId, type, userId }) => {
    const response = await api.post('/api/profile/items/save', { itemId, type, userId });
    return response.data;
  },

  unsave: async ({ itemId, type, userId }) => {
    const response = await api.delete('/api/profile/items/save', { data: { itemId, type, userId } });
    return response.data;
  },

  favorite: async ({ itemId, type, userId }) => {
    const response = await api.post('/api/profile/items/favorite', { itemId, type, userId });
    return response.data;
  },

  unfavorite: async ({ itemId, type, userId }) => {
    const response = await api.delete('/api/profile/items/favorite', { data: { itemId, type, userId } });
    return response.data;
  },

  getSaved: async (type) => {
    const response = await api.get('/api/profile/items/saved', { params: type ? { type } : undefined });
    return response.data?.data || [];
  },

  getFavorites: async (type) => {
    const response = await api.get('/api/profile/items/favorites', { params: type ? { type } : undefined });
    return response.data?.data || [];
  },

  getStates: async ({ itemIds, type }) => {
    const response = await api.post('/api/profile/items/states', { itemIds, type });
    return response.data?.data || [];
  }
};