'use strict';

const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env  = require('../../config/env');
const { query } = require('../../config/db');

// ── S3 / local storage helpers ────────────────────────────────────────────────

const hasS3 = !!(env.s3 && env.s3.bucket && env.s3.region);

// Local fallback: store in <project-root>/uploads/
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '../../../../uploads');

async function saveToLocal(buffer, s3Key) {
  const dest = path.join(LOCAL_UPLOAD_DIR, s3Key.replace(/\//g, '__'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  // Return a URL the phone can reach via the ADB tunnel
  return `http://127.0.0.1:${env.port}/uploads/${path.basename(dest)}`;
}

async function saveToS3(buffer, s3Key, userId, originalName, mimetype) {
  const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const s3 = require('../../config/s3');

  await s3.send(new PutObjectCommand({
    Bucket:      env.s3.bucket,
    Key:         s3Key,
    Body:        buffer,
    ContentType: mimetype || 'application/octet-stream',
    Metadata:    { userId, originalName },
  }));

  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.s3.bucket, Key: s3Key }),
    { expiresIn: 604800 }
  );
}

// ── Page analysis (non-fatal) ─────────────────────────────────────────────────

const hasPdfService = !!(env.pdfService && env.pdfService.url);

async function analysePages(fileUrl) {
  if (!hasPdfService) return { total_pages: 0, pages: [] };
  try {
    const axios = require('axios');
    const res = await axios.post(
      `${env.pdfService.url}/analyse`,
      { fileUrl },
      { timeout: 30_000 }
    );
    return { total_pages: res.data.total_pages || 0, pages: res.data.pages || [] };
  } catch (err) {
    console.warn('[files] pdf-service unreachable:', err.message);
    return { total_pages: 0, pages: [] };
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Upload a PDF and record it in the DB.
 * Uses S3 if credentials are configured, falls back to local disk otherwise.
 */
async function uploadFile(userId, buffer, originalName, mimetype) {
  const fileId  = uuidv4();
  const ext     = path.extname(originalName) || '.bin';
  const s3Key   = `uploads/${userId}/${fileId}${ext}`;

  let fileUrl;
  if (hasS3) {
    fileUrl = await saveToS3(buffer, s3Key, userId, originalName, mimetype);
  } else {
    console.log('[files] S3 not configured — saving to local disk');
    fileUrl = await saveToLocal(buffer, s3Key);
  }

  // Analyse pages (non-fatal; returns 0 pages if pdf-service not running)
  const { total_pages: totalPages, pages } = await analysePages(fileUrl);

  // Persist file record
  const fileRes = await query(
    `INSERT INTO files
       (id, user_id, file_url, s3_key, file_name, file_size_bytes, total_pages)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
    [fileId, userId, fileUrl, s3Key, originalName, buffer.length, totalPages]
  );
  const file = fileRes.rows[0];

  // Persist page records
  if (pages.length > 0) {
    const vals   = pages.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
    const params = pages.flatMap((p) => [file.id, p.page_number, p.is_color ?? false]);
    await query(
      `INSERT INTO file_pages (file_id, page_number, is_color) VALUES ${vals}`,
      params
    );
  }

  return {
    id:         file.id,
    fileName:   file.file_name,
    fileUrl:    file.file_url,
    totalPages: file.total_pages,
    uploadedAt: file.uploaded_at,
    pages:      pages.map((p) => ({ page_number: p.page_number, is_color: p.is_color ?? false })),
  };
}

module.exports = { uploadFile };
