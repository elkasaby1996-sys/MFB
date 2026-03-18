import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Smart FX rate resolution with triangulation support
 * Priority order:
 * 1. Direct rate (from -> to)
 * 2. Bridge via AED (if to is QAR)
 * 3. Bridge via USD (universal fallback)
 * 4. Bridge via EUR (last resort)
 * Returns null if no route available
 */

const BRIDGE_CURRENCIES = ['AED', 'USD', 'EUR'];

async function directFxRate(from, to) {
  try {
    const resp = await fetch('/functions/market_getFxRate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to })
    });
    const data = await resp.json();
    if (data.rate !== null && data.rate !== undefined) {
      return data.rate;
    }
  } catch (error) {
    console.error(`Direct FX fetch failed for ${from}->${to}:`, error);
  }
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

    // Same currency always returns 1
    if (from === to) {
      return Response.json({
        from,
        to,
        rate: 1,
        timestamp: new Date().toISOString(),
        isStale: false,
        method: 'identity',
      });
    }

    // 1) Try direct
    let rate = await directFxRate(from, to);
    if (rate) {
      return Response.json({
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
        isStale: false,
        method: 'direct',
      });
    }

    // 2) Try bridges
    for (const bridge of BRIDGE_CURRENCIES) {
      if (bridge === from || bridge === to) continue;
      
      try {
        const rate1 = await directFxRate(from, bridge);
        const rate2 = await directFxRate(bridge, to);
        
        if (rate1 && rate2) {
          const triangulated = rate1 * rate2;
          return Response.json({
            from,
            to,
            rate: triangulated,
            timestamp: new Date().toISOString(),
            isStale: false,
            method: `triangulated_via_${bridge}`,
          });
        }
      } catch (error) {
        console.error(`Bridge via ${bridge} failed:`, error);
      }
    }

    // No rate available - return null, not 1
    console.warn(`No FX rate available for ${from} -> ${to}`);
    return Response.json({
      from,
      to,
      rate: null,
      timestamp: new Date().toISOString(),
      isStale: true,
      method: 'unavailable',
      error: 'No rate available for this pair'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});