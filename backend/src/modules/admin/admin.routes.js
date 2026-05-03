'use strict';

const express = require('express');
const { verifyVendor } = require('./admin.controller');

const router = express.Router();

// Webhook to verify vendor
router.patch('/vendors/:id/verify', verifyVendor);

module.exports = router;
