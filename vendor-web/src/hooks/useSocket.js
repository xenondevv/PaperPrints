'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export default function useSocket({ onNewOrder, onOrderUpdate } = {}) {
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onNewOrder, onOrderUpdate });

  // Keep callbacks fresh without re-connecting
  useEffect(() => {
    callbacksRef.current = { onNewOrder, onOrderUpdate };
  }, [onNewOrder, onOrderUpdate]);

  useEffect(() => {
    const token = localStorage.getItem('pp_access_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      // Omit transports: ['websocket'] or place polling first so Jio CGNAT/firewalls fall back gracefully
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[socket] Connected:', socket.id);
      // Join vendor room
      const user = JSON.parse(localStorage.getItem('pp_user') || '{}');
      socket.emit('join_room', { role: 'vendor', userId: user.id });
    });

    socket.on('new_order', (data) => {
      console.log('[socket] New order:', data);
      callbacksRef.current.onNewOrder?.(data.order);
    });

    socket.on('order_accepted', (data) => {
      callbacksRef.current.onOrderUpdate?.(data.orderId, { status: 'ACCEPTED', estimatedTime: data.estimatedTime });
    });

    socket.on('order_rejected', (data) => {
      callbacksRef.current.onOrderUpdate?.(data.orderId, { status: 'REJECTED' });
    });

    socket.on('status_update', (data) => {
      callbacksRef.current.onOrderUpdate?.(data.orderId, { status: data.status });
    });

    socket.on('order_ready', (data) => {
      callbacksRef.current.onOrderUpdate?.(data.orderId, { status: 'READY', qrCodeUrl: data.qrCode });
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Connect once on mount

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit, socket: socketRef };
}
