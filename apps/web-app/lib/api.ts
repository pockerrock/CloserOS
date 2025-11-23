import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    workspaceName: string;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) => api.post('/auth/login', { email, password }),

  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),

  getMe: () => api.get('/auth/me'),

  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Leads API
export const leadsAPI = {
  getAll: () => api.get('/leads'),
  getById: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.patch(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
};

// Deals API
export const dealsAPI = {
  getAll: () => api.get('/deals'),
  getById: (id: string) => api.get(`/deals/${id}`),
  create: (data: any) => api.post('/deals', data),
  updateStage: (id: string, stage: string) => api.patch(`/deals/${id}/stage`, { stage }),
  createCheckout: (id: string) => api.post(`/deals/${id}/checkout`),
  markPaid: (id: string, stripePaymentId: string) => api.post(`/deals/${id}/mark-paid`, { stripePaymentId }),
};

// Calls API
export const callsAPI = {
  getAll: () => api.get('/calls'),
  getById: (id: string) => api.get(`/calls/${id}`),
  create: (data: any) => api.post('/calls', data),
  start: (id: string) => api.post(`/calls/${id}/start`),
  end: (id: string) => api.post(`/calls/${id}/end`),
};

// Bookings API
export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getByToken: (token: string) => api.get(`/bookings/token/${token}`),
  create: (data: any) => api.post('/bookings', data),
  confirm: (id: string) => api.post(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) => api.post(`/bookings/${id}/cancel`, { reason }),
};

// Documents API
export const documentsAPI = {
  getAll: () => api.get('/documents'),
  getById: (id: string) => api.get(`/documents/${id}`),
  upload: (file: File, metadata?: any) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.keys(metadata).forEach((key) => {
        formData.append(key, metadata[key]);
      });
    }
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/documents/${id}`),
  query: (query: string, topK?: number) => api.post('/documents/query', { query, topK }),
};

// Users API
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.patch('/users/me', data),
  updatePassword: (currentPassword: string, newPassword: string) =>
    api.post('/users/me/password', { currentPassword, newPassword }),
};

// Workspaces API
export const workspacesAPI = {
  getById: (id: string) => api.get(`/workspaces/${id}`),
  update: (id: string, data: any) => api.patch(`/workspaces/${id}`, data),
  updateSettings: (id: string, settings: any) => api.patch(`/workspaces/${id}/settings`, settings),
  inviteUser: (id: string, email: string, role: string) => api.post(`/workspaces/${id}/invite`, { email, role }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (period?: string) => api.get('/analytics/dashboard', { params: { period } }),
  getFunnel: () => api.get('/analytics/funnel'),
  getTeamPerformance: () => api.get('/analytics/team-performance'),
};

export default api;
