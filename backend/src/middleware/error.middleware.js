'use strict';

/**
 * Global Express error handler.
 * Any error passed to next(err) lands here.
 */
function errorHandler(err, _req, res, _next) {
  let status  = err.status  || 500;
  let message = err.message || 'Internal Server Error';

  // If it's an Axios error from a 3rd party API (e.g. Cashfree), extract the real message
  if (err.isAxiosError && err.response && err.response.data) {
    status = err.response.status || status;
    const data = err.response.data;
    if (typeof data === 'object') {
      message = data.message || JSON.stringify(data);
    } else {
      message = data;
    }
  }

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({ message });
}

module.exports = { errorHandler };
