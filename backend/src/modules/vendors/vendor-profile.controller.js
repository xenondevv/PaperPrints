'use strict';

const {
  getVendorProfile,
  toggleShopStatus,
  updateBusinessHours,
  updateLocation,
  updateEmail,
  updateBankDetails,
  updatePricing,
} = require('./vendor-profile.service');

async function handleGetProfile(req, res, next) {
  try {
    const profile = await getVendorProfile(req.user.id);
    res.json({ vendor: profile });
  } catch (err) { next(err); }
}

async function handleToggleStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active (boolean) is required' });
    }
    const result = await toggleShopStatus(req.user.id, is_active);
    res.json(result);
  } catch (err) { next(err); }
}

async function handleUpdateHours(req, res, next) {
  try {
    const { opening_time, closing_time } = req.body;
    if (!opening_time || !closing_time) {
      return res.status(400).json({ message: 'opening_time and closing_time are required' });
    }
    const result = await updateBusinessHours(req.user.id, opening_time, closing_time);
    res.json(result);
  } catch (err) { next(err); }
}

async function handleUpdateLocation(req, res, next) {
  try {
    const { lat, lng, address } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }
    const result = await updateLocation(req.user.id, lat, lng, address);
    res.json(result);
  } catch (err) { next(err); }
}

async function handleUpdateEmail(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }
    const result = await updateEmail(req.user.id, email);
    res.json(result);
  } catch (err) { next(err); }
}

async function handleUpdateBankDetails(req, res, next) {
  try {
    const result = await updateBankDetails(req.user.id, req.body);
    res.json({ bankDetails: result });
  } catch (err) { next(err); }
}

async function handleUpdatePricing(req, res, next) {
  try {
    const result = await updatePricing(req.user.id, req.body);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = {
  handleGetProfile,
  handleToggleStatus,
  handleUpdateHours,
  handleUpdateLocation,
  handleUpdateEmail,
  handleUpdateBankDetails,
  handleUpdatePricing,
};
