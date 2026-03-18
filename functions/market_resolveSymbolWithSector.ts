import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

// Map Finnhub industry to sector
function mapIndustryToSector(industry) {
  if (!industry) return null;
  
  const lower = industry.toLowerCase();
  
  if (lower.includes('software') || lower.includes('technology') || lower.includes('semiconductor') || 
      lower.includes('internet') || lower.includes('information technology') || lower.includes('computer') ||
      lower.includes('it services')) {
    return 'technology';
  }
  if (lower.includes('healthcare') || lower.includes('medical') || lower.includes('pharmaceutical') ||
      lower.includes('biotech') || lower.includes('health services')) {
    return 'healthcare';
  }
  if (lower.includes('bank') || lower.includes('finance') || lower.includes('insurance') ||
      lower.includes('investment') || lower.includes('financial services')) {
    return 'finance';
  }
  if (lower.includes('energy') || lower.includes('oil') || lower.includes('gas') || lower.includes('utility')) {
    return 'energy';
  }
  if (lower.includes('retail') || lower.includes('consumer') || lower.includes('restaurant') ||
      lower.includes('food') || lower.includes('beverage')) {
    return 'consumer';
  }
  if (lower.includes('industrial') || lower.includes('manufacturing') || lower.includes('equipment')) {
    return 'industrial';
  }
  if (lower.includes('material') || lower.includes('mining') || lower.includes('steel')) {
    return 'materials';
  }
  if (lower.includes('real estate') || lower.includes('realty')) {
    return 'real_estate';
  }
  if (lower.includes('telecom') || lower.includes('communication')) {
    return 'telecom';
  }
  
  return 'other';
}

async function fetchSectorFromFinnhub(symbol) {
  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.finnhubIndustry) {
      return mapIndustryToSector(data.finnhubIndustry);
    }
    if (data.gind) {
      return mapIndustryToSector(data.gind);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching sector for ${symbol}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, assetType } = await req.json();
    
    if (!symbol) {
      return Response.json({ error: 'symbol required' }, { status: 400 });
    }

    // Use existing market_resolveSymbol to get basic instrument data
    const searchUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const searchResponse = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!searchResponse.ok) {
      return Response.json({ results: [] });
    }

    const searchData = await searchResponse.json();
    const results = [];

    // Filter first, then fetch sectors in parallel with limit
    const filtered = (searchData.result || [])
      .filter(result => !assetType || result.type === 'Common Stock' || result.type === 'equity')
      .slice(0, 5);

    // Fetch sectors in parallel with Promise.allSettled to avoid blocking
    const sectorPromises = filtered.map(result => 
      result.symbol ? fetchSectorFromFinnhub(result.symbol) : Promise.resolve(null)
    );
    
    const sectors = await Promise.allSettled(sectorPromises);

    filtered.forEach((result, idx) => {
      const sector = sectors[idx].status === 'fulfilled' ? sectors[idx].value : null;
      
      results.push({
        symbol: result.symbol,
        name: result.description,
        exchange: result.displaySymbol?.split(':')[0] || '',
        currency: 'USD',
        type: result.type,
        providerSymbol: result.symbol,
        sector: sector,
        geography: 'us', // Default for US stocks
      });
    });

    return Response.json({ results });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});