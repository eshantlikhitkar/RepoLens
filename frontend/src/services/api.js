import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('repolens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if we are already on login or landing page
      const path = window.location.pathname;
      if (path !== '/' && path !== '/login') {
        localStorage.removeItem('repolens_token');
        // Let AuthContext handle redirect smoothly
      }
    }
    return Promise.reject(error);
  }
);

export default api;
