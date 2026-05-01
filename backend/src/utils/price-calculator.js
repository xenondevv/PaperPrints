'use strict';

/**
 * Calculate the total price for an order.
 *
 * @param {Object} params
 * @param {Array<{print_type: 'BW'|'COLOR'}>} params.pages
 * @param {number} params.copies
 * @param {boolean} params.isDoubleSided
 * @param {{ price_bw: number, price_color: number, price_double_sided?: number }} params.settings
 * @returns {number} total price in rupees (2 decimal places)
 */
function calculatePrice({ pages, copies, isDoubleSided, settings }) {
  let pageTotal = 0;

  for (const page of pages) {
    if (page.print_type === 'COLOR') {
      pageTotal += settings.price_color;
    } else {
      pageTotal += settings.price_bw;
    }
  }

  // Double-sided surcharge per physical sheet (ceil pages / 2)
  if (isDoubleSided && settings.price_double_sided) {
    const sheets = Math.ceil(pages.length / 2);
    pageTotal += sheets * settings.price_double_sided;
  }

  const total = pageTotal * copies;
  return Math.round(total * 100) / 100;
}

module.exports = { calculatePrice };
