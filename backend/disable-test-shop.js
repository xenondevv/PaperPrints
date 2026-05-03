const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EkzWwpMitn03@ep-little-frog-am64bw8r.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    await client.connect();
    
    // Disable 'first shop'
    const res = await client.query(`
      UPDATE vendors 
      SET is_active = false, is_verified = false 
      WHERE shop_name = 'first shop';
    `);
    
    console.log('Disabled test shop(s)');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
