const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

const s3 = new S3Client({ region: env.s3.region });

module.exports = s3;
