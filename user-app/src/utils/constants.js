// ============================================================
// Paper Prints — User App Constants
// ============================================================

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

// Order statuses (mirrors backend enum)
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_LABELS = {
  PENDING: 'Waiting for vendor',
  ACCEPTED: 'Order accepted',
  PROCESSING: 'Printing in progress',
  READY: 'Ready for pickup',
  COMPLETED: 'Picked up',
  REJECTED: 'Order rejected',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  PENDING: '#f59e0b',
  ACCEPTED: '#3b82f6',
  PROCESSING: '#8b5cf6',
  READY: '#10b981',
  COMPLETED: '#6b7280',
  REJECTED: '#ef4444',
  CANCELLED: '#9ca3af',
};

// Print types
export const PRINT_TYPE = {
  BW: 'BW',
  COLOR: 'COLOR',
};

// Nearby shop search defaults
export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// AsyncStorage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@paper_prints_access_token',
  REFRESH_TOKEN: '@paper_prints_refresh_token',
  USER: '@paper_prints_user',
};

// Navigation screen names
export const SCREENS = {
  // Auth stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  // Main tab
  HOME: 'Home',
  SHOP_LIST: 'ShopList',
  UPLOAD: 'Upload',
  ORDER_HISTORY: 'OrderHistory',
  PROFILE: 'Profile',
  // Stack screens
  ORDER_DETAIL: 'OrderDetail',
  SHOP_DETAIL: 'ShopDetail',
};
