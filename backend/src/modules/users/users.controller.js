'use strict';

const { getMe, updateMe } = require('./users.service');

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

module.exports = { handleGetMe, handleUpdateMe };
