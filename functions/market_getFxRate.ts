import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
const CACHE_KEY_PREFIX = "market_fx_";
const FX_TTL = 15 * 60 * 1000; // 15 minutes

function getCacheKey(from, to) {
  return `${CACHE_KEY_PREFIX}${from}_${to}`;
}

// Use FXRate entity for persistent cache
async function getCachedFxRate(base44, from, to) {
  try {
    const cached = await base44.asServiceRole.entities.FXRate.filter({
      from_currency: from,
      to_currency: to
    });
    
    if (cached && cached.length > 0) {
      const fx = cached[0];
      return {
        from,
        to,
        rate: fx.rate,
        timestamp: fx.updated_at || new Date().toISOString(),
        isStale: false
      };
    }
    return null;
  } catch (error) {
    console.error('FX cache read error:', error);
    return null;
  }
}

async function setCachedFxRate(base44, from, to, data) {
  try {
    // Update or create FXRate entity
    const existing = await base44.asServiceRole.entities.FXRate.filter({
      from_currency: from,
      to_currency: to
    });
    
    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.FXRate.update(existing[0].id, {
        rate: data.rate,
        updated_at: data.timestamp
      });
    } else {
      await base44.asServiceRole.entities.FXRate.create({
        from_currency: from,
        to_currency: to,
        rate: data.rate,
        updated_at: data.timestamp
      });
    }
  } catch (error) {
    console.error('FX cache write error:', error);
  }
}

async function fetchFxRateFromFinnhub(from, to) {
  // Use Finnhub forex rates API
  const url = `https://finnhub.io/api/v1/forex/rates?base=${from}&token=${FINNHUB_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub FX API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Check if rate exists and is not null
  if (data.quote && data.quote[to] && data.quote[to] !== null && data.quote[to] !== undefined) {
    return parseFloat(data.quote[to]);
  }
  
  // Rate unavailable - return null instead of throwing
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { from, to } = await req.json();
    
    if (!from || !to) {
      return Response.json({ error: 'from and to currencies required' }, { status: 400 });
    }

    // Same currency = rate 1
    if (from === to) {
      return Response.json({
        from,
        to,
        rate: 1,
        timestamp: new Date().toISOString(),
        isStale: false,
      });
    }

    // Check cache
    const cached = await getCachedFxRate(base44, from, to);
    if (cached) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      if (age < FX_TTL) {
        return Response.json({ ...cached, fromCache: true });
      }
    }

    // Fetch fresh
    try {
      const rate = await fetchFxRateFromFinnhub(from, to);
      
      // If Finnhub doesn't support this pair
      if (rate === null) {
        console.warn(`Finnhub has no rate for ${from}/${to}`);
        // Return stale cache if available, otherwise return null
        if (cached) {
          return Response.json({ ...cached, isStale: true });
        }
        return Response.json({
          from,
          to,
          rate: null,
          timestamp: new Date().toISOString(),
          isStale: true,
          error: 'Rate not available from provider'
        });
      }
      
      const fxData = {
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
        isStale: false,
      };

      await setCachedFxRate(base44, from, to, fxData);
      return Response.json(fxData);
    } catch (error) {
      console.error('Finnhub FX fetch error:', error);
      
      // Return stale cache if available
      if (cached) {
        return Response.json({ ...cached, isStale: true });
      }
      
      return Response.json({
        from,
        to,
        rate: null,
        timestamp: new Date().toISOString(),
        isStale: true,
        error: error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});