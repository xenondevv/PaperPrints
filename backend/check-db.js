const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EkzWwpMitn03@ep-little-frog-am64bw8r.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    await client.connect();
    
    // Check orders table
    const res = await client.query(`SELECT id, order_number, user_id, vendor_id, status FROM orders ORDER BY created_at DESC LIMIT 5;`);
    console.log('Orders:', res.rows);

    const vendorRes = await client.query(`SELECT id, user_id, shop_name, is_active, is_verified FROM vendors;`);
    console.log('Vendors:', vendorRes.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
