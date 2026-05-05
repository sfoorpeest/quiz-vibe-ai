import api from '../api/axiosClient';
import { unwrapData } from '../utils/apiHelper';

export const itemActionService = {
  save: async ({ itemId, type, userId }) => {
    const response = await api.post('/api/profile/items/save', { itemId, type, userId });
    return unwrapData(response, 'Save item');
  },

  unsave: async ({ itemId, type, userId }) => {
    const response = await api.delete('/api/profile/items/save', { data: { itemId, type, userId } });
    return unwrapData(response, 'Unsave item');
  },

  favorite: async ({ itemId, type, userId }) => {
    const response = await api.post('/api/profile/items/favorite', { itemId, type, userId });
    return unwrapData(response, 'Favorite item');
  },

  unfavorite: async ({ itemId, type, userId }) => {
    const response = await api.delete('/api/profile/items/favorite', { data: { itemId, type, userId } });
    return unwrapData(response, 'Unfavorite item');
  },

  getSaved: async (type) => {
    const response = await api.get('/api/profile/items/saved', { params: type ? { type } : undefined });
    return unwrapData(response, 'Get saved') ?? [];
  },

  getFavorites: async (type) => {
    const response = await api.get('/api/profile/items/favorites', { params: type ? { type } : undefined });
    return unwrapData(response, 'Get favorites') ?? [];
  },

  getStates: async ({ itemIds, type }) => {
    const response = await api.post('/api/profile/items/states', { itemIds, type });
    return unwrapData(response, 'Get states') ?? [];
  }
};