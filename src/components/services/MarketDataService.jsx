import { base44 } from '@/api/base44Client';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class MarketDataService {
  static priceCache = new Map();

  /**
   * Fetch current price for an instrument
   */
  static async fetchCurrentPrice(symbol, assetType = 'stock', currency = 'USD') {
    const cacheKey = `${symbol}_${assetType}`;
    const cached = this.priceCache.get(cacheKey);

    // Return cached price if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Get the current market price for ${assetType}: ${symbol}.
        
IMPORTANT: Respond with ONLY a JSON object containing current price and currency. No markdown, no explanation.

Example response:
{
  "price": 175.43,
  "currency": "USD",
  "timestamp": "2026-01-21T14:30:00Z",
  "source": "Market Data Provider"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            price: { type: "number" },
            currency: { type: "string" },
            timestamp: { type: "string" },
            source: { type: "string" }
          }
        }
      });

      const data = {
        price: response.price,
        currency: response.currency || currency,
        timestamp: response.timestamp || new Date().toISOString(),
        source: response.source || 'Market Data Provider',
      };

      // Cache the result
      this.priceCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch price:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        return { ...cached.data, stale: true };
      }
      
      throw error;
    }
  }

  /**
   * Bulk update prices for multiple investments (with multi-currency support)
   */
  static async updateInvestmentPrices(investments, baseCurrency = 'USD') {
    const updates = [];
    const { getFXRate } = await import('./FXService');

    for (const investment of investments) {
      if (!investment.name) continue;

      try {
        const assetCurrency = investment.asset_currency || investment.currency || 'USD';
        
        // Fetch current price in asset currency
        const priceData = await this.fetchCurrentPrice(
          investment.name,
          investment.type,
          assetCurrency
        );

        const quantity = parseFloat(investment.quantity) || 0;
        const currentValue_asset = quantity > 0 ? quantity * priceData.price : priceData.price;
        
        // Fetch FX rate if needed
        let fxRate = 1;
        let fxTimestamp = new Date().toISOString();
        
        if (assetCurrency !== baseCurrency) {
          try {
            const fxData = await getFXRate(assetCurrency, baseCurrency);
            fxRate = fxData.rate;
            fxTimestamp = fxData.timestamp;
          } catch (error) {
            console.error(`FX rate fetch failed for ${assetCurrency} to ${baseCurrency}:`, error);
            // Use stored FX rate if available
            fxRate = investment.fx_rate || 1;
          }
        }
        
        const currentValue_base = currentValue_asset * fxRate;

        updates.push({
          id: investment.id,
          updates: {
            current_price: priceData.price,
            current_value: currentValue_asset,
            current_value_base: currentValue_base,
            fx_rate: fxRate,
            fx_last_updated: fxTimestamp,
            last_price_update: priceData.timestamp,
            price_source: priceData.source,
          }
        });
      } catch (error) {
        console.warn(`Failed to update price for ${investment.name}:`, error);
      }
    }

    return updates;
  }

  /**
   * Clear price cache
   */
  static clearCache() {
    this.priceCache.clear();
  }

  /**
   * Get last update time from cache
   */
  static getLastUpdateTime(symbol, assetType) {
    const cacheKey = `${symbol}_${assetType}`;
    const cached = this.priceCache.get(cacheKey);
    return cached?.timestamp;
  }
}