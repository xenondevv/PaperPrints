const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_VFU2MWSf5jNr@ep-late-sky-ams8fgf6-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function fixUser() {
  try {
    const res = await pool.query(`SELECT id, email, role FROM users WHERE email = 'rishabh.unlocked@gmail.com'`);
    console.log('User:', res.rows[0]);
    if (res.rows.length > 0) {
      const userId = res.rows[0].id;
      const vendorRes = await pool.query(`SELECT * FROM vendors WHERE user_id = $1`, [userId]);
      console.log('Vendor:', vendorRes.rows[0]);

      if (vendorRes.rows.length > 0 && res.rows[0].role !== 'vendor') {
        console.log('User has vendor profile but role is not vendor. Fixing...');
        await pool.query(`UPDATE users SET role = 'vendor' WHERE id = $1`, [userId]);
        console.log('Role updated successfully.');
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
fixUser();
