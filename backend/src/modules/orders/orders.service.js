'use strict';

const { query }               = require('../../config/db');
const { generateOrderNumber } = require('../../utils/order-number');
const { calculatePrice }      = require('../../utils/price-calculator');
const { emitNewOrderToVendor } = require('../../sockets/order.socket');

// ── Create order ──────────────────────────────────────────────────────────────

async function createOrder(userId, { vendor_id, file_id, file_ids, copies, is_double_sided, pages }) {
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

  // 2. Resolve the list of file IDs (prefer file_ids array, fall back to file_id)
  const allFileIds = (file_ids && file_ids.length > 0) ? file_ids : [file_id];
  const primaryFileId = allFileIds[0];

  // 3. Validate all files belong to user
  for (const fid of allFileIds) {
    const fileRes = await query(
      `SELECT id, total_pages FROM files WHERE id = $1 AND user_id = $2`,
      [fid, userId]
    );
    if (!fileRes.rows[0]) {
      const err = new Error(`File ${fid} not found`);
      err.status = 404;
      throw err;
    }
  }

  // 4. Calculate price
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

  // 5. Insert order (primary file_id kept for backward compat)
  const orderNumber = generateOrderNumber();
  const orderRes = await query(
    `INSERT INTO orders
       (order_number, user_id, vendor_id, file_id, status, copies, is_double_sided, total_price)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7)
       RETURNING *`,
    [orderNumber, userId, vendor_id, primaryFileId, copies || 1, is_double_sided || false, totalPrice]
  );
  const order = orderRes.rows[0];

  // 6. Insert into order_files junction table
  if (allFileIds.length > 0) {
    const ofVals = allFileIds.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ');
    const ofParams = allFileIds.flatMap((fid, i) => {
      // Derive a label from the file name (merged_bw_… → 'bw', merged_color_… → 'color')
      let label = null;
      if (allFileIds.length > 1) {
        label = i === 0 ? 'bw' : 'color';
      }
      return [order.id, fid, label, i];
    });
    await query(
      `INSERT INTO order_files (order_id, file_id, label, sort_order) VALUES ${ofVals}
       ON CONFLICT (order_id, file_id) DO NOTHING`,
      ofParams
    );
  }

  // 7. Insert per-page specs
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

  // Notify the vendor in real time
  try {
    const vendorUserRes = await query(
      `SELECT user_id FROM vendors WHERE id = $1`, [vendor_id]
    );
    if (vendorUserRes.rows[0]) {
      emitNewOrderToVendor(vendorUserRes.rows[0].user_id, formatOrder(order, pages || [], allFileIds));
    }
  } catch (e) {
    console.error('[socket] Failed to notify vendor:', e.message);
  }

  return formatOrder(order, pages || [], allFileIds);
}

// ── Get all orders for user ───────────────────────────────────────────────────

async function getOrders(userId) {
  const result = await query(
    `SELECT o.*,
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'id', op.id, 'page_number', op.page_number, 'print_type', op.print_type
            )) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages,
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'file_id', ofi.file_id, 'label', ofi.label, 'sort_order', ofi.sort_order,
              'file_url', fi.file_url, 'file_name', fi.file_name
            )) FILTER (WHERE ofi.id IS NOT NULL), '[]') AS order_files
       FROM orders o
       LEFT JOIN order_pages op ON op.order_id = o.id
       LEFT JOIN order_files ofi ON ofi.order_id = o.id
       LEFT JOIN files fi ON fi.id = ofi.file_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows.map((r) => formatOrder(r, r.pages, null, r.order_files));
}

// ── Get single order ──────────────────────────────────────────────────────────

async function getOrderById(userId, orderId) {
  const result = await query(
    `SELECT o.*,
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'id', op.id, 'page_number', op.page_number, 'print_type', op.print_type
            )) FILTER (WHERE op.id IS NOT NULL), '[]') AS pages,
            COALESCE(json_agg(DISTINCT jsonb_build_object(
              'file_id', ofi.file_id, 'label', ofi.label, 'sort_order', ofi.sort_order,
              'file_url', fi.file_url, 'file_name', fi.file_name
            )) FILTER (WHERE ofi.id IS NOT NULL), '[]') AS order_files
       FROM orders o
       LEFT JOIN order_pages op ON op.order_id = o.id
       LEFT JOIN order_files ofi ON ofi.order_id = o.id
       LEFT JOIN files fi ON fi.id = ofi.file_id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id`,
    [orderId, userId]
  );
  if (!result.rows[0]) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  return formatOrder(result.rows[0], result.rows[0].pages, null, result.rows[0].order_files);
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

function formatOrder(row, pages, fileIds, orderFiles) {
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
    // Multiple merged files (e.g. one color PDF + one B&W PDF)
    fileIds: fileIds || (orderFiles || []).map((of) => of.file_id).filter(Boolean),
    files: (orderFiles || []).map((of) => ({
      fileId:    of.file_id,
      label:     of.label || null,
      sortOrder: of.sort_order ?? 0,
      fileUrl:   of.file_url || null,
      fileName:  of.file_name || null,
    })),
  };
}

module.exports = { createOrder, getOrders, getOrderById, cancelOrder };
