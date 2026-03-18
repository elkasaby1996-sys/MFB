import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
const CACHE_KEY_PREFIX = "market_quote_";

// TTL by asset type (milliseconds)
const TTL = {
  crypto: 45 * 1000,      // 45s
  stock: 120 * 1000,       // 2 min
  etf: 120 * 1000,         // 2 min
  metal: 120 * 1000,       // 2 min
  fx: 15 * 60 * 1000,      // 15 min
};

function getCacheKey(instrumentId) {
  return `${CACHE_KEY_PREFIX}${instrumentId}`;
}

// Use in-memory cache as fallback (will work within same function execution)
const memoryCache = new Map();

async function getCachedQuote(base44, instrumentId) {
  try {
    // Check memory cache first
    const memCached = memoryCache.get(instrumentId);
    if (memCached) {
      return memCached;
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function setCachedQuote(base44, instrumentId, data, ttl) {
  try {
    // Store in memory cache
    memoryCache.set(instrumentId, data);
    
    // Clean up old entries after TTL
    setTimeout(() => {
      memoryCache.delete(instrumentId);
    }, ttl);
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function fetchFromFinnhub(providerSymbol, assetType) {
  let url;
  
  if (assetType === 'crypto') {
    // Crypto: use crypto/quote endpoint
    url = `https://finnhub.io/api/v1/crypto/candle?symbol=BINANCE:${providerSymbol}USDT&resolution=1&from=${Math.floor(Date.now()/1000)-60}&to=${Math.floor(Date.now()/1000)}&token=${FINNHUB_API_KEY}`;
  } else if (assetType === 'fx') {
    // FX: use forex/candle endpoint
    url = `https://finnhub.io/api/v1/forex/candle?symbol=OANDA:${providerSymbol}&resolution=1&from=${Math.floor(Date.now()/1000)-60}&to=${Math.floor(Date.now()/1000)}&token=${FINNHUB_API_KEY}`;
  } else if (assetType === 'metal') {
    // Metals: use forex rates (XAU/USD format)
    url = `https://finnhub.io/api/v1/forex/rates?base=${providerSymbol}&token=${FINNHUB_API_KEY}`;
  } else {
    // Stocks/ETFs: use quote endpoint
    url = `https://finnhub.io/api/v1/quote?symbol=${providerSymbol}&token=${FINNHUB_API_KEY}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Parse response based on asset type
  if (assetType === 'crypto' || assetType === 'fx') {
    // Candle response
    if (data.s === 'ok' && data.c && data.c.length > 0) {
      return data.c[data.c.length - 1]; // Last close price
    }
    throw new Error('No price data available');
  } else if (assetType === 'metal') {
    // Forex rates response - return rate for USD
    if (data.quote && data.quote.USD) {
      return data.quote.USD;
    }
    throw new Error('No metal price available');
  } else {
    // Stock/ETF quote response
    if (data.c) {
      return data.c; // Current price
    }
    throw new Error('No price data available');
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instrumentId } = await req.json();
    
    if (!instrumentId) {
      return Response.json({ error: 'instrumentId required' }, { status: 400 });
    }

    // Get instrument details
    const instrument = await base44.asServiceRole.entities.Instrument.get(instrumentId);
    if (!instrument) {
      return Response.json({ error: 'Instrument not found' }, { status: 404 });
    }

    const ttl = TTL[instrument.assetType] || TTL.stock;
    
    // Check cache
    const cached = await getCachedQuote(base44, instrumentId);
    if (cached) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      if (age < ttl) {
        return Response.json({ ...cached, fromCache: true });
      }
    }

    // Fetch fresh from Finnhub
    try {
      const price = await fetchFromFinnhub(instrument.providerSymbol, instrument.assetType);
      
      const quote = {
        instrumentId: instrument.id,
        provider: "finnhub",
        providerSymbol: instrument.providerSymbol,
        assetType: instrument.assetType,
        price: price,
        currency: instrument.instrumentCurrency,
        timestamp: new Date().toISOString(),
        isStale: false,
        isDelayed: false,
      };

      // Cache it
      await setCachedQuote(base44, instrumentId, quote, ttl);

      return Response.json(quote);
    } catch (error) {
      console.error('Finnhub fetch error:', error);
      
      // Return stale cache if available
      if (cached) {
        return Response.json({ ...cached, isStale: true });
      }
      
      return Response.json({ error: 'Failed to fetch quote' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});