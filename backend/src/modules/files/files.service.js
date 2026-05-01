'use strict';

const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 }   = require('uuid');
const axios            = require('axios');
const s3               = require('../../config/s3');
const env              = require('../../config/env');
const { query }        = require('../../config/db');

/**
 * Upload a PDF buffer to S3 and analyse pages via the pdf-service.
 * Returns the saved FileRecord (matching Flutter's FileRecord model).
 */
async function uploadFile(userId, buffer, originalName) {
  const fileId  = uuidv4();
  const s3Key   = `uploads/${userId}/${fileId}.pdf`;
  const bucket  = env.s3.bucket;

  // 1. Push to S3
  await s3.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         s3Key,
    Body:        buffer,
    ContentType: 'application/pdf',
    Metadata:    { userId, originalName },
  }));

  // 2. Generate a 7-day pre-signed URL (pdf-service fetches via this)
  const fileUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: s3Key }),
    { expiresIn: 604800 }
  );

  // 3. Ask pdf-service to analyse pages
  let totalPages = 0;
  let pages = [];
  try {
    const pdfRes = await axios.post(
      `${env.pdfService.url}/analyse`,
      { fileUrl },
      { timeout: 30_000 }
    );
    totalPages = pdfRes.data.total_pages || 0;
    pages      = pdfRes.data.pages       || [];
  } catch (pdfErr) {
    // Non-fatal: fall back to unknown page count
    console.warn('[files] pdf-service unreachable:', pdfErr.message);
  }

  // 4. Persist file record
  const fileRes = await query(
    `INSERT INTO files
       (id, user_id, file_url, s3_key, file_name, file_size_bytes, total_pages)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
    [fileId, userId, fileUrl, s3Key, originalName, buffer.length, totalPages]
  );
  const file = fileRes.rows[0];

  // 5. Persist page records
  if (pages.length > 0) {
    const vals = pages
      .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
      .join(', ');
    const params = pages.flatMap((p) => [file.id, p.page_number, p.is_color ?? false]);
    await query(
      `INSERT INTO file_pages (file_id, page_number, is_color) VALUES ${vals}`,
      params
    );
  }

  return {
    id:          file.id,
    fileName:    file.file_name,
    fileUrl:     file.file_url,
    totalPages:  file.total_pages,
    uploadedAt:  file.uploaded_at,
    pages:       pages.map((p) => ({ page_number: p.page_number, is_color: p.is_color ?? false })),
  };
}

module.exports = { uploadFile };
