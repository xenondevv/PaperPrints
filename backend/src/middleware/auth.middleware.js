'use strict';

const { verifyAccessToken } = require('../config/jwt');
const { query } = require('../config/db');

/**
 * Middleware: require a valid JWT access token.
 * Attaches { id, role } to req.user on success, syncing role from the database.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    
    // Fetch latest role from DB to handle role upgrades instantly
    const result = await query('SELECT role FROM users WHERE id = $1', [payload.id]);
    if (!result.rows[0]) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = { id: payload.id, role: result.rows[0].role };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
