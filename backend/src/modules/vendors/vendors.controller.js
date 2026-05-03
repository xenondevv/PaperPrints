'use strict';

const { getNearby, getById, registerVendor } = require('./vendors.service');

async function handleGetNearby(req, res, next) {
  try {
    const lat    = parseFloat(req.query.lat);
    const lng    = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 10;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'lat and lng are required numbers' });
    }

    const vendors = await getNearby(lat, lng, radius);
    res.json({ vendors });
  } catch (err) {
    next(err);
  }
}

async function handleGetById(req, res, next) {
  try {
    const vendor = await getById(req.params.id);
    res.json({ vendor });
  } catch (err) {
    next(err);
  }
}

const { query } = require('../../config/db');
const { sendNewVendorAlert } = require('../../services/email.service');

async function handleRegister(req, res, next) {
  try {
    const { ownerName, shopName, phone, address } = req.body;
    if (!ownerName || !shopName || !phone || !address) {
      return res.status(400).json({ message: 'ownerName, shopName, phone, and address are required' });
    }
    const result = await registerVendor(req.user.id, req.body);
    
    // Fetch full data for email
    try {
      const vendorData = await getById(result.vendorId);
      const userRes = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      const userData = userRes.rows[0];
      
      // Fire and forget
      sendNewVendorAlert(vendorData, userData).catch(err => {
        console.error('Failed to send new vendor alert email:', err);
      });
    } catch (err) {
      console.error('Error fetching data for vendor alert email:', err);
    }
    
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleGetNearby,
  handleGetById,
  handleRegister,
};
