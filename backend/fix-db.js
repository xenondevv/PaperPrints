const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EkzWwpMitn03@ep-little-frog-am64bw8r.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if column exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='payments' AND column_name='cf_order_id';
    `);
    
    if (res.rows.length === 0) {
      console.log('cf_order_id column not found, adding it...');
      await client.query(`ALTER TABLE payments ADD COLUMN cf_order_id TEXT;`);
      console.log('cf_order_id added.');
    } else {
      console.log('cf_order_id already exists.');
    }
    
    // Check for payment_session_id
    const res2 = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='payments' AND column_name='payment_session_id';
    `);
    
    if (res2.rows.length === 0) {
      console.log('payment_session_id column not found, adding it...');
      await client.query(`ALTER TABLE payments ADD COLUMN payment_session_id TEXT;`);
      console.log('payment_session_id added.');
    } else {
      console.log('payment_session_id already exists.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
