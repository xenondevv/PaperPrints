'use strict';

const { getNearby, getById } = require('./vendors.service');

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

module.exports = { handleGetNearby, handleGetById };
