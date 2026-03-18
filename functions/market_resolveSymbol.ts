import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");

// Built-in metals instruments
const METALS = [
  { symbol: 'XAU', name: 'Gold', providerSymbol: 'XAU', currency: 'USD', geography: 'global', sector: 'commodities' },
  { symbol: 'XAG', name: 'Silver', providerSymbol: 'XAG', currency: 'USD', geography: 'global', sector: 'commodities' },
  { symbol: 'XPT', name: 'Platinum', providerSymbol: 'XPT', currency: 'USD', geography: 'global', sector: 'commodities' },
  { symbol: 'XPD', name: 'Palladium', providerSymbol: 'XPD', currency: 'USD', geography: 'global', sector: 'commodities' },
];

async function searchFinnhub(query, assetType) {
  if (assetType === 'metal') {
    // Return built-in metals
    return METALS.filter(m => 
      m.symbol.toLowerCase().includes(query.toLowerCase()) ||
      m.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (assetType === 'crypto') {
    // Crypto search - use common symbols
    const cryptos = [
      { symbol: 'BTC', name: 'Bitcoin', providerSymbol: 'BTC', currency: 'USD', exchange: 'BINANCE' },
      { symbol: 'ETH', name: 'Ethereum', providerSymbol: 'ETH', currency: 'USD', exchange: 'BINANCE' },
      { symbol: 'USDT', name: 'Tether', providerSymbol: 'USDT', currency: 'USD', exchange: 'BINANCE' },
      { symbol: 'BNB', name: 'Binance Coin', providerSymbol: 'BNB', currency: 'USD', exchange: 'BINANCE' },
      { symbol: 'SOL', name: 'Solana', providerSymbol: 'SOL', currency: 'USD', exchange: 'BINANCE' },
      { symbol: 'XRP', name: 'Ripple', providerSymbol: 'XRP', currency: 'USD', exchange: 'BINANCE' },
      { symbol: 'ADA', name: 'Cardano', providerSymbol: 'ADA', currency: 'USD', exchange: 'BINANCE' },
      { symbol: 'DOGE', name: 'Dogecoin', providerSymbol: 'DOGE', currency: 'USD', exchange: 'BINANCE' },
    ];
    
    return cryptos.filter(c => 
      c.symbol.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Stocks/ETFs - use Finnhub symbol search
  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub search error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.result || data.result.length === 0) {
    return [];
  }

  // Filter by asset type and format results
  return data.result
    .filter(r => {
      if (assetType === 'stock') return r.type === 'Common Stock';
      if (assetType === 'etf') return r.type === 'ETP' || r.type === 'ETF';
      return true;
    })
    .slice(0, 10)
    .map(r => ({
      symbol: r.symbol,
      name: r.description,
      providerSymbol: r.symbol,
      currency: 'USD', // Default, can be refined
      exchange: r.displaySymbol ? r.displaySymbol.split(':')[0] : 'US',
      sector: 'unknown',
      geography: 'us',
    }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, assetType } = await req.json();
    
    if (!query || !assetType) {
      return Response.json({ error: 'query and assetType required' }, { status: 400 });
    }

    const results = await searchFinnhub(query, assetType);
    
    return Response.json({ results });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});