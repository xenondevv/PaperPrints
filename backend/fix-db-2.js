const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EkzWwpMitn03@ep-little-frog-am64bw8r.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    await client.connect();
    
    // Check for payment_gateway
    let res = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='payments' AND column_name='payment_gateway';
    `);
    if (res.rows.length === 0) {
      console.log('Adding payment_gateway...');
      await client.query(`ALTER TABLE payments ADD COLUMN payment_gateway TEXT;`);
    } else {
      console.log('payment_gateway exists.');
    }
    
    // Check for cf_payment_id
    res = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='payments' AND column_name='cf_payment_id';
    `);
    if (res.rows.length === 0) {
      console.log('Adding cf_payment_id...');
      await client.query(`ALTER TABLE payments ADD COLUMN cf_payment_id TEXT;`);
    } else {
      console.log('cf_payment_id exists.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
