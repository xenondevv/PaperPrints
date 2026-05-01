'use strict';

const { Router } = require('express');
const { requireAuth }  = require('../../middleware/auth.middleware');
const { requireRole }  = require('../../middleware/role.middleware');
const { handleCreate, handleGetAll, handleGetById, handleCancel } = require('./orders.controller');

const router = Router();
router.use(requireAuth);
router.use(requireRole('user'));

// POST   /api/orders
router.post('/', handleCreate);

// GET    /api/orders
router.get('/', handleGetAll);

// GET    /api/orders/:id
router.get('/:id', handleGetById);

// PATCH  /api/orders/:id/status  — user can only cancel
router.patch('/:id/status', handleCancel);

module.exports = router;
