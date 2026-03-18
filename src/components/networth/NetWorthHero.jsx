import React from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from 'framer-motion';

export default function NetWorthHero({ netWorth, change, changePercent, currency = 'USD' }) {
  const isPositive = netWorth >= 0;
  const changeIsPositive = change >= 0;

  return (
    <NeonCard className="p-6 relative overflow-hidden" glowColor={isPositive ? 'green' : 'pink'}>
      <div className="relative z-10">
        <p className="text-slate-400 text-sm mb-2 text-center">Your Net Worth</p>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <p className={`text-3xl font-bold mb-2 break-all text-center ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatMoney(netWorth, currency)}
          </p>
        </motion.div>

        {change !== undefined && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              changeIsPositive 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {changeIsPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {changeIsPositive ? '+' : ''}{formatMoney(change, currency)}
              </span>
              <span className="text-xs">
                ({changeIsPositive ? '+' : ''}{changePercent?.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}

        <p className="text-slate-500 text-xs text-center">
          Assets – Liabilities = Net Worth
        </p>
      </div>
    </NeonCard>
  );
}