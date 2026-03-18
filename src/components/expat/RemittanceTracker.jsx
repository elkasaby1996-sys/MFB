import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { SendHorizontal, TrendingUp } from "lucide-react";
import { formatCurrency, getCurrencyInfo } from '../currency/currencyUtils';

export default function RemittanceTracker({ 
  monthTotal, 
  yearTotal, 
  monthGoal,
  baseCurrency,
  homeCurrency 
}) {
  const baseCurrencyInfo = getCurrencyInfo(baseCurrency);
  const homeCurrencyInfo = getCurrencyInfo(homeCurrency);

  return (
    <NeonCard className="p-5" glowColor="green">
      <div className="flex items-center gap-2 mb-4">
        <SendHorizontal className="w-5 h-5 text-green-400" />
        <h3 className="text-white font-semibold">Remittance Tracker</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">This Month</span>
            <span className="text-green-400 font-bold">
              {baseCurrencyInfo.flag} {formatCurrency(monthTotal, baseCurrency)}
            </span>
          </div>
          {monthGoal && monthGoal > 0 && (
            <NeonProgress 
              value={monthTotal} 
              max={monthGoal} 
              color="green"
              showLabel={false}
            />
          )}
        </div>

        <div className="pt-3 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm">Year Total</span>
            </div>
            <span className="text-white font-bold">
              {baseCurrencyInfo.flag} {formatCurrency(yearTotal, baseCurrency)}
            </span>
          </div>
        </div>

        <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
          <p className="text-green-400 text-xs">
            💚 Supporting family back home
          </p>
        </div>
      </div>
    </NeonCard>
  );
}