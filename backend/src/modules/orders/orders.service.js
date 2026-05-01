'use strict';

const { query }               = require('../../config/db');
const { generateOrderNumber } = require('../../utils/order-number');
const { calculatePrice }      = require('../../utils/price-calculator');

// ── Create order ──────────────────────────────────────────────────────────────

async function createOrder(userId, { vendor_id, file_id, copies, is_double_sided, pages }) {
  // 1. Validate vendor
  const vendorRes = await query(
    `SELECT v.id, v.is_active, vs.price_bw, vs.price_color, vs.price_double_sided
       FROM vendors v
       LEFT JOIN vendor_settings vs ON vs.vendor_id = v.id
      WHERE v.id = $1`,
    [vendor_id]
  );
  const vendor = vendorRes.rows[0];
  if (!vendor) {
    const err = new Error('Vendor not found');
    err.status = 404;
    throw err;
  }
  if (!vendor.is_active) {
    const err = new Error('Vendor is currently closed');
    err.status = 422;
    throw err;
  }

  // 2. Validate file belongs to user
  const fileRes = await query(
    `SELECT id, total_pages FROM files WHERE id = $1 AND user_id = $2`,
    [file_id, userId]
  );
  if (!fileRes.rows[0]) {
    const err = new Error('File not found');
    err.status = 404;
    throw err;
  }

  // 3. Calculate price
  const totalPrice = calculatePrice({
    pages,
    copies:       copies || 1,
    isDoubleSided: is_double_sided || false,
    settings: {
      price_bw:           vendor.price_bw,
      price_color:        vendor.price_color,
      price_double_sided: vendor.price_double_sided,
    },
  });

  // 4. Insert order
  const orderNumber = generateOrderNumber();
  const orderRes = await query(
    `INSERT INTO orders
       (order_number, user_id, vendor_id, file_id, status, copies, is_double_sided, total_price)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7)
       RETURNING *`,
    [orderNumber, userId, vendor_id, file_id, copies || 1, is_double_sided || false, totalPrice]
  );
  const order = orderRes.rows[0];

  // 5. Insert per-page specs
  if (pages && pages.length) {
    const pageValues = pages
      .map((p, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`)
      .join(', ');
    const pageParams = pages.flatMap((p) => [order.id, p.page_number, p.print_type || 'BW']);

    await query(
      `INSERT INTO order_pages (order_id, page_number, print_type) VALUES ${pageValues}`,
      pageParams
    );
  }

  return formatOrder(order, pages || []);
}

// ── Get all orders for user ───────────────────────────────────────────────────

async function getOrders(userId) {
  const result = await query(
    `SELECT o.*,
            COALESCE(json_agg(op ORDER BY op.page_number) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages
       FROM orders o
       LEFT JOIN order_pages op ON op.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows.map((r) => formatOrder(r, r.pages));
}

// ── Get single order ──────────────────────────────────────────────────────────

async function getOrderById(userId, orderId) {
  const result = await query(
    `SELECT o.*,
            COALESCE(json_agg(op ORDER BY op.page_number) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages
       FROM orders o
       LEFT JOIN order_pages op ON op.order_id = o.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id`,
    [orderId, userId]
  );
  if (!result.rows[0]) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  return formatOrder(result.rows[0], result.rows[0].pages);
}

// ── Cancel order (user can only cancel PENDING orders) ────────────────────────

async function cancelOrder(userId, orderId) {
  const result = await query(
    `UPDATE orders
        SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status = 'PENDING'
  RETURNING id`,
    [orderId, userId]
  );
  if (!result.rows[0]) {
    const err = new Error('Order cannot be cancelled (not found or already processed)');
    err.status = 422;
    throw err;
  }
}

// ── Format helper ─────────────────────────────────────────────────────────────

function formatOrder(row, pages) {
  return {
    id:             row.id,
    orderNumber:    row.order_number,
    status:         row.status,
    copies:         row.copies,
    isDoubleSided:  row.is_double_sided,
    totalPrice:     parseFloat(row.total_price),
    estimatedTime:  row.estimated_time ? String(row.estimated_time) : null,
    qrCodeUrl:      row.qr_code_url    || null,
    createdAt:      row.created_at,
    pages: (pages || []).map((p) => ({
      pageNumber: p.page_number,
      printType:  p.print_type,
      isColor:    p.print_type === 'COLOR',
    })),
  };
}

module.exports = { createOrder, getOrders, getOrderById, cancelOrder };
