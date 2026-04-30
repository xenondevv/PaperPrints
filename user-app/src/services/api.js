import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

// ──────────────────────────────────────────────
// Axios instance
// ──────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 / token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (_err) {
        // Refresh failed — clear tokens and let auth store handle redirect
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);
      }
    }

    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Auth endpoints
// ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', { ...data, role: 'user' }),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// ──────────────────────────────────────────────
// Vendor endpoints
// ──────────────────────────────────────────────
export const vendorsAPI = {
  getNearby: (lat, lng, radius = 5) =>
    api.get('/vendors/nearby', { params: { lat, lng, radius } }),
  getById: (id) => api.get(`/vendors/${id}`),
};

// ──────────────────────────────────────────────
// Files endpoints
// ──────────────────────────────────────────────
export const filesAPI = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),
  getById: (id) => api.get(`/files/${id}`),
  getDownloadUrl: (id) => api.get(`/files/${id}/download`),
};

// ──────────────────────────────────────────────
// Orders endpoints
// ──────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.patch(`/orders/${id}/status`, { status: 'CANCELLED' }),
  getQR: (id) => api.get(`/orders/${id}/qr`),
};

// ──────────────────────────────────────────────
// Users endpoints
// ──────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  updateLocation: (lat, lng) => api.patch('/users/me/location', { lat, lng }),
};

export default api;
