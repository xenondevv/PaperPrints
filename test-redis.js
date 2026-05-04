const { createClient } = require('redis');
const redis = createClient({ url: 'redis://non-existent:6379' });
redis.on('error', (err) => console.log('Redis err:', err.message));
(async () => {
  console.log('Before await');
  await redis.connect();
  console.log('After await');
})();
console.log('End of script');
