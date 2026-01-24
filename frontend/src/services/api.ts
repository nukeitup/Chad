import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    api.post('/auth/register', data),

  getCurrentUser: () =>
    api.get('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  logout: () =>
    api.post('/auth/logout'),
};

// Applications API
export const applicationsApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get('/applications', { params }),

  getById: (id: string) =>
    api.get(`/applications/${id}`),

  create: (data: {
    entityId: string;
    applicationType: string;
    cddLevel: string;
    cddLevelJustification?: string;
  }) =>
    api.post('/applications', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/applications/${id}`, data),

  delete: (id: string) =>
    api.delete(`/applications/${id}`),

  submit: (id: string) =>
    api.post(`/applications/${id}/submit`),

  approve: (id: string) =>
    api.post(`/applications/${id}/approve`),

  return: (id: string, returnedReason: string) =>
    api.post(`/applications/${id}/return`, { returnedReason }),

  reject: (id: string, rejectedReason: string) =>
    api.post(`/applications/${id}/reject`, { rejectedReason }),

  getStats: () =>
    api.get('/applications/stats/summary'),
};

// Entities API
export const entitiesApi = {
  search: (query: string) =>
    api.get('/entities/search', { params: { q: query } }),

  getByNZBN: (nzbn: string) =>
    api.get(`/entities/nzbn/${nzbn}`),

  list: (params?: Record<string, string | number>) =>
    api.get('/entities', { params }),

  getById: (id: string) =>
    api.get(`/entities/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/entities', data),

  createOverseas: (data: Record<string, unknown>) =>
    api.post('/entities/overseas', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/entities/${id}`, data),
};

// Beneficial Owners API
export const beneficialOwnersApi = {
  add: (applicationId: string, data: Record<string, unknown>) =>
    api.post(`/applications/${applicationId}/beneficial-owners`, data),

  getById: (id: string) =>
    api.get(`/beneficial-owners/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/beneficial-owners/${id}`, data),

  verify: (id: string, verificationNotes?: string) =>
    api.post(`/beneficial-owners/${id}/verify`, { verificationNotes }),

  delete: (id: string) =>
    api.delete(`/beneficial-owners/${id}`),
};

// Persons Acting on Behalf API
export const personsActingApi = {
  add: (applicationId: string, data: Record<string, unknown>) =>
    api.post(`/applications/${applicationId}/persons-acting`, data),

  getById: (id: string) =>
    api.get(`/persons-acting/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/persons-acting/${id}`, data),

  verify: (id: string, verificationNotes?: string) =>
    api.post(`/persons-acting/${id}/verify`, { verificationNotes }),

  delete: (id: string) =>
    api.delete(`/persons-acting/${id}`),
};

// Documents API
export const documentsApi = {
  upload: (applicationId: string, formData: FormData) =>
    api.post(`/applications/${applicationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  listByApplication: (applicationId: string) =>
    api.get(`/applications/${applicationId}/documents`),

  getById: (id: string) =>
    api.get(`/documents/${id}`),

  download: (id: string) =>
    api.get(`/documents/${id}/download`, { responseType: 'blob' }),

  delete: (id: string) =>
    api.delete(`/documents/${id}`),
};

// Reference Data API
export const referenceApi = {
  getEntityTypes: () =>
    api.get('/reference/entity-types'),

  getDocumentTypes: () =>
    api.get('/reference/document-types'),

  getProducts: () =>
    api.get('/reference/products'),

  getCountries: () =>
    api.get('/reference/countries'),

  getFATFJurisdictions: () =>
    api.get('/reference/fatf-jurisdictions'),

  getCDDRequirements: () =>
    api.get('/reference/cdd-requirements'),

  getRiskFactors: () =>
    api.get('/reference/risk-factors'),

  getVerificationMethods: () =>
    api.get('/reference/verification-methods'),
};

// Users API
export const usersApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get('/users', { params }),

  getSpecialists: () =>
    api.get('/users/specialists'),

  getApprovers: () =>
    api.get('/users/approvers'),

  getById: (id: string) =>
    api.get(`/users/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/users', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),
};

export default api;
