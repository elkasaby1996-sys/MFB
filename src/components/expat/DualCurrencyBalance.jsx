import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { Home, MapPin } from "lucide-react";
import { formatCurrency, getCurrencyInfo } from '../currency/currencyUtils';

export default function DualCurrencyBalance({ 
  currentCountryBalance, 
  homeCountryBalance,
  currentCurrency,
  homeCurrency,
  baseCurrency 
}) {
  const currentInfo = getCurrencyInfo(currentCurrency);
  const homeInfo = getCurrencyInfo(homeCurrency);
  const total = currentCountryBalance + homeCountryBalance;
  const currentPercent = total > 0 ? (currentCountryBalance / total) * 100 : 50;
  const homePercent = total > 0 ? (homeCountryBalance / total) * 100 : 50;

  return (
    <NeonCard className="p-5" glowColor="cyan">
      <h3 className="text-white font-semibold mb-4">Asset Distribution</h3>

      <div className="space-y-4">
        {/* Current Country */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 text-sm">Current Country</span>
            </div>
            <span className="text-cyan-400 font-bold">
              {currentInfo.flag} {formatCurrency(currentCountryBalance, baseCurrency)}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1">{currentPercent.toFixed(0)}% of total</p>
        </div>

        {/* Home Country */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-green-400" />
              <span className="text-slate-300 text-sm">Home Country</span>
            </div>
            <span className="text-green-400 font-bold">
              {homeInfo.flag} {formatCurrency(homeCountryBalance, baseCurrency)}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: `${homePercent}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1">{homePercent.toFixed(0)}% of total</p>
        </div>
      </div>
    </NeonCard>
  );
}