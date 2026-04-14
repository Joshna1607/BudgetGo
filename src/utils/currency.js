/**
 * Currency formatting utilities for Indian Rupees (INR)
 */

/**
 * Format amount as Indian Rupees with currency symbol
 * @param {number} amount - Amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: false)
 * @returns {string} Formatted currency string (e.g., "₹1,00,000" or "₹1,00,000.50")
 */
export const formatINR = (amount, showDecimals = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0'
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
}

/**
 * Format amount as number with Indian number system (without currency symbol)
 * @param {number} amount - Amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string (e.g., "1,00,000.50")
 */
export const formatINRNumber = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0'
  }
  
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Parse currency string to number (removes currency symbols and commas)
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
export const parseINR = (currencyString) => {
  if (!currencyString) return 0
  const cleaned = currencyString.toString().replace(/[₹,\s]/g, '')
  return parseFloat(cleaned) || 0
}

