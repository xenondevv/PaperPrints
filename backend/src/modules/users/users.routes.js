'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { handleGetMe, handleUpdateMe, handleSaveFcmToken } = require('./users.controller');

const router = Router();

// All user routes require auth
router.use(requireAuth);

// GET  /api/users/me
router.get('/me', handleGetMe);

// PATCH /api/users/me
router.patch('/me', handleUpdateMe);

// POST /api/users/fcm-token
router.post('/fcm-token', handleSaveFcmToken);

module.exports = router;
