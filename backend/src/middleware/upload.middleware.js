'use strict';

const multer = require('multer');

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const ACCEPTED_MIMES = new Set([
  // PDF
  'application/pdf',
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp',
  // Office docs
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // OpenDocument
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  // Text / CSV
  'text/plain', 'text/csv',
]);

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ACCEPTED_MIMES.has(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const err = new Error(`File type "${file.mimetype}" is not supported`);
    err.status = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

module.exports = { upload };
