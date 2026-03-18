// Currency Hierarchy for MyFinanceBro
// GRC (Global Reporting Currency) = USD (fixed for cross-country reporting)
// ADC (App Display Currency) = user's baseCurrency (from profile)
// NC (Native Currency) = original currency of each transaction/asset

export const GRC = 'USD'; // Global Reporting Currency (fixed)

// Get App Display Currency from user profile
export const getADC = (profile) => {
  return profile?.currency || 'USD';
};

// Currency symbols and info
export const CURRENCY_INFO = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  QAR: { symbol: 'QR', name: 'Qatari Riyal', flag: '🇶🇦' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  SAR: { symbol: 'SR', name: 'Saudi Riyal', flag: '🇸🇦' },
  AED: { symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  PKR: { symbol: 'Rs', name: 'Pakistani Rupee', flag: '🇵🇰' },
  BDT: { symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  PHP: { symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
};

// Safe currency label (never defaults to $)
export const safeCurrencyLabel = (currencyCode) => {
  return CURRENCY_INFO[currencyCode]?.symbol || currencyCode;
};

// Format money with correct currency symbol
export const formatMoney = (amount, currencyCode, options = {}) => {
  if (!amount && amount !== 0) return '-';
  
  const { showSymbol = true, decimals = 0, approximate = false } = options;
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));
  
  const symbol = showSymbol ? safeCurrencyLabel(currencyCode) : '';
  const prefix = approximate ? '≈ ' : '';
  const sign = amount < 0 ? '-' : '';
  
  return `${prefix}${sign}${symbol} ${formatted}`.trim();
};

// Format with full currency display (for clarity)
export const formatMoneyWithCode = (amount, currencyCode, options = {}) => {
  if (!amount && amount !== 0) return '-';
  
  const { decimals = 0, approximate = false } = options;
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount));
  
  const prefix = approximate ? '≈ ' : '';
  const sign = amount < 0 ? '-' : '';
  
  return `${prefix}${sign}${formatted} ${currencyCode}`.trim();
};

// Get FX rate (returns rate and metadata)
export const getFxRate = async (base44, fromCurrency, toCurrency, date) => {
  if (fromCurrency === toCurrency) {
    return {
      rate: 1,
      source: 'same_currency',
      timestamp: new Date().toISOString(),
      date: date || new Date().toISOString().split('T')[0],
    };
  }
  
  try {
    const { data } = await base44.functions.invoke('fx_getRate', {
      from: fromCurrency,
      to: toCurrency,
      date: date || new Date().toISOString().split('T')[0],
    });
    
    return {
      rate: data.rate,
      source: 'ExchangeRate',
      timestamp: new Date().toISOString(),
      date: data.date,
    };
  } catch (error) {
    console.error('FX rate fetch error:', error);
    throw error;
  }
};

// Convert money with FX
export const convertMoney = async (base44, amount, fromCurrency, toCurrency, date) => {
  const fxData = await getFxRate(base44, fromCurrency, toCurrency, date);
  return {
    convertedAmount: amount * fxData.rate,
    rate: fxData.rate,
    source: fxData.source,
    timestamp: fxData.timestamp,
  };
};