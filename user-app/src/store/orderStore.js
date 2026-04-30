import { create } from 'zustand';
import { ordersAPI } from '../services/api';
import { ORDER_STATUS } from '../utils/constants';

// ──────────────────────────────────────────────
// Order Store (Zustand)
// ──────────────────────────────────────────────
const useOrderStore = create((set, get) => ({
  orders: [],            // list of all user orders
  activeOrder: null,     // currently tracked order
  isLoading: false,
  error: null,

  // ── Fetch ──

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await ordersAPI.getAll();
      set({ orders: data.orders, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load orders', isLoading: false });
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await ordersAPI.getById(id);
      set({ activeOrder: data.order, isLoading: false });
      return data.order;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load order', isLoading: false });
    }
  },

  // ── Create ──

  createOrder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await ordersAPI.create(payload);
      set((state) => ({
        orders: [data.order, ...state.orders],
        activeOrder: data.order,
        isLoading: false,
      }));
      return data.order;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create order', isLoading: false });
      throw err;
    }
  },

  // ── Cancel ──

  cancelOrder: async (id) => {
    try {
      await ordersAPI.cancel(id);
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, status: ORDER_STATUS.CANCELLED } : o
        ),
        activeOrder:
          state.activeOrder?.id === id
            ? { ...state.activeOrder, status: ORDER_STATUS.CANCELLED }
            : state.activeOrder,
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to cancel order' });
      throw err;
    }
  },

  // ── Real-time updates from socket ──

  updateOrderStatus: (orderId, status, extra = {}) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status, ...extra } : o
      ),
      activeOrder:
        state.activeOrder?.id === orderId
          ? { ...state.activeOrder, status, ...extra }
          : state.activeOrder,
    }));
  },

  setActiveOrder: (order) => set({ activeOrder: order }),
  clearError: () => set({ error: null }),
}));

export default useOrderStore;
