'use strict';

/**
 * Factory: require the requesting user to have one of the given roles.
 * Must be used AFTER requireAuth.
 *
 * @param {...string} roles - e.g. requireRole('user'), requireRole('vendor', 'admin')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireRole };
