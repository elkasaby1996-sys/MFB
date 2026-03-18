import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instrumentIds } = await req.json();
    
    if (!instrumentIds || !Array.isArray(instrumentIds)) {
      return Response.json({ error: 'instrumentIds array required' }, { status: 400 });
    }

    // Fetch quotes in parallel
    const quotes = await Promise.all(
      instrumentIds.map(async (id) => {
        try {
          const response = await base44.functions.invoke('market_getQuote', { instrumentId: id });
          return response.data;
        } catch (error) {
          console.error(`Failed to fetch quote for ${id}:`, error);
          return {
            instrumentId: id,
            error: 'Failed to fetch',
            isStale: true,
          };
        }
      })
    );

    return Response.json({ quotes });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});