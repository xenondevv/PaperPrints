'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchVendorOrders } from '../lib/api';

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendorOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Add a new order to the front of the list (for real-time updates)
  const prependOrder = useCallback((newOrder) => {
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
  }, []);

  // Update an order in the list
  const updateOrder = useCallback((orderId, updates) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
    );
  }, []);

  // Remove an order from the list
  const removeOrder = useCallback((orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: loadOrders,
    prependOrder,
    updateOrder,
    removeOrder,
  };
}
