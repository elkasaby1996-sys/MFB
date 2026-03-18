import React, { useMemo } from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

export default function NetWorthChart({ data, currency = 'USD', timeRange, onTimeRangeChange }) {
  // Aggregate data by month — keep the last entry per month
  const monthlyData = useMemo(() => {
    const map = new Map();
    data.forEach(d => {
      const key = format(new Date(d.date), 'yyyy-MM');
      map.set(key, d); // last entry wins
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  const timeRanges = [
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: 'All' },
  ];

  return (
    <NeonCard className="p-5" glowColor="purple">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Net Worth Over Time</h3>
        <div className="flex gap-1">
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange(range.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                timeRange === range.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-400 active:bg-slate-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={(date) => format(new Date(date), 'MMM yyyy')}
                style={{ fontSize: '11px' }}
                interval={0}
              />
              <YAxis 
                stroke="#94a3b8"
                tickFormatter={(value) => formatMoney(value, currency)}
                style={{ fontSize: '11px' }}
                tickCount={4}
                width={70}
              />
              <Tooltip 
                trigger="hover"
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569', 
                  borderRadius: '8px' 
                }}
                labelStyle={{ color: '#ffffff' }}
                itemStyle={{ color: '#ffffff' }}
                formatter={(value) => [formatMoney(value, currency), 'Net Worth']}
                labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
              />
              <Area 
                type="monotone" 
                dataKey="net_worth" 
                stroke="#a855f7" 
                strokeWidth={3}
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No historical data yet</p>
          </div>
        )}
      </div>
    </NeonCard>
  );
}