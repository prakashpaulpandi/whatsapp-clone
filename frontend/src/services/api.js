import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('chatsphere_token') || localStorage.getItem('chatsphere_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config.url && (error.config.url.includes('/auth/login') || error.config.url.includes('/auth/signup') || error.config.url.includes('/auth/demo'));
      if (!isAuthUrl) {
        sessionStorage.removeItem('chatsphere_token');
        sessionStorage.removeItem('chatsphere_user');
        localStorage.removeItem('chatsphere_token');
        localStorage.removeItem('chatsphere_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
