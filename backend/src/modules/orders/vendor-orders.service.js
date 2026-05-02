'use strict';

const { query } = require('../../config/db');
const { emitOrderAccepted, emitOrderRejected, emitStatusUpdate, emitOrderReady } = require('../../sockets/order.socket');

// ── Get all orders for a vendor ────────────────────────────────────────────────

async function getVendorOrders(userId) {
  // First find the vendor record linked to this user
  const vendorRes = await query(
    `SELECT id FROM vendors WHERE user_id = $1`,
    [userId]
  );
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const result = await query(
    `SELECT o.*,
            u.name AS customer_name,
            u.email AS customer_email,
            u.photo_url AS customer_photo,
            f.file_name,
            f.file_url,
            f.total_pages AS file_total_pages,
            f.s3_key,
            COALESCE(json_agg(op ORDER BY op.page_number) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN files f ON f.id = o.file_id
       LEFT JOIN order_pages op ON op.order_id = o.id
      WHERE o.vendor_id = $1
      GROUP BY o.id, u.name, u.email, u.photo_url, f.file_name, f.file_url, f.total_pages, f.s3_key
      ORDER BY o.created_at DESC`,
    [vendorId]
  );

  return result.rows.map(formatVendorOrder);
}

// ── Get single order for vendor ────────────────────────────────────────────────

async function getVendorOrderById(userId, orderId) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const result = await query(
    `SELECT o.*,
            u.name AS customer_name,
            u.email AS customer_email,
            u.photo_url AS customer_photo,
            f.file_name,
            f.file_url,
            f.total_pages AS file_total_pages,
            f.s3_key,
            COALESCE(json_agg(op ORDER BY op.page_number) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN files f ON f.id = o.file_id
       LEFT JOIN order_pages op ON op.order_id = o.id
      WHERE o.id = $1 AND o.vendor_id = $2
      GROUP BY o.id, u.name, u.email, u.photo_url, f.file_name, f.file_url, f.total_pages, f.s3_key`,
    [orderId, vendorId]
  );

  if (!result.rows[0]) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  return formatVendorOrder(result.rows[0]);
}

// ── Accept an order ────────────────────────────────────────────────────────────

async function acceptOrder(userId, orderId, estimatedTime) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const result = await query(
    `UPDATE orders
        SET status = 'ACCEPTED',
            estimated_time = $3,
            updated_at = NOW()
      WHERE id = $1
        AND vendor_id = $2
        AND status = 'PENDING'
    RETURNING *, user_id`,
    [orderId, vendorId, estimatedTime || null]
  );

  if (!result.rows[0]) {
    const err = new Error('Order not found or cannot be accepted (not PENDING)');
    err.status = 422;
    throw err;
  }

  // Emit socket event to notify the customer
  emitOrderAccepted(result.rows[0].user_id, orderId, estimatedTime);

  return { message: 'Order accepted', orderId, status: 'ACCEPTED' };
}

// ── Reject an order ────────────────────────────────────────────────────────────

async function rejectOrder(userId, orderId) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const result = await query(
    `UPDATE orders
        SET status = 'REJECTED',
            updated_at = NOW()
      WHERE id = $1
        AND vendor_id = $2
        AND status = 'PENDING'
    RETURNING *, user_id`,
    [orderId, vendorId]
  );

  if (!result.rows[0]) {
    const err = new Error('Order not found or cannot be rejected (not PENDING)');
    err.status = 422;
    throw err;
  }

  emitOrderRejected(result.rows[0].user_id, orderId);

  return { message: 'Order rejected', orderId, status: 'REJECTED' };
}

// ── Update order status ────────────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  ACCEPTED:   ['READY'],
  READY:      ['COMPLETED'],
};

async function updateOrderStatus(userId, orderId, newStatus) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  // Get current order
  const current = await query(
    `SELECT status, user_id FROM orders WHERE id = $1 AND vendor_id = $2`,
    [orderId, vendorId]
  );

  if (!current.rows[0]) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const currentStatus = current.rows[0].status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    const err = new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    err.status = 422;
    throw err;
  }

  const updateFields = [`status = $3`, `updated_at = NOW()`];
  const params = [orderId, vendorId, newStatus];

  // If marking as READY, generate a QR code URL (placeholder)
  if (newStatus === 'READY') {
    updateFields.push(`qr_code_url = $4`);
    params.push(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=order:${orderId}`);
  }

  const result = await query(
    `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $1 AND vendor_id = $2 RETURNING *`,
    params
  );

  if (newStatus === 'READY') {
    emitOrderReady(current.rows[0].user_id, orderId, result.rows[0].qr_code_url);
  } else {
    emitStatusUpdate(current.rows[0].user_id, orderId, newStatus);
  }

  return { message: `Order status updated to ${newStatus}`, orderId, status: newStatus };
}

// ── Format helper ──────────────────────────────────────────────────────────────

function formatVendorOrder(row) {
  return {
    id:             row.id,
    orderNumber:    row.order_number,
    status:         row.status,
    copies:         row.copies,
    isDoubleSided:  row.is_double_sided,
    totalPrice:     parseFloat(row.total_price),
    estimatedTime:  row.estimated_time ? String(row.estimated_time) : null,
    qrCodeUrl:      row.qr_code_url || null,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
    // Customer info
    customerName:   row.customer_name || null,
    customerEmail:  row.customer_email || null,
    customerPhoto:  row.customer_photo || null,
    userId:         row.user_id,
    // File info
    fileName:       row.file_name || null,
    fileUrl:        row.file_url || null,
    totalPages:     row.file_total_pages || 0,
    // Per-page specs
    pages: (row.pages || []).map((p) => ({
      pageNumber: p.page_number,
      printType:  p.print_type,
      isColor:    p.print_type === 'COLOR',
    })),
  };
}

module.exports = {
  getVendorOrders,
  getVendorOrderById,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
};
