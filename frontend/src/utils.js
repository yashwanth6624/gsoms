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
