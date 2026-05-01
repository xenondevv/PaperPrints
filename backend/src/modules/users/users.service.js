'use strict';

const { query } = require('../../config/db');

// ── GET /api/users/me ─────────────────────────────────────────────────────────

async function getMe(userId) {
  const result = await query(
    `SELECT id, name, email, photo_url, role, created_at
       FROM users
      WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const u = result.rows[0];
  return {
    id:       u.id,
    name:     u.name,
    email:    u.email,
    photoUrl: u.photo_url,
    role:     u.role,
    createdAt: u.created_at,
  };
}

// ── PATCH /api/users/me ───────────────────────────────────────────────────────

async function updateMe(userId, { name, email }) {
  // Build SET clause dynamically with only provided fields
  const updates = [];
  const values  = [];
  let   i       = 1;

  if (name  !== undefined) { updates.push(`name  = $${i++}`); values.push(name.trim());  }
  if (email !== undefined) { updates.push(`email = $${i++}`); values.push(email.trim()); }

  if (updates.length === 0) {
    const err = new Error('Nothing to update');
    err.status = 400;
    throw err;
  }

  values.push(userId);
  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${i}
  RETURNING id, name, email, photo_url, role`,
    values
  );

  const u = result.rows[0];
  return {
    id:       u.id,
    name:     u.name,
    email:    u.email,
    photoUrl: u.photo_url,
    role:     u.role,
  };
}

module.exports = { getMe, updateMe };
