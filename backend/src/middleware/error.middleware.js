'use strict';

/**
 * Global Express error handler.
 * Any error passed to next(err) lands here.
 */
function errorHandler(err, _req, res, _next) {
  const status  = err.status  || 500;
  const message = err.message || 'Internal Server Error';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ message });
}

module.exports = { errorHandler };
