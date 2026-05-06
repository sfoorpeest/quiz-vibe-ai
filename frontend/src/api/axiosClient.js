import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: attach token from localStorage if you store it there
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const hasToken = Boolean(localStorage.getItem('token'));
    const isAuthEndpoint = /\/api\/auth\/(login|register|forgot-password|reset-password)/.test(requestUrl);

    if (status === 401 && hasToken && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isPublicAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password';
        if (!isPublicAuthPage) {
          window.location.replace('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
