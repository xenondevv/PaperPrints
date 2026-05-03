const fs = require('fs');
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EkzWwpMitn03@ep-little-frog-am64bw8r.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    await client.connect();
    
    const sql = fs.readFileSync('src/migrations/005_payments_cashfree.sql', 'utf8');
    await client.query(sql);
    console.log('Migration 005 ran successfully.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
