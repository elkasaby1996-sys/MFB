import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fromCurrency, toCurrency, date } = await req.json();

    if (!fromCurrency || !toCurrency) {
      return Response.json({ error: 'Missing fromCurrency/toCurrency' }, { status: 400 });
    }

    if (fromCurrency === toCurrency) {
      return Response.json({ firstRate: 1, secondRate: 1, combinedRate: 1, from: fromCurrency, to: toCurrency, bridge: 'USD' });
    }
    
    const apiKey = Deno.env.get('EXCHANGERATE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ExchangeRate API key not configured' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];
    const useDate = date && date !== today ? date : 'latest';

    // Fetch from -> USD
    const url1 = useDate === 'latest'
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`
      : `https://v6.exchangerate-api.com/v6/${apiKey}/history/${fromCurrency}/${date.replace(/-/g, '/')}`;
    
    const res1 = await fetch(url1);
    if (!res1.ok) {
      return Response.json({ error: `Failed to fetch rate for ${fromCurrency}` }, { status: 500 });
    }
    const data1 = await res1.json();
    const firstRate = data1.conversion_rates?.USD;

    // Fetch USD -> to
    const url2 = useDate === 'latest'
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      : `https://v6.exchangerate-api.com/v6/${apiKey}/history/USD/${date.replace(/-/g, '/')}`;
    
    const res2 = await fetch(url2);
    if (!res2.ok) {
      return Response.json({ error: `Failed to fetch rate for ${toCurrency}` }, { status: 500 });
    }
    const data2 = await res2.json();
    const secondRate = data2.conversion_rates?.[toCurrency];

    if (!firstRate || !secondRate) {
      return Response.json({ error: 'Failed to fetch bridge rates' }, { status: 500 });
    }

    const combinedRate = firstRate * secondRate;

    return Response.json({
      firstRate,
      secondRate,
      combinedRate,
      usdAmount: 1 * firstRate,
      from: fromCurrency,
      to: toCurrency,
      bridge: 'USD',
    });
  } catch (error) {
    console.error('USD bridge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});