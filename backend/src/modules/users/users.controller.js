'use strict';

const { getMe, updateMe, saveFcmToken } = require('./users.service');

async function handleGetMe(req, res, next) {
  try {
    const user = await getMe(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function handleUpdateMe(req, res, next) {
  try {
    const { name, email } = req.body;
    const user = await updateMe(req.user.id, { name, email });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function handleSaveFcmToken(req, res, next) {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: 'fcmToken is required' });
    }
    await saveFcmToken(req.user.id, fcmToken);
    res.json({ message: 'FCM token saved' });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleGetMe, handleUpdateMe, handleSaveFcmToken };
