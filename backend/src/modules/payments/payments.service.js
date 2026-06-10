'use strict';

const axios = require('axios');
const { query } = require('../../config/db');

// ── Cashfree Configuration ───────────────────────────────────────────────────

const CF_APP_ID     = process.env.CASHFREE_APP_ID;
const CF_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CF_ENV        = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();

const CF_BASE_URL = CF_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const CF_API_VERSION = '2023-08-01';

function cfHeaders() {
  return {
    'x-client-id':     CF_APP_ID,
    'x-client-secret': CF_SECRET_KEY,
    'x-api-version':   CF_API_VERSION,
    'Content-Type':    'application/json',
  };
}

// ── Create Cashfree Order & Payment Session ──────────────────────────────────

async function createPaymentSession(orderId) {
  // 1. Fetch order + user details
  const orderRes = await query(
    `SELECT o.id, o.order_number, o.total_price, o.user_id,
            u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.id = $1`,
    [orderId]
  );
  const order = orderRes.rows[0];
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  // 2. Check if a payment session already exists for this order
  const existingPayment = await query(
    `SELECT id, cf_order_id, payment_session_id, status FROM payments WHERE order_id = $1`,
    [orderId]
  );
  if (existingPayment.rows[0] && existingPayment.rows[0].payment_session_id) {
    const p = existingPayment.rows[0];
    // If there's already a PENDING payment, return the existing session
    if (p.status === 'PENDING') {
      return {
        cf_order_id:        p.cf_order_id,
        payment_session_id: p.payment_session_id,
        order_id:           orderId,
      };
    }
  }

  // 3. Create order on Cashfree
  const cfOrderId = `PP_${order.order_number}_${Date.now()}`;
  const amount = parseFloat(order.total_price);

  const cfPayload = {
    order_id:       cfOrderId,
    order_amount:   amount,
    order_currency: 'INR',
    customer_details: {
      customer_id:    order.user_id,
      customer_name:  order.customer_name || 'Customer',
      customer_email: order.customer_email || 'customer@paperprints.in',
      customer_phone: order.customer_phone || '9999999999',
    },
    order_meta: {
      return_url: `https://paperprints.in/payment/return?order_id=${cfOrderId}`,
    },
  };

  const cfResponse = await axios.post(`${CF_BASE_URL}/orders`, cfPayload, {
    headers: cfHeaders(),
  });

  const cfData = cfResponse.data;

  // 4. Upsert payment record in our DB
  if (existingPayment.rows[0]) {
    await query(
      `UPDATE payments
          SET cf_order_id = $1, payment_session_id = $2, status = 'PENDING', payment_gateway = 'CASHFREE'
        WHERE order_id = $3`,
      [cfOrderId, cfData.payment_session_id, orderId]
    );
  } else {
    await query(
      `INSERT INTO payments (order_id, amount, status, payment_method, cf_order_id, payment_session_id, payment_gateway)
       VALUES ($1, $2, 'PENDING', 'CASHFREE', $3, $4, 'CASHFREE')`,
      [orderId, amount, cfOrderId, cfData.payment_session_id]
    );
  }

  return {
    cf_order_id:        cfOrderId,
    payment_session_id: cfData.payment_session_id,
    order_id:           orderId,
    order_amount:       amount,
  };
}

// ── Verify Payment ───────────────────────────────────────────────────────────

async function verifyPayment(orderId) {
  // 1. Fetch our payment record
  const paymentRes = await query(
    `SELECT id, cf_order_id, status FROM payments WHERE order_id = $1`,
    [orderId]
  );
  const payment = paymentRes.rows[0];
  if (!payment) {
    const err = new Error('Payment record not found');
    err.status = 404;
    throw err;
  }

  // If already completed/failed, just return current status
  if (payment.status === 'COMPLETED') {
    return { status: 'COMPLETED', order_id: orderId };
  }

  // 2. Verify with Cashfree
  const cfResponse = await axios.get(
    `${CF_BASE_URL}/orders/${payment.cf_order_id}`,
    { headers: cfHeaders() }
  );

  const cfData = cfResponse.data;
  let newStatus = 'PENDING';

  if (cfData.order_status === 'PAID') {
    newStatus = 'COMPLETED';
  } else if (cfData.order_status === 'EXPIRED' || cfData.order_status === 'TERMINATED') {
    newStatus = 'FAILED';
  }

  // 3. Fetch payment details for cf_payment_id
  let cfPaymentId = null;
  if (newStatus === 'COMPLETED') {
    try {
      const paymentsListRes = await axios.get(
        `${CF_BASE_URL}/orders/${payment.cf_order_id}/payments`,
        { headers: cfHeaders() }
      );
      if (paymentsListRes.data && paymentsListRes.data.length > 0) {
        cfPaymentId = paymentsListRes.data[0].cf_payment_id;
      }
    } catch (_) {
      // Non-critical — we still have the order status
    }
  }

  // 4. Update our DB
  await query(
    `UPDATE payments
        SET status = $1::payment_status, cf_payment_id = $2
      WHERE order_id = $3`,
    [newStatus, cfPaymentId, orderId]
  );

  // If payment succeeded, transition the order from PAYMENT_PENDING to PENDING
  // and emit the socket event to the vendor.
  if (newStatus === 'COMPLETED') {
    const orderUpdateRes = await query(
      `UPDATE orders SET status = 'PENDING' WHERE id = $1 AND status = 'PAYMENT_PENDING' RETURNING *`,
      [orderId]
    );

    if (orderUpdateRes.rows[0]) {
      try {
        const order = orderUpdateRes.rows[0];
        const { emitNewOrderToVendor } = require('../../sockets/order.socket');
        const { getOrderById } = require('../orders/orders.service');
        
        const { acceptOrder } = require('../orders/vendor-orders.service');
        const vendorUserRes = await query(
          `SELECT user_id, is_demo FROM vendors WHERE id = $1`, [order.vendor_id]
        );
        if (vendorUserRes.rows[0]) {
          const vendorData = vendorUserRes.rows[0];
          // We need the fully formatted order, getOrderById already formats it
          const fullOrder = await getOrderById(order.user_id, order.id);
          emitNewOrderToVendor(vendorData.user_id, fullOrder);

          // --- AUTO ACCEPT LOGIC FOR DEMO SHOPS ---
          if (vendorData.is_demo) {
            console.log(`[DEMO SHOP] Auto-accepting order ${orderId} in 15 seconds...`);
            setTimeout(async () => {
              try {
                await acceptOrder(vendorData.user_id, orderId, 15);
                console.log(`[DEMO SHOP] Order ${orderId} auto-accepted.`);
              } catch (err) {
                console.error(`[DEMO SHOP] Failed to auto-accept order ${orderId}:`, err.message);
              }
            }, 15000);
          }
          // --- END AUTO ACCEPT LOGIC ---
        }
      } catch (e) {
        console.error('[socket] Failed to notify vendor after payment:', e.message);
      }
    }
  }

  return {
    status:        newStatus,
    order_id:      orderId,
    cf_payment_id: cfPaymentId,
  };
}

// ── Get Payment by Order ID ──────────────────────────────────────────────────

async function getPaymentByOrderId(orderId) {
  const result = await query(
    `SELECT id, order_id, amount, status, payment_method, cf_order_id, cf_payment_id, payment_gateway, created_at
       FROM payments WHERE order_id = $1`,
    [orderId]
  );
  if (!result.rows[0]) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

module.exports = { createPaymentSession, verifyPayment, getPaymentByOrderId };
