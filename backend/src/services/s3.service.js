'use strict';

const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const env      = require('../config/env');

const BUCKET = env.s3.bucket;

/**
 * Upload a file buffer to S3.
 * @param {Buffer}  buffer   - File content
 * @param {string}  s3Key    - Destination key, e.g. "uploads/{uuid}.pdf"
 * @param {string}  mimeType - MIME type of the file
 */
async function uploadToS3(buffer, s3Key, mimeType) {
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         s3Key,
    Body:        buffer,
    ContentType: mimeType || 'application/octet-stream',
  });
  await s3Client.send(command);
}

/**
 * Generate a pre-signed GET URL valid for `expiresIn` seconds (default 15 min).
 * @param {string} s3Key     - The object key in S3
 * @param {number} expiresIn - Seconds until URL expires (default 900 = 15 min)
 * @returns {Promise<string>} Pre-signed URL
 */
async function generatePresignedUrl(s3Key, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key:    s3Key,
    ResponseContentDisposition: 'inline',
    ResponseContentType:        'application/pdf',
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = { uploadToS3, generatePresignedUrl };
