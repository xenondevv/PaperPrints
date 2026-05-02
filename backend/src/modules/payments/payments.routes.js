'use strict';

const express = require('express');
const { requireAuth }  = require('../../middleware/auth.middleware');
const ctrl = require('./payments.controller');

const router = express.Router();

// All payment routes require authentication
router.use(requireAuth);

// Create a Cashfree payment session for an order
router.post('/create-session', ctrl.handleCreateSession);

// Verify payment status with Cashfree
router.post('/verify', ctrl.handleVerify);

// Get payment details for an order
router.get('/:orderId', ctrl.handleGetPayment);

module.exports = router;
