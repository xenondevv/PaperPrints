'use strict';

const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');
const env = require('../config/env');

const BUCKET = env.s3.bucket;

/**
 * Upload a file buffer to S3.
 * @param {Buffer}  buffer   - File content
 * @param {string}  s3Key    - Destination key, e.g. "uploads/{uuid}.pdf"
 * @param {string}  mimeType - MIME type of the file
 */
async function uploadToS3(buffer, s3Key, mimeType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: mimeType,
  });
  await s3.send(command);
  console.log(`[S3] Uploaded ${s3Key} to bucket ${BUCKET}`);
}

/**
 * Generate a pre-signed URL for downloading a file from S3.
 * @param {string} s3Key     - The object key
 * @param {number} expiresIn - URL validity in seconds (default 900 = 15 min)
 * @returns {Promise<string>} Pre-signed download URL
 */
async function generatePresignedUrl(s3Key, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

module.exports = { uploadToS3, generatePresignedUrl };
