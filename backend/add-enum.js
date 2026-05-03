const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EkzWwpMitn03@ep-little-frog-am64bw8r.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    await client.connect();
    
    // Check if PAYMENT_PENDING already exists to avoid errors
    const res = await client.query(`
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'PAYMENT_PENDING' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    `);
    
    if (res.rowCount === 0) {
      await client.query(`ALTER TYPE order_status ADD VALUE 'PAYMENT_PENDING';`);
      console.log('Added PAYMENT_PENDING to order_status enum');
    } else {
      console.log('PAYMENT_PENDING already exists');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
