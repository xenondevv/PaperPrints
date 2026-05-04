'use strict';

const multer = require('multer');

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// PDF, images, and Office documents (docx/pptx converted to PDF before S3)
const ACCEPTED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  // Word
  'application/msword',                                                          // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',      // .docx
  // PowerPoint
  'application/vnd.ms-powerpoint',                                               // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',    // .pptx
]);

const storage = multer.memoryStorage(); // no disk writes

const fileFilter = (_req, file, cb) => {
  if (ACCEPTED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported file type "${file.mimetype}". Only PDF, Images, Word, and PowerPoint files are allowed.`
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
