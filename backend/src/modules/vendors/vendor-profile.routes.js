'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const {
  handleGetProfile,
  handleToggleStatus,
  handleUpdateHours,
  handleUpdateLocation,
  handleUpdateEmail,
  handleUpdateBankDetails,
  handleUpdatePricing,
} = require('./vendor-profile.controller');

const router = Router();
router.use(requireAuth);
router.use(requireRole('vendor'));

// GET    /api/vendor/profile           — get full vendor profile
router.get('/', handleGetProfile);

// PATCH  /api/vendor/profile/status    — toggle open/closed
router.patch('/status', handleToggleStatus);

// PATCH  /api/vendor/profile/hours     — update business hours
router.patch('/hours', handleUpdateHours);

// PATCH  /api/vendor/profile/location  — update location
router.patch('/location', handleUpdateLocation);

// PATCH  /api/vendor/profile/email     — update email
router.patch('/email', handleUpdateEmail);

// PATCH  /api/vendor/profile/bank      — update bank details
router.patch('/bank', handleUpdateBankDetails);

// PATCH  /api/vendor/profile/pricing   — update pricing
router.patch('/pricing', handleUpdatePricing);

module.exports = router;
