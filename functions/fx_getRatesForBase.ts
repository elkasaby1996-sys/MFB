import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EXCHANGERATE_API_KEY = Deno.env.get("EXCHANGERATE_API_KEY");
const FX_TTL = 12 * 60 * 60 * 1000; // 12 hours

// In-memory cache (persists across requests in same instance)
const rateCache = new Map(); // key: baseCurrency, value: { rates, expiresAt }
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getCachedRates(base44, baseCurrency) {
  try {
    const cached = await base44.asServiceRole.entities.FXRate.filter({
      to_currency: baseCurrency
    });
    
    if (cached && cached.length > 0) {
      const rates = {};
      cached.forEach(fx => {
        const age = Date.now() - new Date(fx.updated_at).getTime();
        rates[fx.from_currency] = {
          rate: fx.rate,
          timestamp: fx.updated_at,
          isStale: age > FX_TTL
        };
      });
      return rates;
    }
    return {};
  } catch (error) {
    console.error('Cache read error:', error);
    return {};
  }
}

async function cacheRate(base44, from, to, rate, timestamp) {
  try {
    const existing = await base44.asServiceRole.entities.FXRate.filter({
      from_currency: from,
      to_currency: to
    });
    
    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.FXRate.update(existing[0].id, {
        rate,
        updated_at: timestamp
      });
    } else {
      await base44.asServiceRole.entities.FXRate.create({
        from_currency: from,
        to_currency: to,
        rate,
        updated_at: timestamp
      });
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function fetchRatesFromExchangeRateAPI(baseCurrency) {
  if (!EXCHANGERATE_API_KEY) {
    throw new Error('EXCHANGERATE_API_KEY not configured');
  }

  const url = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/${baseCurrency}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ExchangeRate-API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.result === 'error') {
    throw new Error(`ExchangeRate-API: ${data['error-type']}`);
  }

  return data.conversion_rates || {};
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { baseCurrency } = await req.json();
    
    if (!baseCurrency) {
      return Response.json({ error: 'baseCurrency required' }, { status: 400 });
    }

    // Check in-memory cache first
    const memCached = rateCache.get(baseCurrency);
    if (memCached && Date.now() < memCached.expiresAt) {
      return Response.json({
        baseCurrency,
        rates: memCached.rates,
        timestamp: new Date().toISOString(),
        source: "ExchangeRate-API (memory-cached)",
        isStale: false,
        fromCache: true
      });
    }

    // Check DB cache (non-stale)
    const cached = await getCachedRates(base44, baseCurrency);
    const freshCached = Object.entries(cached)
      .filter(([_, data]) => !data.isStale)
      .reduce((acc, [from, data]) => {
        acc[from] = data.rate;
        return acc;
      }, {});

    // If we have fresh cache for baseCurrency->baseCurrency, add it
    freshCached[baseCurrency] = 1;

    // If all rates are fresh, return cached
    if (Object.keys(freshCached).length > 0) {
      const staleKeys = Object.entries(cached)
        .filter(([_, data]) => data.isStale)
        .map(([from]) => from);
      
      if (staleKeys.length === 0) {
        return Response.json({
          baseCurrency,
          rates: freshCached,
          timestamp: new Date().toISOString(),
          source: "ExchangeRate-API (cached)",
          isStale: false,
          fromCache: true
        });
      }
    }

    // Fetch fresh rates
    try {
      const allRates = await fetchRatesFromExchangeRateAPI(baseCurrency);
      const timestamp = new Date().toISOString();

      // Cache all rates
      await Promise.all(
        Object.entries(allRates).map(([from, rate]) =>
          cacheRate(base44, from, baseCurrency, rate, timestamp)
        )
      );

      const rates = { [baseCurrency]: 1, ...allRates };

      // Store in in-memory cache
      rateCache.set(baseCurrency, { rates, expiresAt: Date.now() + CACHE_TTL_MS });

      return Response.json({
        baseCurrency,
        rates,
        timestamp,
        source: "ExchangeRate-API",
        isStale: false,
      });
    } catch (error) {
      console.error('ExchangeRate-API batch fetch error:', error);
      
      // Return stale cache if available
      if (Object.keys(cached).length > 0) {
        const staleRates = Object.entries(cached).reduce((acc, [from, data]) => {
          acc[from] = data.rate;
          return acc;
        }, {});
        staleRates[baseCurrency] = 1;

        return Response.json({
          baseCurrency,
          rates: staleRates,
          timestamp: new Date().toISOString(),
          source: "ExchangeRate-API",
          isStale: true,
          error: error.message
        });
      }

      // No cache available
      return Response.json({
        baseCurrency,
        rates: {},
        timestamp: new Date().toISOString(),
        source: "ExchangeRate-API",
        isStale: true,
        error: 'No rates available'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});