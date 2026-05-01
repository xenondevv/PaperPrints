'use strict';

/**
 * Returns true if value is a finite number within [min, max].
 */
function isNumInRange(val, min, max) {
  const n = Number(val);
  return Number.isFinite(n) && n >= min && n <= max;
}

/**
 * Returns true if str is a non-empty string after trimming.
 */
function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Returns true if val is a valid UUID v4.
 */
function isUuid(val) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Returns true if arr is a non-empty array where every element passes predicate.
 */
function isArrayOf(arr, predicate) {
  return Array.isArray(arr) && arr.length > 0 && arr.every(predicate);
}

module.exports = { isNumInRange, isNonEmptyString, isUuid, isArrayOf };
