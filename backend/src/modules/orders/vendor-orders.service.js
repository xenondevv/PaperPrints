'use strict';

const { query } = require('../../config/db');
const { generatePresignedUrl } = require('../../services/s3.service');
const { emitOrderAccepted, emitOrderRejected, emitStatusUpdate, emitOrderReady } = require('../../sockets/order.socket');
const { notifyOrderAccepted, notifyOrderReady, notifyOrderRejected } = require('../../services/fcm.service');

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
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'id', op.id, 'page_number', op.page_number, 'print_type', op.print_type
            )) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages,
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'file_id', ofi.file_id, 'label', ofi.label, 'sort_order', ofi.sort_order,
              'file_url', fi2.file_url, 'file_name', fi2.file_name
            )) FILTER (WHERE ofi.id IS NOT NULL), '[]') AS order_files
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN files f ON f.id = o.file_id
       LEFT JOIN order_pages op ON op.order_id = o.id
       LEFT JOIN order_files ofi ON ofi.order_id = o.id
       LEFT JOIN files fi2 ON fi2.id = ofi.file_id
      WHERE o.vendor_id = $1
      GROUP BY o.id, u.name, u.email, u.photo_url, f.file_name, f.file_url, f.total_pages, f.s3_key
      ORDER BY o.created_at DESC`,
    [vendorId]
  );

  return Promise.all(result.rows.map(formatVendorOrder));
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
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'id', op.id, 'page_number', op.page_number, 'print_type', op.print_type
            )) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages,
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'file_id', ofi.file_id, 'label', ofi.label, 'sort_order', ofi.sort_order,
              'file_url', fi2.file_url, 'file_name', fi2.file_name
            )) FILTER (WHERE ofi.id IS NOT NULL), '[]') AS order_files
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN files f ON f.id = o.file_id
       LEFT JOIN order_pages op ON op.order_id = o.id
       LEFT JOIN order_files ofi ON ofi.order_id = o.id
       LEFT JOIN files fi2 ON fi2.id = ofi.file_id
      WHERE o.id = $1 AND o.vendor_id = $2
      GROUP BY o.id, u.name, u.email, u.photo_url, f.file_name, f.file_url, f.total_pages, f.s3_key`,
    [orderId, vendorId]
  );

  if (!result.rows[0]) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  return await formatVendorOrder(result.rows[0]);
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

  const pickupCode = String(Math.floor(1000 + Math.random() * 9000)); // 1000–9999

  const result = await query(
    `UPDATE orders
        SET status = 'ACCEPTED',
            estimated_time = $3,
            qr_code_url = $4,
            updated_at = NOW()
      WHERE id = $1
        AND vendor_id = $2
        AND status = 'PENDING'
    RETURNING *, user_id`,
    [orderId, vendorId, estimatedTime || null, pickupCode]
  );

  if (!result.rows[0]) {
    const err = new Error('Order not found or cannot be accepted (not PENDING)');
    err.status = 422;
    throw err;
  }

  // Emit socket event to notify the customer
  emitOrderAccepted(result.rows[0].user_id, orderId, estimatedTime, pickupCode);

  // Send push notification
  notifyOrderAccepted(result.rows[0].user_id, orderId, estimatedTime);

  return { message: 'Order accepted', orderId, status: 'ACCEPTED', pickupCode };
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

  // Send push notification
  notifyOrderRejected(result.rows[0].user_id, orderId);

  return { message: 'Order rejected', orderId, status: 'REJECTED' };
}

// ── Update order status ────────────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  ACCEPTED: ['READY'],
  READY: ['COMPLETED'],
};

