// Environment variable loader
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  s3: {
    region: process.env.AWS_REGION,
    bucket: process.env.S3_BUCKET,
  },
  pdfService: {
    url: process.env.PDF_SERVICE_URL,
  },
  firebase: {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || null,
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || null,
  },
};
