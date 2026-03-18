/**
 * Currency Conversion Service for MyFinanceBro
 * 
 * CRITICAL: Investment Currency Handling Rules
 * ============================================
 * 
 * 1. CALCULATION ORDER (MANDATORY):
 *    - ALWAYS calculate in asset/investment currency first
 *    - THEN convert to base currency using FX rate
 *    - NEVER mix currencies in calculations
 * 
 * 2. STORAGE:
 *    - investment.avgBuyPrice_asset (in investment currency)
 *    - investment.investmentCurrency (e.g., USD, EUR)
 *    - investment.lastQuotePrice_asset (in investment currency)
 *    - investment.lastFxRate (investment currency to base currency)
 * 
 * 3. PERCENTAGE CALCULATION:
 *    - Calculate percentage from asset currency values
 *    - Percentage is currency-agnostic (same in any currency)
 * 
 * 4. FX RATE SOURCE:
 *    - Finnhub API via market_getFxRate backend function
 *    - Cached for 5-30 minutes
 *    - Stored in FXRate entity for persistence
 * 
 * Example correct calculation:
 * ============================
 * Given:
 *   - quantity = 1
 *   - avgBuyPrice_asset = 246.70 USD
 *   - currentPrice_asset = 173.55 USD
 *   - fxRate (USD->QAR) = 3.64
 * 
 * Step 1: Calculate in asset currency (USD)
 *   invested_asset = 1 * 246.70 = 246.70 USD
 *   currentValue_asset = 1 * 173.55 = 173.55 USD
 *   gainLoss_asset = 173.55 - 246.70 = -73.15 USD
 *   gainLossPct = (-73.15 / 246.70) * 100 = -29.64%
 * 
 * Step 2: Convert to base currency (QAR)
 *   invested_base = 246.70 * 3.64 = 898.19 QAR
 *   currentValue_base = 173.55 * 3.64 = 631.72 QAR
 *   gainLoss_base = -73.15 * 3.64 = -266.27 QAR
 *   gainLossPct = -29.64% (same!)
 * 
 * ❌ WRONG: Never do this
 * =======================
 * invested_base = quantity * avgBuyPrice_base  // Don't store avgBuyPrice_base!
 * gainLoss = currentValue_base - invested_base  // Wrong if FX changed!
 */

import { base44 } from '@/api/base44Client';

/**
 * Fetch FX rate from investment currency to base currency
 * @param {string} fromCurrency - Investment currency
 * @param {string} toCurrency - Base currency
 * @returns {Promise<{rate: number, timestamp: string, isStale: boolean}>}
 */
export async function fetchFxRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return { rate: 1, timestamp: new Date().toISOString(), isStale: false };
  }

  try {
    const response = await base44.functions.invoke('market_getFxRate', {
      from: fromCurrency,
      to: toCurrency,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch FX rate ${fromCurrency}->${toCurrency}:`, error);
    throw error;
  }
}

/**
 * Batch fetch FX rates for multiple currency pairs
 * @param {Array<{from: string, to: string}>} pairs
 * @returns {Promise<Object>} Map of "FROM-TO" -> {rate, timestamp, isStale}
 */
export async function fetchBatchFxRates(pairs, baseCurrency) {
  const uniqueCurrencies = [...new Set(pairs.map(p => p.from).filter(c => c !== baseCurrency))];
  
  const fxMap = {};
  
  await Promise.all(uniqueCurrencies.map(async (fromCurrency) => {
    try {
      const result = await fetchFxRate(fromCurrency, baseCurrency);
      fxMap[fromCurrency] = result;
    } catch (error) {
      console.error(`FX fetch failed for ${fromCurrency}:`, error);
      fxMap[fromCurrency] = { rate: null, timestamp: null, isStale: true, error: true };
    }
  }));

  // Add base currency (always 1)
  fxMap[baseCurrency] = { rate: 1, timestamp: new Date().toISOString(), isStale: false };

  return fxMap;
}

/**
 * Calculate investment metrics with proper currency handling
 * This is the SINGLE SOURCE OF TRUTH for investment calculations
 */
export function calculateInvestmentValue(investment, currentPrice_asset, fxRate, baseCurrency) {
  const quantity = parseFloat(investment.quantity) || 0;
  const avgBuyPrice_asset = parseFloat(investment.avgBuyPrice_asset) || 0;
  const invCurrency = investment.investmentCurrency || 'USD';

  // Step 1: Calculate in asset currency
  const invested_asset = quantity * avgBuyPrice_asset;
  const currentValue_asset = quantity * currentPrice_asset;
  const gainLoss_asset = currentValue_asset - invested_asset;
  const gainLossPct = invested_asset > 0 ? (gainLoss_asset / invested_asset) * 100 : 0;

  // Step 2: Convert to base currency
  const fx = parseFloat(fxRate) || 1;
  const invested_base = invested_asset * fx;
  const currentValue_base = currentValue_asset * fx;
  const gainLoss_base = gainLoss_asset * fx;

  return {
    // Asset currency values
    invested_asset,
    currentValue_asset,
    gainLoss_asset,
    assetCurrency: invCurrency,

    // Base currency values
    invested_base,
    currentValue_base,
    gainLoss_base,
    baseCurrency,

    // Percentage (same in both currencies)
    gainLossPct,

    // Metadata
    needsFX: invCurrency !== baseCurrency,
    hasFXData: fx > 0 && fx !== 1,
    fxRate: fx,
  };
}

/**
 * Test function to verify calculations
 */
export function testCurrencyConversion() {
  const testInvestment = {
    quantity: 1,
    avgBuyPrice_asset: 246.70,
    investmentCurrency: 'USD',
  };

  const currentPrice = 173.55;
  const fxRate = 3.64; // USD to QAR

  const result = calculateInvestmentValue(testInvestment, currentPrice, fxRate, 'QAR');

  const tests = [
    {
      name: 'Percentage calculation',
      expected: -29.64,
      actual: result.gainLossPct,
      tolerance: 0.01,
    },
    {
      name: 'Asset currency gain/loss',
      expected: -73.15,
      actual: result.gainLoss_asset,
      tolerance: 0.01,
    },
    {
      name: 'Base currency conversion',
      expected: -266.27,
      actual: result.gainLoss_base,
      tolerance: 0.5,
    },
  ];

  console.log('Currency Conversion Tests:');
  tests.forEach(test => {
    const passed = Math.abs(test.expected - test.actual) <= test.tolerance;
    console.log(`${passed ? '✅' : '❌'} ${test.name}: expected ${test.expected}, got ${test.actual.toFixed(2)}`);
  });

  return tests.every(t => Math.abs(t.expected - t.actual) <= t.tolerance);
}