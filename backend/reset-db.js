const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

const MIGRATIONS = [
  '001_initial_schema.sql',
  '004_firebase_auth.sql',
  '005_payments_cashfree.sql',
  '006_vendor_bank_details.sql',
  '007_order_files.sql'
];

async function resetDb() {
  try {
    console.log('Dropping and recreating public schema...');
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Public schema reset.');

    for (const file of MIGRATIONS) {
      console.log(`Running migration: ${file}...`);
      const sqlPath = path.join(__dirname, 'src', 'migrations', file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log(`Successfully executed ${file}`);
    }

    console.log('Database reset successfully! All tables are fresh.');
  } catch (err) {
    console.error('Failed to reset database:', err);
  } finally {
    await pool.end();
  }
}

resetDb();
