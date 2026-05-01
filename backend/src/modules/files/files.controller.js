'use strict';

const { uploadFile } = require('./files.service');

async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const file = await uploadFile(req.user.id, req.file.buffer, req.file.originalname);
    res.status(201).json({ file });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleUpload };
