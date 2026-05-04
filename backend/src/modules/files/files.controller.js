'use strict';

const path               = require('path');
const { v4: uuidv4 }    = require('uuid');
const { query }          = require('../../config/db');
const { uploadToS3, generatePresignedUrl } = require('../../services/s3.service');
const env                = require('../../config/env');
const libre              = require('libreoffice-convert');
const { promisify }      = require('util');

const libreConvert = promisify(libre.convert);

// MIME types that need conversion to PDF before S3 upload
const CONVERTIBLE_MIMES = new Set([
  'application/msword',                                                          // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',      // .docx
  'application/vnd.ms-powerpoint',                                               // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',    // .pptx
]);

/**
 * Convert a document buffer (docx/pptx/doc/ppt) to PDF using LibreOffice.
 * Returns { pdfBuffer, pdfName, pdfMime }.
 */
async function convertToPdf(buffer, originalname) {
  console.log(`[files] Converting "${originalname}" to PDF via LibreOffice…`);
  const pdfBuffer = await libreConvert(buffer, '.pdf', undefined);
  const baseName  = path.basename(originalname, path.extname(originalname));
  return {
    pdfBuffer,
    pdfName: `${baseName}.pdf`,
    pdfMime: 'application/pdf',
  };
}

// ── POST /api/files/upload ────────────────────────────────────────────────────
async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let { buffer, originalname, mimetype, size } = req.file;
    const userId = req.user.id;

    // If the file is a Word/PowerPoint document, convert to PDF first
    if (CONVERTIBLE_MIMES.has(mimetype)) {
      const converted = await convertToPdf(buffer, originalname);
      buffer       = converted.pdfBuffer;
      originalname = converted.pdfName;
      mimetype     = converted.pdfMime;
      size         = buffer.length;
      console.log(`[files] Conversion complete → "${originalname}" (${size} bytes)`);
    }

    // Build S3 key: uploads/{uuid}.pdf (always PDF after conversion)
    const ext    = path.extname(originalname).toLowerCase() || '.bin';
    const fileId = uuidv4();
    const s3Key  = `uploads/${fileId}${ext}`;

    // Push buffer to S3
    await uploadToS3(buffer, s3Key, mimetype);

    // Generate a pre-signed URL for immediate access
    const fileUrl = await generatePresignedUrl(s3Key, 3600);

    // Persist to DB using the actual database columns (file_name, file_size_bytes, file_url)
    const result = await query(
      `INSERT INTO files (id, user_id, s3_key, file_name, file_size_bytes, file_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, file_name, s3_key`,
      [fileId, userId, s3Key, originalname, size, fileUrl]
    );

    const file = result.rows[0];

    return res.status(201).json({
      file: {
        id:            file.id,
        fileName:      file.file_name,
        fileUrl:       fileUrl,
        mimetype:      mimetype,
        s3_key:        file.s3_key,
      }
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/files/:id/download ───────────────────────────────────────────────
async function handleDownload(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, s3_key, file_name FROM files WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'File not found' });
    }

    const { s3_key } = result.rows[0];

    // Pre-signed URL valid for 15 minutes (900 seconds)
    const signed_url = await generatePresignedUrl(s3_key, 900);

    return res.json({ signed_url });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleUpload, handleDownload };
