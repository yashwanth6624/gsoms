/**
 * Utility functions for GSOMS
 */

/**
 * Formats a numeric value as Indian Rupees (INR) with proper comma separators and decimal representation.
 * Example: 1478.00 -> ₹1,478.00
 * @param {number} value 
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '₹0.00';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Safely parses SQLite date strings (YYYY-MM-DD HH:MM:SS) into a valid Javascript Date object.
 * Prevents mobile Safari / Android Chrome "Invalid Date" crashes.
 * @param {string|Date} dateStr 
 * @returns {Date}
 */
export const parseSafeDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  let formatted = String(dateStr).trim();
  // If format is YYYY-MM-DD HH:MM:SS
  if (formatted.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    formatted = formatted.replace(' ', 'T') + 'Z';
  } else if (formatted.match(/^\d{4}-\d{2}-\d{2}$/)) {
    formatted = formatted + 'T00:00:00Z';
  }

  const d = new Date(formatted);
  if (isNaN(d.getTime())) {
    return new Date(); // Fallback to current date instead of breaking
  }
  return d;
};

/**
 * Safely formats a date string using local browser standards without RangeErrors.
 * @param {string|Date} dateStr 
 * @param {object} options 
 * @returns {string}
 */
export const formatLocalDate = (dateStr, options = { dateStyle: 'medium' }) => {
  try {
    const d = parseSafeDate(dateStr);
    return d.toLocaleDateString(undefined, options);
  } catch (e) {
    console.error('Date formatting failed:', e);
    return String(dateStr);
  }
};

/**
 * Safely formats a date time string using local browser standards.
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatLocalDateTime = (dateStr) => {
  try {
    const d = parseSafeDate(dateStr);
    return d.toLocaleString();
  } catch (e) {
    console.error('DateTime formatting failed:', e);
    return String(dateStr);
  }
};
