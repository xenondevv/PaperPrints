const { createClient } = require('redis');
const env = require('./env');

const redis = createClient({ url: env.redis.url });

redis.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await redis.connect();
  console.log('⚡ Redis connected');
})();

module.exports = redis;
