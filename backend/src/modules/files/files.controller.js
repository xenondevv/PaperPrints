'use strict';

const path               = require('path');
const { v4: uuidv4 }    = require('uuid');
const { query }          = require('../../config/db');
const { uploadToS3, generatePresignedUrl } = require('../../services/s3.service');
const env                = require('../../config/env');

// ── POST /api/files/upload ────────────────────────────────────────────────────
async function handleUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const userId = req.user.id;

    // Build S3 key: uploads/{uuid}.{ext}
    const ext    = path.extname(originalname).toLowerCase() || '.bin';
    const fileId = uuidv4();
    const s3Key  = `uploads/${fileId}${ext}`;

    // Push buffer to S3
    await uploadToS3(buffer, s3Key, mimetype);

    // fileUrl won't strictly be needed but the schema requires it
    const fileUrl = `https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com/${s3Key}`;

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
