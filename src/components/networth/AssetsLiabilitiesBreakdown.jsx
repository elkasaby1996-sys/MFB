import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";

export default function AssetsLiabilitiesBreakdown({ 
  assets, 
  liabilities, 
  currency = 'USD' 
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);

  const ASSET_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];
  const LIABILITY_COLORS = ['#ef4444', '#ec4899', '#f97316', '#dc2626'];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Assets */}
      <NeonCard className="p-5" glowColor="cyan">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Assets</h3>
        </div>

        <div className="mb-4">
          <p className="text-slate-400 text-sm">Total Assets</p>
          <p className="text-cyan-400 font-bold text-2xl">{formatCurrency(totalAssets)}</p>
        </div>

        {assets.length > 0 ? (
          <>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assets}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    nameKey="name"
                  >
                    {assets.map((entry, index) => (
                      <Cell key={index} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569', 
                      borderRadius: '8px' 
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {assets.map((asset, index) => {
                const percentage = totalAssets > 0 ? (asset.value / totalAssets) * 100 : 0;
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: ASSET_COLORS[index % ASSET_COLORS.length] }}
                      />
                      <span className="text-slate-300">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(asset.value)}</p>
                      <p className="text-slate-500 text-xs">{percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No assets tracked yet</p>
          </div>
        )}
      </NeonCard>

      {/* Liabilities */}
      <NeonCard className="p-5" glowColor="pink">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-pink-400" />
          <h3 className="text-white font-semibold">Liabilities</h3>
        </div>

        <div className="mb-4">
          <p className="text-slate-400 text-sm">Total Liabilities</p>
          <p className="text-red-400 font-bold text-2xl">{formatCurrency(totalLiabilities)}</p>
        </div>

        {liabilities.length > 0 ? (
          <>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={liabilities}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    nameKey="name"
                  >
                    {liabilities.map((entry, index) => (
                      <Cell key={index} fill={LIABILITY_COLORS[index % LIABILITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569', 
                      borderRadius: '8px' 
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {liabilities.map((liability, index) => {
                const percentage = totalLiabilities > 0 ? (liability.value / totalLiabilities) * 100 : 0;
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: LIABILITY_COLORS[index % LIABILITY_COLORS.length] }}
                      />
                      <span className="text-slate-300">{liability.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(liability.value)}</p>
                      <p className="text-slate-500 text-xs">{percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No liabilities tracked</p>
          </div>
        )}
      </NeonCard>
    </div>
  );
}