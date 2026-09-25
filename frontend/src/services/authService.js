import api, { API_BASE_URL } from './api';

export const authService = {
  async getMe() {
    const { data } = await api.get('/api/auth/me');
    return data.user;
  },

  async loginDemo() {
    const { data } = await api.post('/api/auth/demo');
    if (data.token) {
      localStorage.setItem('repolens_token', data.token);
    }
    return data.user;
  },

  async logout() {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('repolens_token');
    }
  },

  getGitHubLoginUrl() {
    return `${API_BASE_URL}/api/auth/github`;
  },
};
