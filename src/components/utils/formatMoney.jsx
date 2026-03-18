/**
 * Consistent money formatting utility for App Store production
 * - Uses Intl.NumberFormat for proper currency display
 * - Never shows $ unless currency is USD
 * - Handles converted amounts with ≈ prefix
 */

const CURRENCY_INFO = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  QAR: { symbol: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦' },
  SAR: { symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  AED: { symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  EGP: { symbol: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬' },
  KWD: { symbol: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  BHD: { symbol: 'BHD', name: 'Bahraini Dinar', flag: '🇧🇭' },
  OMR: { symbol: 'OMR', name: 'Omani Rial', flag: '🇴🇲' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  PKR: { symbol: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰' },
  BDT: { symbol: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  PHP: { symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  IDR: { symbol: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  MYR: { symbol: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  SGD: { symbol: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  THB: { symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  KRW: { symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  CAD: { symbol: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  NZD: { symbol: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  SEK: { symbol: 'SEK', name: 'Swedish Krona', flag: '🇸🇪' },
  NOK: { symbol: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴' },
  DKK: { symbol: 'DKK', name: 'Danish Krone', flag: '🇩🇰' },
  PLN: { symbol: 'PLN', name: 'Polish Zloty', flag: '🇵🇱' },
  TRY: { symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  ZAR: { symbol: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  MXN: { symbol: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
  ARS: { symbol: 'ARS', name: 'Argentine Peso', flag: '🇦🇷' },
};

/**
 * Format money amount with proper currency display
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - ISO currency code (USD, QAR, etc.)
 * @param {object} options - Additional formatting options
 * @returns {string} Formatted money string
 */
export function formatMoney(amount, currencyCode = 'USD', options = {}) {
  const {
    decimals = 2,
    showSymbol = true,
    showCode = false,
    approximate = false
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY_INFO[currencyCode]?.symbol || currencyCode} 0.00` : '0.00';
  }

  // Use Intl.NumberFormat for proper formatting
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formattedAmount = formatter.format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  const prefix = approximate ? '≈ ' : '';
  
  if (!showSymbol && !showCode) {
    return `${prefix}${sign}${formattedAmount}`;
  }

  if (showCode) {
    return `${prefix}${sign}${formattedAmount} ${currencyCode}`;
  }

  const symbol = CURRENCY_INFO[currencyCode]?.symbol || currencyCode;
  
  // Symbol positioning based on currency
  if (currencyCode === 'EUR' || currencyCode === 'GBP') {
    return `${prefix}${symbol}${sign}${formattedAmount}`;
  }
  
  return `${prefix}${sign}${symbol}${formattedAmount}`;
}

/**
 * Format money with currency code explicitly shown
 */
export function formatMoneyWithCode(amount, currencyCode = 'USD', options = {}) {
  return formatMoney(amount, currencyCode, { ...options, showCode: true, showSymbol: false });
}

/**
 * Format converted/approximate amount
 */
export function formatApproximateMoney(amount, currencyCode = 'USD', options = {}) {
  return formatMoney(amount, currencyCode, { ...options, approximate: true });
}

/**
 * Get currency info
 */
export function getCurrencyInfo(currencyCode) {
  return CURRENCY_INFO[currencyCode] || { symbol: currencyCode, name: currencyCode, flag: '' };
}

/**
 * Format dual currency display (original + converted)
 */
// Backwards compatibility alias
export const formatCurrency = formatMoney;

export function formatDualCurrency(originalAmount, originalCurrency, convertedAmount, convertedCurrency) {
  if (originalCurrency === convertedCurrency) {
    return formatMoney(originalAmount, originalCurrency);
  }
  
  const original = formatMoney(originalAmount, originalCurrency);
  const converted = formatApproximateMoney(convertedAmount, convertedCurrency);
  
  return `${original} (${converted})`;
}