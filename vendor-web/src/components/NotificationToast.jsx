'use client';

import { useState, useEffect, useCallback } from 'react';

export default function NotificationToast({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) return null;
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
      {notifications.map((notif) => (
        <ToastItem key={notif.id} notification={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ notification, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB',
      padding: '14px 16px',
      transition: 'all 0.3s', opacity: exiting ? 0 : 1,
      transform: exiting ? 'translateX(40px)' : 'translateX(0)',
      animation: exiting ? 'none' : 'toastIn 0.25s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg style={{ width: 14, height: 14, color: '#0D9488' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#111111' }}>New Order</p>
          <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
            {notification.customerName && <span>{notification.customerName}</span>}
            {notification.orderNumber && <span style={{ color: '#9CA3AF', marginLeft: 4 }}>#{notification.orderNumber}</span>}
          </p>
          {notification.totalPrice && (
            <p style={{ fontSize: 12, color: '#0F766E', fontWeight: 500, marginTop: 4 }}>₹{parseFloat(notification.totalPrice).toFixed(2)}</p>
          )}
        </div>
        <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 2 }}>
          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <style jsx>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Request permission for system notifications on load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const addNotification = useCallback((data) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, {
      id, customerName: data.customerName, orderNumber: data.orderNumber, totalPrice: data.totalPrice,
    }]);

    // Show System Notification if backgrounded or minimized
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      // We only want to spam system notifications if the tab is hidden to avoid double notifying
      if (document.hidden) {
        new Notification('New Order Received!', {
          body: `${data.customerName || 'Customer'} placed an order (#${data.orderNumber}).`,
          icon: '/favicon.ico', // fallback icon
        });
      }
    }
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, addNotification, dismissNotification };
}
