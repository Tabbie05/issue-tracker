import axios from 'axios';

const API_BASE = '/api/issues';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const getIssues = (params = {}) => api.get('/', { params });
export const getIssue = (id) => api.get(`/${id}`);
export const createIssue = (data) => api.post('/', data);
export const updateIssue = (id, data) => api.put(`/${id}`, data);
export const updateIssueStatus = (id, status) => api.patch(`/${id}/status`, { status });
export const addComment = (id, text, author) => api.post(`/${id}/comments`, { text, author });
export const deleteIssue = (id) => api.delete(`/${id}`);
export const getStats = () => api.get('/stats');
export const getMeta = () => api.get('/meta');
export const exportCSV = () => {
  window.open(`${API_BASE}/export/csv`, '_blank');
};
