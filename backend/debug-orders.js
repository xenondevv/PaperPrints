const { pool } = require('./src/config/db');

async function debug() {
  // Get all orders
  const orders = await pool.query(`SELECT id, file_id, order_number, status FROM orders ORDER BY created_at DESC`);
  console.log('=== ALL ORDERS ===');
  console.log(JSON.stringify(orders.rows, null, 2));

  // Get all order_files with joined file info
  const of = await pool.query(`
    SELECT of.order_id, of.file_id, of.label, of.sort_order, 
           f.s3_key, f.file_name 
    FROM order_files of 
    LEFT JOIN files f ON f.id = of.file_id
    ORDER BY of.order_id, of.sort_order
  `);
  console.log('\n=== ALL ORDER_FILES ===');
  console.log(JSON.stringify(of.rows, null, 2));

  await pool.end();
}
debug();
