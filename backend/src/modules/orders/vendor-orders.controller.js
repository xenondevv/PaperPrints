'use strict';

const {
  getVendorOrders,
  getVendorOrderById,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
} = require('./vendor-orders.service');

async function handleGetAll(req, res, next) {
  try {
    const orders = await getVendorOrders(req.user.id);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function handleGetById(req, res, next) {
  try {
    const order = await getVendorOrderById(req.user.id, req.params.id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

async function handleAccept(req, res, next) {
  try {
    const { estimated_time } = req.body;
    const result = await acceptOrder(req.user.id, req.params.id, estimated_time);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleReject(req, res, next) {
  try {
    const result = await rejectOrder(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function handleStatusUpdate(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }
    const result = await updateOrderStatus(req.user.id, req.params.id, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleGetAll,
  handleGetById,
  handleAccept,
  handleReject,
  handleStatusUpdate,
};
