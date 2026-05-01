'use strict';

const { verifyAccessToken } = require('../config/jwt');

/**
 * Middleware: require a valid JWT access token.
 * Attaches { id, role } to req.user on success.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