async function updateOrderStatus(userId, orderId, newStatus) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const current = await query(
    `SELECT status, user_id, qr_code_url FROM orders WHERE id = $1 AND vendor_id = $2`,
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

  // If marking as READY, ensure pickup code exists (it should from ACCEPTED)
  // or regenerate if needed. We'll leave it as is or generate if missing.
  let pickupCode = null;
  if (newStatus === 'READY') {
    pickupCode = current.rows[0].qr_code_url;
    if (!pickupCode) {
      pickupCode = String(Math.floor(1000 + Math.random() * 9000)); // 1000–9999
      updateFields.push(`qr_code_url = $4`);
      params.push(pickupCode);
    }
  }

  const queryStr = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $1 AND vendor_id = $2 RETURNING *`;
  const result = await query(queryStr, params);

  if (newStatus === 'READY') {
    emitOrderReady(current.rows[0].user_id, orderId, result.rows[0].qr_code_url);
    // Send push notification for pickup ready
    notifyOrderReady(current.rows[0].user_id, orderId);
  } else {
    emitStatusUpdate(current.rows[0].user_id, orderId, newStatus);
  }

  return { message: `Order status updated to ${newStatus}`, orderId, status: newStatus, pickupCode };
}

// ── Verify pickup code and mark COMPLETED ─────────────────────────────────────

async function verifyPickup(userId, orderId, code) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const current = await query(
    `SELECT status, user_id, qr_code_url FROM orders WHERE id = $1 AND vendor_id = $2`,
    [orderId, vendorId]
  );

  if (!current.rows[0]) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const { status, user_id, qr_code_url } = current.rows[0];

  if (status !== 'READY') {
    const err = new Error('Order is not in READY state');
    err.status = 422;
    throw err;
  }

  // Validate the 4-digit code
  if (!code || String(code).trim() !== String(qr_code_url).trim()) {
    const err = new Error('Invalid pickup code');
    err.status = 400;
    throw err;
  }

  await query(
    `UPDATE orders SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1 AND vendor_id = $2`,
    [orderId, vendorId]
  );

  emitStatusUpdate(user_id, orderId, 'COMPLETED');

  return { message: 'Order completed successfully', orderId, status: 'COMPLETED' };
}

// ── Format helper ──────────────────────────────────────────────────────────────

async function formatVendorOrder(row) {
  // Generate a pre-signed S3 URL so the vendor can view/print the PDF
  let signedFileUrl = null;
  if (row.s3_key) {
    try {
      signedFileUrl = await generatePresignedUrl(row.s3_key, 3600); // 1 hour
    } catch (err) {
      console.warn('[vendor-orders] Failed to generate signed URL:', err.message);
    }
  }

  const orderFiles = row.order_files || [];

  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    copies: row.copies,
    isDoubleSided: row.is_double_sided,
    totalPrice: parseFloat(row.total_price),
    estimatedTime: row.estimated_time ? String(row.estimated_time) : null,
    qrCodeUrl: row.qr_code_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Customer info
    customerName: row.customer_name || null,
    customerEmail: row.customer_email || null,
    customerPhoto: row.customer_photo || null,
    userId: row.user_id,
    // Primary file info (backward compat)
    fileId: row.file_id || null,
    fileName: row.file_name || null,
    fileUrl: signedFileUrl || row.file_url || null,
    signedFileUrl: signedFileUrl,
    totalPages: row.file_total_pages || 0,
    // Per-page specs
    pages: (row.pages || []).map((p) => ({
      pageNumber: p.page_number,
      printType: p.print_type,
      isColor: p.print_type === 'COLOR',
    })),
    // All merged files attached to this order
    fileIds: orderFiles.map((of) => of.file_id).filter(Boolean),
    bwFileId: orderFiles.find((of) => of.label === 'bw')?.file_id || null,
    colorFileId: orderFiles.find((of) => of.label === 'color')?.file_id || null,
    bwFile: orderFiles.find((of) => of.label === 'bw')?.file_url || null, // Note: vendor dashboard resolves presigned URLs dynamically using fileId
    colorFile: orderFiles.find((of) => of.label === 'color')?.file_url || null,
    originalFileId: row.file_id || null,
    originalFileUrl: signedFileUrl || row.file_url || null,
    // Original merged file (all selected pages combined - mix of B&W + Color)
    originalMergedFileId: orderFiles.find((of) => of.label === 'original')?.file_id || null,
    originalMergedFileUrl: orderFiles.find((of) => of.label === 'original')?.file_url || null,
    files: orderFiles.map((of) => ({
      fileId: of.file_id,
      label: of.label || null,
      sortOrder: of.sort_order ?? 0,
      fileUrl: of.file_url || null,
      fileName: of.file_name || null,
    })),
  };
}

// ── Get a fresh signed URL for an order's file ────────────────────────────────

async function getOrderFileUrl(userId, orderId) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const result = await query(
    `SELECT o.id, f.s3_key, f.file_name
       FROM orders o
       LEFT JOIN files f ON f.id = o.file_id
      WHERE o.id = $1 AND o.vendor_id = $2`,
    [orderId, vendorId]
  );

  if (!result.rows[0]) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  const { s3_key, file_name } = result.rows[0];
  if (!s3_key) {
    const err = new Error('No file attached to this order');
    err.status = 404;
    throw err;
  }

  const signed_url = await generatePresignedUrl(s3_key, 3600); // 1 hour

  return { signed_url, file_name };
}

module.exports = {
  getVendorOrders,
  getVendorOrderById,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  verifyPickup,
  getOrderFileUrl,
};
