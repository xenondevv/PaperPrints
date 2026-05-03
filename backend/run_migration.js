const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, 'src', 'migrations', '007_order_files.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Successfully executed 007_order_files.sql');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
