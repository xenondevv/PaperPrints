'use strict';

/**
 * Order Socket helpers.
 * The vendor-app / backend services call these functions to push
 * real-time status updates to the customer's device.
 *
 * Room naming convention:
 *   user:<userId>   — customer personal room
 *   vendor:<vendorId> — vendor personal room
 */

let _io;

function setupOrderSockets(io) {
  _io = io;
  // No additional server-side listeners needed here;
  // emitters are called from the orders service when status changes.
}

// ── Emit helpers (called by orders service / vendor routes) ───────────────────

/**
 * Notify the user that their order was accepted.
 * @param {string} userId
 * @param {string} orderId
 * @param {string|number} estimatedTime  minutes until ready
 */
function emitOrderAccepted(userId, orderId, estimatedTime, qrCode) {
  _io?.to(`user:${userId}`).emit('order_accepted', { orderId, estimatedTime, qrCode });
}

/**
 * Notify the user that their order was rejected.
 */
function emitOrderRejected(userId, orderId) {
  _io?.to(`user:${userId}`).emit('order_rejected', { orderId });
}

/**
 * Generic status update (PROCESSING, COMPLETED, …).
 */
function emitStatusUpdate(userId, orderId, status) {
  _io?.to(`user:${userId}`).emit('status_update', { orderId, status });
}

/**
 * Notify the user that the order is ready for pickup and send the QR code URL.
 */
function emitOrderReady(userId, orderId, qrCode) {
  _io?.to(`user:${userId}`).emit('order_ready', { orderId, qrCode });
}

/**
 * Notify a vendor that a new order has been placed at their shop.
 * @param {string} vendorUserId  The vendor's user_id (NOT vendor.id)
 * @param {object} order         The formatted order object
 */
function emitNewOrderToVendor(vendorUserId, order) {
  _io?.to(`vendor:${vendorUserId}`).emit('new_order', { order });
}

module.exports = {
  setupOrderSockets,
  emitOrderAccepted,
  emitOrderRejected,
  emitStatusUpdate,
  emitOrderReady,
  emitNewOrderToVendor,
};
