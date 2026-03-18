import React from 'react';
import StatCard from '@/components/ui/StatCard';
import NeonCard from '@/components/ui/NeonCard';
import { Heart, TrendingUp, Percent } from "lucide-react";
import { formatCurrency } from '../currency/currencyUtils';

export default function GivingOverview({ 
  monthTotal, 
  yearTotal, 
  percentOfIncome,
  currency 
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="This Month"
          value={formatCurrency(monthTotal, currency)}
          icon={Heart}
          color="green"
        />
        <StatCard
          label="This Year"
          value={formatCurrency(yearTotal, currency)}
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          label="% of Income"
          value={`${percentOfIncome.toFixed(1)}%`}
          icon={Percent}
          color="purple"
        />
      </div>

      <NeonCard className="p-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-green-400 font-medium text-sm">
              You've given {percentOfIncome.toFixed(1)}% of your income this year 💚
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Every bit of kindness counts
            </p>
          </div>
        </div>
      </NeonCard>
    </div>
  );
}