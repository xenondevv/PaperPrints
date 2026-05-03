'use strict';

const { query } = require('../../config/db');
const { sendVendorApproved } = require('../../services/email.service');

async function verifyVendor(req, res, next) {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Unauthorized: Invalid admin secret' });
    }

    const { id } = req.params;

    // Fetch vendor and user email
    const vendorRes = await query(
      `SELECT v.id, v.shop_name, v.owner_name, v.user_id, u.email as user_email
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = $1`,
      [id]
    );

    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = vendorRes.rows[0];

    // Update is_verified to true
    await query('UPDATE vendors SET is_verified = true WHERE id = $1', [id]);

    // Send email to vendor
    if (vendor.user_email) {
      sendVendorApproved(vendor.user_email, vendor.shop_name, vendor.owner_name).catch(err => {
        console.error('Failed to send vendor approval email:', err);
      });
    }

    res.json({ message: 'Vendor verified successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  verifyVendor,
};
