'use strict';

const paymentsService = require('./payments.service');

// POST /api/payments/create-session
async function handleCreateSession(req, res, next) {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'order_id is required' });
    }
    const result = await paymentsService.createPaymentSession(order_id);
    res.json({ payment: result });
  } catch (err) {
    console.error('Create payment session error:', err.response?.data || err.message);
    next(err);
  }
}

// POST /api/payments/verify
async function handleVerify(req, res, next) {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: 'order_id is required' });
    }
    const result = await paymentsService.verifyPayment(order_id);
    res.json({ payment: result });
  } catch (err) {
    console.error('Verify payment error:', err.response?.data || err.message);
    next(err);
  }
}

// GET /api/payments/:orderId
async function handleGetPayment(req, res, next) {
  try {
    const result = await paymentsService.getPaymentByOrderId(req.params.orderId);
    res.json({ payment: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleCreateSession, handleVerify, handleGetPayment };
