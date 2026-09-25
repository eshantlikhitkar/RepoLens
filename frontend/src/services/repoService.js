import api from './api';

export const repoService = {
  async getRepositories(params = {}) {
    const { data } = await api.get('/api/repositories', { params });
    return data.repositories;
  },

  async selectRepository(owner, name) {
    const { data } = await api.post('/api/repositories/select', { owner, name });
    return data.repository;
  },

  async getRepository(id) {
    const { data } = await api.get(`/api/repositories/${id}`);
    return data.repository;
  },

  async startIndexing(id) {
    const { data } = await api.post(`/api/repositories/${id}/index`);
    return data;
  },

  async getIndexingStatus(id) {
    const { data } = await api.get(`/api/repositories/${id}/status`);
    return data;
  },

  async getFileTree(id) {
    const { data } = await api.get(`/api/repositories/${id}/tree`);
    return data.tree;
  },

  async getFileContent(id, path) {
    const { data } = await api.get(`/api/repositories/${id}/file`, {
      params: { path },
    });
    return data.file;
  },

  async getOverview(id) {
    const { data } = await api.get(`/api/repositories/${id}/overview`);
    return data;
  },
};
