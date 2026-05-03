'use strict';

const multer = require('multer');

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Only PDF and images (JPG/PNG) as per spec
const ACCEPTED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const storage = multer.memoryStorage(); // no disk writes

const fileFilter = (_req, file, cb) => {
  if (ACCEPTED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported file type "${file.mimetype}". Only PDF, JPG, and PNG are allowed.`
    );
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
