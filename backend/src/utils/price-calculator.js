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

  const priceBw = parseFloat(settings.price_bw) || 0;
  const priceColor = parseFloat(settings.price_color) || 0;
  const priceDoubleSided = parseFloat(settings.price_double_sided) || 0;

  for (const page of pages) {
    if (page.print_type === 'COLOR') {
      pageTotal += priceColor;
    } else {
      pageTotal += priceBw;
    }
  }

  // Double-sided surcharge per physical sheet (ceil pages / 2)
  if (isDoubleSided && priceDoubleSided > 0) {
    const sheets = Math.ceil(pages.length / 2);
    pageTotal += sheets * priceDoubleSided;
  }

  const total = pageTotal * copies;
  const finalPrice = Math.round(total * 100) / 100;
  
  // Ensure minimum price of 1 INR for Cashfree to prevent 400 Bad Request
  return Math.max(finalPrice, 1);
}

module.exports = { calculatePrice };
