'use strict';

const { createOrder, getOrders, getOrderById, cancelOrder } = require('./orders.service');

async function handleCreate(req, res, next) {
  try {
    const { vendor_id, file_id, file_ids, copies, is_double_sided, pages, orientation } = req.body;
    if (!vendor_id || (!file_id && (!file_ids || file_ids.length === 0))) {
      return res.status(400).json({ message: 'vendor_id and file_id (or file_ids) are required' });
    }
    const order = await createOrder(req.user.id, { vendor_id, file_id, file_ids, copies, is_double_sided, pages: pages || [], orientation });
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

async function handleGetAll(req, res, next) {
  try {
    const orders = await getOrders(req.user.id);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function handleGetById(req, res, next) {
  try {
    const order = await getOrderById(req.user.id, req.params.id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

async function handleCancel(req, res, next) {
  try {
    await cancelOrder(req.user.id, req.params.id);
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleCreate, handleGetAll, handleGetById, handleCancel };
