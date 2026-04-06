import api from '../api/axiosClient';

export const contactService = {
  submit: async (data) => {
    const response = await api.post('/api/contact', data);
    return response.data;
  },
};
