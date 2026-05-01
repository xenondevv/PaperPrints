'use strict';

/**
 * Generate a human-readable order number.
 * Format: PP-YYYYMMDD-XXXX  (XX = 4 random hex chars)
 * Example: PP-20260501-A3F2
 */
function generateOrderNumber() {
  const today = new Date();
  const date  = today.toISOString().slice(0, 10).replace(/-/g, '');
  const rand  = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `PP-${date}-${rand}`;
}

module.exports = { generateOrderNumber };
