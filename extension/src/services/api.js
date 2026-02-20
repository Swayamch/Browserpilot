import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  try {
    const data = await chrome.storage.local.get('token');
    if (data.token) {
      config.headers.Authorization = `Bearer ${data.token}`;
    }
  } catch {
    // Not in extension context
    const token = localStorage.getItem('bp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      chrome.storage.local.remove(['token', 'user']).catch(() => {});
    }
    return Promise.reject(err);
  }
);

// ----- Auth -----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateSettings: (data) => api.put('/auth/settings', data),
};

// ----- Rules -----
export const rulesAPI = {
  list: (params) => api.get('/rules', { params }),
  get: (id) => api.get(`/rules/${id}`),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  toggle: (id) => api.patch(`/rules/${id}/toggle`),
  delete: (id) => api.delete(`/rules/${id}`),
  execute: (id, data) => api.post(`/rules/${id}/execute`, data),
};

// ----- Templates -----
export const templatesAPI = {
  list: (params) => api.get('/templates', { params }),
  get: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  use: (id) => api.post(`/templates/${id}/use`),
  delete: (id) => api.delete(`/templates/${id}`),
};

// ----- Analytics -----
export const analyticsAPI = {
  dashboard: (params) => api.get('/analytics', { params }),
  recent: (params) => api.get('/analytics/recent', { params }),
};

// ----- AI -----
export const aiAPI = {
  generate: (prompt) => api.post('/ai/generate', { prompt }),
};

export default api;
