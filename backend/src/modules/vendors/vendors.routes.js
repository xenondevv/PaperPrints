'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { handleGetNearby, handleGetById, handleRegister } = require('./vendors.controller');

const router = Router();

// All vendor reads require auth
router.use(requireAuth);

// GET /api/vendors/nearby?lat=X&lng=Y&radius=10
router.get('/nearby', handleGetNearby);

// GET /api/vendors/:id
router.get('/:id', handleGetById);

// POST /api/vendors/register
router.post('/register', handleRegister);

module.exports = router;
