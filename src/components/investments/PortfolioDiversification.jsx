import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Grid3x3, MapPin, Building2 } from 'lucide-react';

const SECTOR_COLORS = {
  technology: '#06b6d4',
  healthcare: '#22c55e',
  finance: '#eab308',
  energy: '#f59e0b',
  consumer: '#ec4899',
  industrial: '#8b5cf6',
  real_estate: '#14b8a6',
  utilities: '#3b82f6',
  materials: '#a855f7',
  telecom: '#10b981',
  other: '#64748b',
};

const GEO_COLORS = {
  us: '#3b82f6',
  europe: '#10b981',
  asia: '#f59e0b',
  emerging: '#ec4899',
  global: '#8b5cf6',
  other: '#64748b',
};

export default function PortfolioDiversification({ investments, currency = 'USD', fxRates = {} }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Map assetType to assetClass
  const assetTypeToClass = {
    'stock': 'Equities',
    'etf': 'Equities',
    'crypto': 'Crypto',
    'metal': 'Metals',
    'bond': 'Bonds',
    'real_estate': 'Real Estate',
    'fx': 'Cash/FX',
  };

  const assetClassColors = {
    'Equities': '#06b6d4',
    'Crypto': '#a855f7',
    'Metals': '#eab308',
    'Bonds': '#22c55e',
    'Real Estate': '#ec4899',
    'Cash/FX': '#64748b',
    'Other': '#64748b',
  };

  // Calculate current values with FX conversion
  const holdingsWithValue = investments.map(inv => {
    if (!inv.instrument) return null;

    const quantity = parseFloat(inv.quantity) || 0;
    const currentPrice = parseFloat(inv.lastQuotePrice_asset) || parseFloat(inv.avgBuyPrice_asset) || 0;
    const invCurrency = inv.investmentCurrency || inv.instrument.instrumentCurrency;
    const fxRate = fxRates[invCurrency] !== undefined ? fxRates[invCurrency] : inv.lastFxRate;
    
    // Calculate in asset currency then convert
    const currentValue_asset = quantity * currentPrice;
    // Only convert if FX rate is available
    const currentValue_base = fxRate !== null && fxRate !== undefined ? currentValue_asset * fxRate : null;

    const assetType = inv.instrument.assetType || 'other';
    const assetClass = assetTypeToClass[assetType] || 'Other';

    return {
      ...inv,
      currentValue_base,
      currentValue_asset,
      assetClass,
      sector: inv.instrument.sector,
      geography: inv.instrument.geography,
      hasFX: fxRate !== null && fxRate !== undefined,
    };
  }).filter(h => h && h.currentValue_base !== null);

  const totalValue = holdingsWithValue.reduce((sum, h) => sum + h.currentValue_base, 0);

  // Asset class allocation
  const assetClassMap = {};
  holdingsWithValue.forEach(h => {
    assetClassMap[h.assetClass] = (assetClassMap[h.assetClass] || 0) + h.currentValue_base;
  });

  const assetClassFiltered = Object.entries(assetClassMap).map(([name, value]) => ({
    name,
    value,
    color: assetClassColors[name] || assetClassColors['Other'],
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  // Sector allocation
  const sectorMap = {};
  holdingsWithValue.forEach(h => {
    const sector = h.sector || 'unknown';
    sectorMap[sector] = (sectorMap[sector] || 0) + h.currentValue_base;
  });

  const sectorData = Object.entries(sectorMap).map(([sector, value]) => ({
    name: sector === 'unknown' 
      ? 'Unknown (refresh to update)'
      : sector.charAt(0).toUpperCase() + sector.slice(1),
    value,
    color: SECTOR_COLORS[sector] || '#64748b',
  })).sort((a, b) => b.value - a.value);

  // Geography allocation
  const geoMap = {};
  holdingsWithValue.forEach(h => {
    if (h.geography) {
      geoMap[h.geography] = (geoMap[h.geography] || 0) + h.currentValue_base;
    }
  });

  const geoData = Object.entries(geoMap).map(([geo, value]) => ({
    name: geo.toUpperCase(),
    value,
    color: GEO_COLORS[geo] || '#64748b',
    percent: totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0',
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      {/* Asset Class */}
      <NeonCard className="p-5" glowColor="cyan">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Asset Class Allocation</h3>
        </div>
        
        {assetClassFiltered.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetClassFiltered}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {assetClassFiltered.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    trigger="click"
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {assetClassFiltered.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">
                    {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-4">No asset class data available</p>
        )}
      </NeonCard>

      {/* Sector Allocation */}
      {sectorData.length > 0 && (
        <NeonCard className="p-5" glowColor="purple">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Sector Diversification</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  trigger="click"
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      )}

      {/* Geographic Allocation */}
      {geoData.length > 0 && (
        <NeonCard className="p-5" glowColor="teal">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-teal-400" />
            <h3 className="text-white font-semibold">Geographic Exposure</h3>
          </div>
          
          <div className="space-y-3">
            {geoData.map(item => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{item.name}</span>
                  <span className="text-teal-400 font-bold">{item.percent}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${item.percent}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </NeonCard>
      )}
    </div>
  );
}