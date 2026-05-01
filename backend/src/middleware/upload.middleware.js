'use strict';

const multer = require('multer');
const path   = require('path');

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const storage = multer.memoryStorage(); // keep file in RAM; we push straight to S3

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const err = new Error('Only PDF files are accepted');
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
