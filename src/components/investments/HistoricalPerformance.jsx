import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { subMonths, subYears, format, eachMonthOfInterval } from 'date-fns';

const TIMEFRAMES = [
  { label: '1M', value: '1M', months: 1 },
  { label: '6M', value: '6M', months: 6 },
  { label: '1Y', value: '1Y', months: 12 },
  { label: '5Y', value: '5Y', months: 60 },
  { label: 'Max', value: 'Max', months: 120 },
];

export default function HistoricalPerformance({ investments, currency = 'USD' }) {
  const [timeframe, setTimeframe] = useState('1Y');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Generate historical data (mock for now - would use real historical data)
  const generateHistoricalData = () => {
    const tf = TIMEFRAMES.find(t => t.value === timeframe);
    const now = new Date();
    const startDate = subMonths(now, tf.months);
    
    const months = eachMonthOfInterval({ start: startDate, end: now });
    
    const totalInvested = investments.reduce((sum, i) => sum + (parseFloat(i.amount_invested) || 0), 0);
    const totalValue = investments.reduce((sum, i) => sum + (parseFloat(i.current_value) || parseFloat(i.amount_invested) || 0), 0);
    const totalGain = totalValue - totalInvested;
    
    // Simulate historical growth
    return months.map((month, index) => {
      const progress = index / months.length;
      const monthValue = totalInvested + (totalGain * progress);
      
      return {
        month: format(month, 'MMM yy'),
        value: monthValue,
        invested: totalInvested * (0.8 + progress * 0.2), // Simulate gradual investment
      };
    });
  };

  const historicalData = generateHistoricalData();
  const currentValue = historicalData[historicalData.length - 1]?.value || 0;
  const startValue = historicalData[0]?.value || 0;
  const periodGain = currentValue - startValue;
  const periodGainPercent = startValue > 0 ? ((periodGain / startValue) * 100) : 0;

  return (
    <NeonCard className="p-4 overflow-hidden" glowColor="cyan">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">Historical Performance</h3>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-xl p-1">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeframe === tf.value 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'text-slate-400'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Period Gain</p>
          <p className={`font-bold text-lg ${periodGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {periodGain >= 0 ? '+' : ''}{formatCurrency(periodGain)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Return</p>
          <p className={`font-bold text-lg ${periodGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {periodGainPercent >= 0 ? '+' : ''}{periodGainPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historicalData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              trigger="click"
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
              itemStyle={{ color: '#ffffff' }}
              labelStyle={{ color: '#ffffff' }}
              formatter={(value) => formatCurrency(value)}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#06b6d4" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              name="Portfolio Value"
            />
            <Area 
              type="monotone" 
              dataKey="invested" 
              stroke="#64748b" 
              strokeWidth={1}
              strokeDasharray="5 5"
              fillOpacity={0} 
              name="Invested"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </NeonCard>
  );
}