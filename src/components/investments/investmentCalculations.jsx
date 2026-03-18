/**
 * Investment Calculations (Multi-Currency Correct)
 * CRITICAL: Always calculate in asset currency first, then convert
 */

/**
 * Calculate investment metrics with proper currency handling
 * @param {Object} investment - Investment with quantity, avgBuyPrice_asset
 * @param {Object} instrument - Instrument with currency info
 * @param {number} currentPrice_asset - Current price in asset currency
 * @param {number} fxRate - FX rate from asset currency to base currency
 * @param {string} baseCurrency - User's base display currency
 * @returns {Object} All metrics in both asset and base currency
 */
export function calculateInvestmentMetrics(investment, instrument, currentPrice_asset, fxRate = null, baseCurrency = 'USD') {
  const quantity = parseFloat(investment.quantity) || 0;
  const avgBuyPrice = parseFloat(investment.avgBuyPrice_asset) || 0;
  const assetCurrency = investment?.investmentCurrency || instrument?.instrumentCurrency || 'USD';
  
  // === ASSET CURRENCY CALCULATIONS (FIRST) ===
  const invested_asset = quantity * avgBuyPrice;
  const currentValue_asset = quantity * currentPrice_asset;
  const gainLoss_asset = currentValue_asset - invested_asset;
  
  // Percentage calculation (currency-agnostic)
  const gainLossPct = invested_asset > 0 ? (gainLoss_asset / invested_asset) * 100 : 0;
  
  // === BASE CURRENCY CALCULATIONS (SECOND) ===
  // Only convert if FX is available
  let invested_base = invested_asset;
  let currentValue_base = currentValue_asset;
  let gainLoss_base = gainLoss_asset;
  let fxUnavailable = false;
  
  if (assetCurrency !== baseCurrency) {
    if (fxRate !== null && fxRate !== undefined && fxRate > 0) {
      invested_base = invested_asset * fxRate;
      currentValue_base = currentValue_asset * fxRate;
      gainLoss_base = gainLoss_asset * fxRate;
    } else {
      // FX unavailable - show asset currency values only
      fxUnavailable = true;
    }
  }
  
  return {
    // Asset currency
    invested_asset,
    currentValue_asset,
    gainLoss_asset,
    assetCurrency,
    
    // Base currency (asset currency if conversion unavailable)
    invested_base,
    currentValue_base,
    gainLoss_base,
    baseCurrency,
    
    // Percentage (same regardless of currency)
    gainLossPct,
    
    // Flags
    needsFX: assetCurrency !== baseCurrency,
    hasFXData: fxRate !== null && fxRate !== undefined && fxRate > 0,
    fxUnavailable,
    hasData: quantity > 0 && avgBuyPrice > 0 && currentPrice_asset > 0,
  };
}

/**
 * Calculate portfolio totals
 * @param {Array} metricsArray - Array of investment metrics
 * @param {string} baseCurrency - Base currency
 * @returns {Object} Portfolio totals in base currency
 */
export function calculatePortfolioMetrics(metricsArray, baseCurrency = 'USD') {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  
  metricsArray.forEach(m => {
    if (m.hasData) {
      totalInvested += m.invested_base;
      totalCurrentValue += m.currentValue_base;
    }
  });
  
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  
  return {
    totalInvested,
    totalCurrentValue,
    totalGainLoss,
    totalGainLossPct,
    baseCurrency,
    count: metricsArray.length,
  };
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount, currency) {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    QAR: 'QAR ',
    AED: 'AED ',
    SAR: 'SAR ',
  };
  
  const symbol = symbols[currency] || `${currency} `;
  const formatted = Math.abs(amount).toFixed(2);
  
  if (['USD', 'EUR', 'GBP', 'JPY'].includes(currency)) {
    return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
  }
  
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}