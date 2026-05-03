const { query } = require('./src/config/db');

async function deleteUserByEmail() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address.');
    console.log('Usage: node delete-user.js <your-email@gmail.com>');
    process.exit(1);
  }

  try {
    console.log(`Looking for user with email: ${email}`);
    
    // The vendors, vendor_settings, files, etc. tables have ON DELETE CASCADE
    // So deleting the user will cleanly delete all their vendor data too.
    const result = await query('DELETE FROM users WHERE email = $1 RETURNING id', [email]);

    if (result.rowCount > 0) {
      console.log(`✅ Successfully deleted user (and all their vendor data) with ID: ${result.rows[0].id}`);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    process.exit(0);
  }
}

deleteUserByEmail();
