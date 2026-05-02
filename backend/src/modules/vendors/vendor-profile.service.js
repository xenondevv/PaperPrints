'use strict';

const { query } = require('../../config/db');

// ── Get vendor profile (for the logged-in vendor user) ──────────────────────

async function getVendorProfile(userId) {
  const result = await query(
    `SELECT
        v.*,
        vs.price_bw, vs.price_color, vs.price_double_sided,
        vs.opening_time, vs.closing_time,
        vs.max_file_size_mb, vs.avg_processing_min,
        vs.capabilities
      FROM vendors v
      LEFT JOIN vendor_settings vs ON vs.vendor_id = v.id
     WHERE v.user_id = $1`,
    [userId]
  );

  if (!result.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }

  return formatProfile(result.rows[0]);
}

// ── Toggle shop open/closed ─────────────────────────────────────────────────

async function toggleShopStatus(userId, isActive) {
  const result = await query(
    `UPDATE vendors SET is_active = $2, updated_at = NOW()
     WHERE user_id = $1 RETURNING id, is_active`,
    [userId, isActive]
  );
  if (!result.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  return { isActive: result.rows[0].is_active };
}

// ── Update business hours ───────────────────────────────────────────────────

async function updateBusinessHours(userId, openingTime, closingTime) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  await query(
    `UPDATE vendor_settings
        SET opening_time = $2, closing_time = $3, updated_at = NOW()
      WHERE vendor_id = $1`,
    [vendorId, openingTime, closingTime]
  );

  return { openingTime, closingTime };
}

// ── Update location ─────────────────────────────────────────────────────────

async function updateLocation(userId, lat, lng, address) {
  const result = await query(
    `UPDATE vendors
        SET location_lat = $2, location_lng = $3, address = COALESCE($4, address), updated_at = NOW()
      WHERE user_id = $1
    RETURNING location_lat, location_lng, address`,
    [userId, lat, lng, address || null]
  );
  if (!result.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  return {
    lat: result.rows[0].location_lat,
    lng: result.rows[0].location_lng,
    address: result.rows[0].address,
  };
}

// ── Update email ────────────────────────────────────────────────────────────

async function updateEmail(userId, email) {
  const result = await query(
    `UPDATE vendors SET email = $2, updated_at = NOW()
     WHERE user_id = $1 RETURNING email`,
    [userId, email]
  );
  if (!result.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  return { email: result.rows[0].email };
}

// ── Update bank details ─────────────────────────────────────────────────────

async function updateBankDetails(userId, bankDetails) {
  const { accountName, accountNumber, ifsc, bankName, upiId } = bankDetails;
  const result = await query(
    `UPDATE vendors
        SET bank_account_name = $2,
            bank_account_number = $3,
            bank_ifsc = $4,
            bank_name = $5,
            upi_id = $6,
            updated_at = NOW()
      WHERE user_id = $1
    RETURNING bank_account_name, bank_account_number, bank_ifsc, bank_name, upi_id`,
    [userId, accountName || null, accountNumber || null, ifsc || null, bankName || null, upiId || null]
  );
  if (!result.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  return formatBankDetails(result.rows[0]);
}

// ── Update pricing ──────────────────────────────────────────────────────────

async function updatePricing(userId, pricing) {
  const vendorRes = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (!vendorRes.rows[0]) {
    const err = new Error('Vendor profile not found');
    err.status = 404;
    throw err;
  }
  const vendorId = vendorRes.rows[0].id;

  const fields = [];
  const params = [vendorId];
  let idx = 2;

  if (pricing.priceBw != null) { fields.push(`price_bw = $${idx++}`); params.push(pricing.priceBw); }
  if (pricing.priceColor != null) { fields.push(`price_color = $${idx++}`); params.push(pricing.priceColor); }
  if (pricing.priceDoubleSided != null) { fields.push(`price_double_sided = $${idx++}`); params.push(pricing.priceDoubleSided); }

  if (fields.length === 0) return { message: 'Nothing to update' };

  fields.push('updated_at = NOW()');
  await query(
    `UPDATE vendor_settings SET ${fields.join(', ')} WHERE vendor_id = $1`,
    params
  );

  return { message: 'Pricing updated' };
}

// ── Formatters ──────────────────────────────────────────────────────────────

function formatProfile(row) {
  return {
    id:          row.id,
    shopName:    row.shop_name,
    ownerName:   row.owner_name,
    phone:       row.phone,
    email:       row.email,
    address:     row.address,
    lat:         row.location_lat,
    lng:         row.location_lng,
    isActive:    row.is_active,
    isVerified:  row.is_verified,
    settings: {
      priceBw:           row.price_bw ? parseFloat(row.price_bw) : null,
      priceColor:        row.price_color ? parseFloat(row.price_color) : null,
      priceDoubleSided:  row.price_double_sided ? parseFloat(row.price_double_sided) : null,
      openingTime:       row.opening_time || null,
      closingTime:       row.closing_time || null,
      maxFileSizeMb:     row.max_file_size_mb,
      avgProcessingMin:  row.avg_processing_min,
      capabilities:      row.capabilities || [],
    },
    bankDetails: {
      accountName:   row.bank_account_name || null,
      accountNumber: row.bank_account_number || null,
      ifsc:          row.bank_ifsc || null,
      bankName:      row.bank_name || null,
      upiId:         row.upi_id || null,
    },
  };
}

function formatBankDetails(row) {
  return {
    accountName:   row.bank_account_name || null,
    accountNumber: row.bank_account_number || null,
    ifsc:          row.bank_ifsc || null,
    bankName:      row.bank_name || null,
    upiId:         row.upi_id || null,
  };
}

module.exports = {
  getVendorProfile,
  toggleShopStatus,
  updateBusinessHours,
  updateLocation,
  updateEmail,
  updateBankDetails,
  updatePricing,
};
