/**
 * Shared type definitions (JSDoc) used across all clients.
 * If migrating to TypeScript, convert these to .d.ts or .ts interfaces.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {string|null} email
 * @property {string|null} avatar_url
 * @property {number|null} location_lat
 * @property {number|null} location_lng
 * @property {string} created_at
 */

/**
 * @typedef {Object} Vendor
 * @property {string} id
 * @property {string} owner_name
 * @property {string} shop_name
 * @property {string} phone
 * @property {string|null} email
 * @property {string} address
 * @property {number} location_lat
 * @property {number} location_lng
 * @property {boolean} is_active
 * @property {boolean} is_verified
 * @property {string|null} avatar_url
 * @property {VendorSettings} settings
 * @property {VendorService[]} services
 */

/**
 * @typedef {Object} VendorSettings
 * @property {number} price_bw          - Price per B&W page
 * @property {number} price_color       - Price per color page
 * @property {number} price_double_sided
 * @property {string|null} opening_time  - "09:00"
 * @property {string|null} closing_time  - "21:00"
 * @property {number} max_file_size_mb
 * @property {boolean} accepts_delivery
 * @property {number} avg_processing_min
 */

/**
 * @typedef {Object} VendorService
 * @property {string} id
 * @property {string} vendor_id
 * @property {string} service
 * @property {number|null} price
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} FileRecord
 * @property {string} id
 * @property {string} user_id
 * @property {string} file_url
 * @property {string} file_name
 * @property {number} file_size_bytes
 * @property {number} total_pages
 * @property {FilePage[]} pages
 * @property {string} uploaded_at
 */

/**
 * @typedef {Object} FilePage
 * @property {number} page_number
 * @property {boolean} is_color
 */

/**
 * @typedef {'PENDING'|'ACCEPTED'|'PROCESSING'|'READY'|'COMPLETED'|'REJECTED'|'CANCELLED'} OrderStatus
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} order_number
 * @property {string} user_id
 * @property {string} vendor_id
 * @property {string} file_id
 * @property {OrderStatus} status
 * @property {number} total_price
 * @property {number} copies
 * @property {boolean} is_double_sided
 * @property {string} orientation
 * @property {string|null} qr_code_url
 * @property {number|null} estimated_time
 * @property {'pickup'|'delivery'} pickup_or_delivery
 * @property {OrderPage[]} pages
 * @property {string} created_at
 */

/**
 * @typedef {Object} OrderPage
 * @property {number} page_number
 * @property {'BW'|'COLOR'} print_type
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} order_id
 * @property {number} amount
 * @property {'PENDING'|'COMPLETED'|'FAILED'|'REFUNDED'} status
 * @property {'UPI'|'CASH'|'CARD'|null} payment_method
 * @property {string|null} transaction_id
 */
