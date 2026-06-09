const { pool } = require('./src/config/db');

async function check() {
  const res = await pool.query(`SELECT id, s3_key, file_name, file_url FROM files`);
  console.log('All files in DB:');
  console.log(JSON.stringify(res.rows, null, 2));
  
  const of = await pool.query(`SELECT of.*, f.s3_key, f.file_name as fname FROM order_files of LEFT JOIN files f ON f.id = of.file_id`);
  console.log('\nOrder files with joined file data:');
  console.log(JSON.stringify(of.rows, null, 2));
  
  await pool.end();
}
check();
