import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL, STORAGE_KEYS } from '../utils/constants';

// ──────────────────────────────────────────────
// Socket.IO client singleton
// ──────────────────────────────────────────────
let socket = null;

export const connectSocket = async (userId) => {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    // Join the user's personal room for order updates
    socket.emit('join_room', { role: 'user', userId });
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// ──────────────────────────────────────────────
// Event listeners (call from store or components)
// ──────────────────────────────────────────────

/** Called when vendor accepts order */
export const onOrderAccepted = (callback) => {
  socket?.on('order_accepted', callback);
};

/** Called when vendor rejects order */
export const onOrderRejected = (callback) => {
  socket?.on('order_rejected', callback);
};

/** Called on any status change (PROCESSING, READY, etc.) */
export const onStatusUpdate = (callback) => {
  socket?.on('status_update', callback);
};

/** Called when order is ready for pickup */
export const onOrderReady = (callback) => {
  socket?.on('order_ready', callback);
};

export const offOrderEvents = () => {
  socket?.off('order_accepted');
  socket?.off('order_rejected');
  socket?.off('status_update');
  socket?.off('order_ready');
};
