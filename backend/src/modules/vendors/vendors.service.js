'use strict';

const { query } = require('../../config/db');

/**
 * GET /api/vendors/nearby?lat=X&lng=Y&radius=10
 * Uses the PostGIS point-distance shorthand via Haversine formula in plain SQL.
 * Returns vendors within `radius` km, sorted by distance.
 */
async function getNearby(lat, lng, radiusKm = 10) {
  const result = await query(
    `SELECT
        v.id,
        v.shop_name,
        v.address,
        v.phone,
        v.is_active   AS is_open,
        v.location_lat AS lat,
        v.location_lng AS lng,
        -- Haversine distance in km
        CASE WHEN v.is_demo THEN 0 ELSE
        ( 6371 * acos(
            cos(radians($1)) * cos(radians(v.location_lat))
            * cos(radians(v.location_lng) - radians($2))
            + sin(radians($1)) * sin(radians(v.location_lat))
          )
        ) END AS distance_km,
        row_to_json(vs) AS settings
     FROM vendors v
     LEFT JOIN vendor_settings vs ON vs.vendor_id = v.id
    WHERE v.is_active = TRUE
      AND (
          v.is_demo = TRUE OR
          (
            v.is_verified = TRUE AND
            ( 6371 * acos(
                cos(radians($1)) * cos(radians(v.location_lat))
                * cos(radians(v.location_lng) - radians($2))
                + sin(radians($1)) * sin(radians(v.location_lat))
              )
            ) <= $3
          )
      )
    ORDER BY distance_km ASC
    LIMIT 50`,
    [lat, lng, radiusKm]
  );

  return result.rows.map(formatVendor);
}

/**
 * GET /api/vendors/:id
 */
async function getById(id) {
  const result = await query(
    `SELECT
        v.id, v.shop_name, v.address, v.phone,
        v.is_active AS is_open,
        v.location_lat AS lat, v.location_lng AS lng,
        row_to_json(vs) AS settings
      FROM vendors v
      LEFT JOIN vendor_settings vs ON vs.vendor_id = v.id
     WHERE v.id = $1`,
    [id]
  );

  if (!result.rows[0]) {
    const err = new Error('Vendor not found');
    err.status = 404;
    throw err;
  }

  return formatVendor(result.rows[0]);
}

function formatVendor(row) {
  const settings = row.settings;
  return {
    id:          row.id,
    shopName:    row.shop_name,
    address:     row.address   || null,
    phone:       row.phone     || null,
    isOpen:      row.is_open,
    distanceKm:  row.distance_km != null ? Math.round(row.distance_km * 100) / 100 : null,
    lat:         row.lat,
    lng:         row.lng,
    settings: settings
      ? {
          priceBw:         settings.price_bw,
          priceColor:      settings.price_color,
          priceDoubleSided: settings.price_double_sided || null,
          capabilities:    settings.capabilities || [],
        }
      : null,
  };
}

async function registerVendor(userId, data) {
  const { ownerName, shopName, phone, address, email, lat = 0, lng = 0 } = data;

  // 1. Check if user already has a vendor profile
  const existing = await query(`SELECT id FROM vendors WHERE user_id = $1`, [userId]);
  if (existing.rows[0]) {
    const err = new Error('User is already registered as a vendor');
    err.status = 400;
    throw err;
  }

  // 2. Insert vendor profile
  const vendorRes = await query(
    `INSERT INTO vendors (user_id, owner_name, shop_name, phone, address, email, location_lat, location_lng, is_active, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false)
     RETURNING *`,
    [userId, ownerName, shopName, phone, address, email || null, lat, lng]
  );
  const vendor = vendorRes.rows[0];

  // 3. Insert default settings
  await query(
    `INSERT INTO vendor_settings (vendor_id, price_bw, price_color, price_double_sided, max_file_size_mb, avg_processing_min, capabilities)
     VALUES ($1, 2.00, 10.00, 1.00, 50, 15, ARRAY['BW', 'COLOR']::text[])`,
    [vendor.id]
  );

  // 4. Upgrade user role
  await query(`UPDATE users SET role = 'vendor' WHERE id = $1`, [userId]);

  return { message: 'Registration successful', vendorId: vendor.id };
}

module.exports = { getNearby, getById, registerVendor };
