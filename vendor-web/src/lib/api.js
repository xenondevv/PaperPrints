import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('pp_access_token')
    : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('pp_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const newToken = res.data.accessToken;
          localStorage.setItem('pp_access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear auth
          localStorage.removeItem('pp_access_token');
          localStorage.removeItem('pp_refresh_token');
          localStorage.removeItem('pp_user');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// ── Vendor Orders API ──────────────────────────────────────────────────────────

export async function fetchVendorOrders() {
  const res = await api.get('/vendor/orders');
  return res.data.orders;
}

export async function fetchVendorOrderById(orderId) {
  const res = await api.get(`/vendor/orders/${orderId}`);
  return res.data.order;
}

export async function acceptOrder(orderId, estimatedTime) {
  const res = await api.patch(`/vendor/orders/${orderId}/accept`, {
    estimated_time: estimatedTime,
  });
  return res.data;
}

export async function rejectOrder(orderId) {
  const res = await api.patch(`/vendor/orders/${orderId}/reject`);
  return res.data;
}

export async function updateOrderStatus(orderId, status) {
  const res = await api.patch(`/vendor/orders/${orderId}/status`, { status });
  return res.data;
}

// ── Auth API ───────────────────────────────────────────────────────────────────

export async function loginWithFirebaseToken(idToken) {
  const res = await api.post('/auth/firebase', { idToken });
  return res.data;
}

export async function refreshTokens(refreshToken) {
  const res = await api.post('/auth/refresh', { refreshToken });
  return res.data;
}

// ── User API ───────────────────────────────────────────────────────────────────

export async function fetchCurrentUser() {
  const res = await api.get('/users/me');
  return res.data.user;
}

export default api;
