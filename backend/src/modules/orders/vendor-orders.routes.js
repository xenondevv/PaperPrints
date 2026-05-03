'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const {
  handleGetAll,
  handleGetById,
  handleAccept,
  handleReject,
  handleStatusUpdate,
  handleGetFileUrl,
} = require('./vendor-orders.controller');

const router = Router();
router.use(requireAuth);
router.use(requireRole('vendor'));

// GET    /api/vendor/orders          — list all orders for this vendor
router.get('/', handleGetAll);

// GET    /api/vendor/orders/:id      — single order detail
router.get('/:id', handleGetById);

// GET    /api/vendor/orders/:id/file — get a fresh pre-signed download URL for the PDF
router.get('/:id/file', handleGetFileUrl);

// PATCH  /api/vendor/orders/:id/accept  — accept with estimated time
router.patch('/:id/accept', handleAccept);

// PATCH  /api/vendor/orders/:id/reject  — reject
router.patch('/:id/reject', handleReject);

// PATCH  /api/vendor/orders/:id/status  — update status (PROCESSING→READY→COMPLETED)
router.patch('/:id/status', handleStatusUpdate);

module.exports = router;
