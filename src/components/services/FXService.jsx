/**
 * FX Service - Foreign Exchange Rate Management
 * Handles fetching, caching, and converting between currencies
 */

import { base44 } from '@/api/base44Client';

const FX_CACHE_KEY = 'myfinancebro_fx_rates';
const FX_CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Get cached FX rates from localStorage
 */
function getCachedRates() {
  try {
    const cached = localStorage.getItem(FX_CACHE_KEY);
    if (!cached) return {};
    
    const data = JSON.parse(cached);
    return data || {};
  } catch (error) {
    console.error('FX cache read error:', error);
    return {};
  }
}

/**
 * Save FX rates to localStorage
 */
function setCachedRates(rates) {
  try {
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(rates));
  } catch (error) {
    console.error('FX cache write error:', error);
  }
}

/**
 * Check if cached rate is still valid
 */
function isCacheValid(timestamp) {
  if (!timestamp) return false;
  const age = Date.now() - new Date(timestamp).getTime();
  return age < FX_CACHE_DURATION_MS;
}

/**
 * Fetch FX rate from API using AI integration
 */
async function fetchFXRateFromAPI(fromCurrency, toCurrency) {
  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `What is the current exchange rate from ${fromCurrency} to ${toCurrency}? 
Provide only the numeric rate (e.g., if 1 USD = 3.64 QAR, return 3.64).
Return the rate as a number with 6 decimal precision.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          rate: { type: "number" },
          from: { type: "string" },
          to: { type: "string" },
          timestamp: { type: "string" }
        }
      }
    });

    return {
      rate: response.rate,
      from: fromCurrency,
      to: toCurrency,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('FX API fetch error:', error);
    throw error;
  }
}

/**
 * Get FX rate from cache or fetch if needed
 */
export async function getFXRate(fromCurrency, toCurrency) {
  // Same currency = rate of 1
  if (fromCurrency === toCurrency) {
    return {
      rate: 1,
      from: fromCurrency,
      to: toCurrency,
      timestamp: new Date().toISOString(),
      cached: false,
    };
  }

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = getCachedRates();
  
  // Check if we have a valid cached rate
  if (cached[cacheKey] && isCacheValid(cached[cacheKey].timestamp)) {
    return {
      ...cached[cacheKey],
      cached: true,
    };
  }

  // Fetch fresh rate
  try {
    const freshRate = await fetchFXRateFromAPI(fromCurrency, toCurrency);
    
    // Update cache
    cached[cacheKey] = freshRate;
    setCachedRates(cached);
    
    return {
      ...freshRate,
      cached: false,
    };
  } catch (error) {
    // If fetch fails, return stale cache if available
    if (cached[cacheKey]) {
      console.warn('Using stale FX rate due to fetch error');
      return {
        ...cached[cacheKey],
        cached: true,
        stale: true,
      };
    }
    
    throw new Error(`Unable to fetch FX rate for ${fromCurrency} to ${toCurrency}`);
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return {
      amount: amount,
      rate: 1,
      from: fromCurrency,
      to: toCurrency,
    };
  }

  const fxData = await getFXRate(fromCurrency, toCurrency);
  const convertedAmount = amount * fxData.rate;

  return {
    amount: convertedAmount,
    rate: fxData.rate,
    from: fromCurrency,
    to: toCurrency,
    timestamp: fxData.timestamp,
    cached: fxData.cached,
    stale: fxData.stale,
  };
}

/**
 * Batch fetch multiple FX rates
 */
export async function batchFetchFXRates(pairs) {
  const results = {};
  
  for (const { from, to } of pairs) {
    try {
      const fxData = await getFXRate(from, to);
      results[`${from}_${to}`] = fxData;
    } catch (error) {
      console.error(`Failed to fetch ${from} to ${to}:`, error);
      results[`${from}_${to}`] = null;
    }
  }
  
  return results;
}

/**
 * Clear FX cache (useful for manual refresh)
 */
export function clearFXCache() {
  try {
    localStorage.removeItem(FX_CACHE_KEY);
  } catch (error) {
    console.error('FX cache clear error:', error);
  }
}

/**
 * Format currency with proper symbol
 */
export function formatCurrencyWithSymbol(amount, currency) {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    QAR: 'QAR ',
    AED: 'AED ',
    SAR: 'SAR ',
    INR: '₹',
  };

  const symbol = symbols[currency] || `${currency} `;
  const formatted = amount.toFixed(2);
  
  // For currencies with prefix symbols
  if (['USD', 'EUR', 'GBP', 'INR'].includes(currency)) {
    return `${symbol}${formatted}`;
  }
  
  // For currencies with suffix
  return `${symbol}${formatted}`;
}