// Currency utility functions for multi-currency support

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', flag: '🇶🇦' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'LKR', symbol: 'රු', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
];

export const getCurrencyInfo = (code) => {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatCurrencyWithFlag = (amount, currency = 'USD') => {
  const info = getCurrencyInfo(currency);
  const formatted = formatCurrency(amount, currency);
  return `${info.flag} ${formatted}`;
};

// Stub FX conversion - will use FXRate entity data
export const convertCurrency = async (amount, fromCurrency, toCurrency, fxRates = []) => {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 };
  }

  // Try to find direct rate
  let rate = fxRates.find(r => r.from_currency === fromCurrency && r.to_currency === toCurrency);
  
  if (!rate) {
    // Try inverse rate
    const inverseRate = fxRates.find(r => r.from_currency === toCurrency && r.to_currency === fromCurrency);
    if (inverseRate) {
      rate = { rate: 1 / inverseRate.rate };
    }
  }

  if (!rate) {
    // Fallback to hardcoded common rates (for demo purposes)
    const fallbackRates = {
      'USD_QAR': 3.64,
      'USD_AED': 3.67,
      'USD_SAR': 3.75,
      'USD_EGP': 31.0,
      'USD_EUR': 0.92,
      'USD_GBP': 0.79,
      'USD_INR': 83.0,
      'USD_PKR': 278.0,
      'USD_PHP': 55.5,
      'USD_BDT': 110.0,
      'USD_LKR': 325.0,
      'QAR_EGP': 8.52,
      'AED_EGP': 8.44,
      'SAR_EGP': 8.27,
    };

    const key = `${fromCurrency}_${toCurrency}`;
    const inverseKey = `${toCurrency}_${fromCurrency}`;

    if (fallbackRates[key]) {
      rate = { rate: fallbackRates[key] };
    } else if (fallbackRates[inverseKey]) {
      rate = { rate: 1 / fallbackRates[inverseKey] };
    } else {
      // Try converting through USD
      const toUSD = fallbackRates[`${fromCurrency}_USD`] || (fallbackRates[`USD_${fromCurrency}`] ? 1 / fallbackRates[`USD_${fromCurrency}`] : null);
      const fromUSD = fallbackRates[`USD_${toCurrency}`] || (fallbackRates[`${toCurrency}_USD`] ? 1 / fallbackRates[`${toCurrency}_USD`] : null);
      
      if (toUSD && fromUSD) {
        rate = { rate: toUSD * fromUSD };
      } else {
        // Last resort - assume 1:1
        rate = { rate: 1 };
      }
    }
  }

  return {
    amount: amount * rate.rate,
    rate: rate.rate,
  };
};

export const formatDualCurrency = (amount, originalCurrency, baseCurrency, fxRate) => {
  if (originalCurrency === baseCurrency) {
    return formatCurrency(amount, originalCurrency);
  }

  const baseAmount = amount * (fxRate || 1);
  return `${formatCurrency(amount, originalCurrency)} (≈ ${formatCurrency(baseAmount, baseCurrency)})`;
};