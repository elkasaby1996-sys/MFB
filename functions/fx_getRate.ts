import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FX_TTL = 12 * 60 * 60 * 1000; // 12 hours

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { from, to, date } = await req.json();
    
    if (!from || !to) {
      return Response.json({ error: 'Missing from/to currency' }, { status: 400 });
    }

    // If same currency, return 1
    if (from === to) {
      return Response.json({ rate: 1, date, from, to, fromCache: false });
    }

    const apiKey = Deno.env.get('EXCHANGERATE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ExchangeRate API key not configured' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];
    const isHistorical = date && date !== today;

    // Check cache (only for latest rates, not historical)
    if (!isHistorical) {
      try {
        const cached = await base44.asServiceRole.entities.FXRate.filter({
          from_currency: from,
          to_currency: to
        });
        if (cached && cached.length > 0) {
          const age = Date.now() - new Date(cached[0].updated_at).getTime();
          if (age < FX_TTL) {
            return Response.json({
              rate: cached[0].rate,
              date: today,
              from,
              to,
              fromCache: true
            });
          }
        }
      } catch (_) { /* ignore cache errors */ }
    }

    // Use historical endpoint if date is provided and not today
    const useDate = isHistorical ? date : 'latest';
    
    const url = useDate === 'latest' 
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${from}`
      : `https://v6.exchangerate-api.com/v6/${apiKey}/history/${from}/${date.replace(/-/g, '/')}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.result !== 'success') {
      return Response.json({ error: 'Failed to fetch exchange rate' }, { status: 500 });
    }

    const rate = data.conversion_rates[to];
    if (!rate) {
      return Response.json({ error: `Rate not found for ${to}` }, { status: 404 });
    }

    // Cache latest rate
    if (!isHistorical) {
      try {
        const timestamp = new Date().toISOString();
        const existing = await base44.asServiceRole.entities.FXRate.filter({ from_currency: from, to_currency: to });
        if (existing && existing.length > 0) {
          await base44.asServiceRole.entities.FXRate.update(existing[0].id, { rate, updated_at: timestamp });
        } else {
          await base44.asServiceRole.entities.FXRate.create({ from_currency: from, to_currency: to, rate, updated_at: timestamp });
        }
      } catch (_) { /* ignore cache write errors */ }
    }

    return Response.json({ 
      rate,
      date: useDate === 'latest' ? today : date,
      from,
      to,
      fromCache: false
    });
  } catch (error) {
    console.error('FX rate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});