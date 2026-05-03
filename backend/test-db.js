const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EkzWwpMitn03@ep-little-frog-am64bw8r.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    await client.connect();
    
    // Check if column exists
    const res = await client.query(`SELECT cf_order_id FROM payments LIMIT 1;`);
    console.log('SUCCESS: column exists');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
