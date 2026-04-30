// Order status constants
const ORDER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

// Print type constants
const PRINT_TYPE = {
  BW: 'BW',
  COLOR: 'COLOR',
};

// Service types
const SERVICES = {
  STANDARD: 'standard',
  SPIRAL_BINDING: 'spiral_binding',
  HARD_BINDING: 'hard_binding',
  LAMINATION: 'lamination',
  PHOTO_PRINT: 'photo_print',
  FRAMED_PHOTO: 'framed_photo',
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

// Payment methods
const PAYMENT_METHOD = {
  UPI: 'UPI',
  CASH: 'CASH',
  CARD: 'CARD',
};

// Orientation
const ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

// Pickup / Delivery
const FULFILLMENT = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
};

// Socket events
const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  NEW_ORDER: 'new_order',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_REJECTED: 'order_rejected',
  STATUS_UPDATE: 'status_update',
  ORDER_READY: 'order_ready',
};

module.exports = {
  ORDER_STATUS,
  PRINT_TYPE,
  SERVICES,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  ORIENTATION,
  FULFILLMENT,
  SOCKET_EVENTS,
};
