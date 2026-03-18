import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

// Map Finnhub industry to sector
function mapIndustryToSector(industry) {
  if (!industry) return null;
  
  const lower = industry.toLowerCase();
  
  // Technology
  if (lower.includes('software') || lower.includes('technology') || lower.includes('semiconductor') || 
      lower.includes('internet') || lower.includes('information technology') || lower.includes('computer') ||
      lower.includes('it services')) {
    return 'technology';
  }
  
  // Healthcare
  if (lower.includes('healthcare') || lower.includes('medical') || lower.includes('pharmaceutical') ||
      lower.includes('biotech') || lower.includes('health services')) {
    return 'healthcare';
  }
  
  // Finance
  if (lower.includes('bank') || lower.includes('finance') || lower.includes('insurance') ||
      lower.includes('investment') || lower.includes('financial services')) {
    return 'finance';
  }
  
  // Energy
  if (lower.includes('energy') || lower.includes('oil') || lower.includes('gas') || lower.includes('utility')) {
    return 'energy';
  }
  
  // Consumer
  if (lower.includes('retail') || lower.includes('consumer') || lower.includes('restaurant') ||
      lower.includes('food') || lower.includes('beverage')) {
    return 'consumer';
  }
  
  // Industrial
  if (lower.includes('industrial') || lower.includes('manufacturing') || lower.includes('equipment')) {
    return 'industrial';
  }
  
  // Materials
  if (lower.includes('material') || lower.includes('mining') || lower.includes('steel')) {
    return 'materials';
  }
  
  // Real Estate
  if (lower.includes('real estate') || lower.includes('realty')) {
    return 'real_estate';
  }
  
  // Telecom
  if (lower.includes('telecom') || lower.includes('communication')) {
    return 'telecom';
  }
  
  return 'other';
}

async function fetchSectorFromFinnhub(symbol) {
  try {
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Finnhub profile fetch failed for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Try finnhubIndustry first (preferred)
    if (data.finnhubIndustry) {
      return mapIndustryToSector(data.finnhubIndustry);
    }
    
    // Fallback to other industry fields
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

    const { limit = 50 } = await req.json();

    // Find equity instruments with missing sector
    const instrumentsWithoutSector = await base44.asServiceRole.entities.Instrument.filter({
      assetType: 'stock',
      // Note: Base44 SDK filter doesn't have "null" checks, so we'll fetch all and filter
    });

    const toBackfill = instrumentsWithoutSector
      .filter(inst => !inst.sector || inst.sector === 'unknown' || inst.sector === 'other')
      .slice(0, limit);

    if (toBackfill.length === 0) {
      return Response.json({
        success: true,
        updated: 0,
        message: 'No instruments need backfill'
      });
    }

    let updated = 0;
    const results = [];

    for (const instrument of toBackfill) {
      try {
        const sector = await fetchSectorFromFinnhub(instrument.symbol);
        
        if (sector) {
          await base44.asServiceRole.entities.Instrument.update(instrument.id, {
            sector
          });
          updated++;
          results.push({ symbol: instrument.symbol, sector, status: 'updated' });
        } else {
          results.push({ symbol: instrument.symbol, sector: null, status: 'not_found' });
        }
      } catch (error) {
        console.error(`Failed to update sector for ${instrument.symbol}:`, error);
        results.push({ symbol: instrument.symbol, status: 'error', error: error.message });
      }
    }

    return Response.json({
      success: true,
      updated,
      total: toBackfill.length,
      results
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});