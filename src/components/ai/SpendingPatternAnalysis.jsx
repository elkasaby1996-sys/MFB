import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpendingPatternAnalysis({ transactions, profile }) {
  const [period, setPeriod] = useState('monthly'); // monthly or yearly
  const currency = profile?.currency || 'USD';

  // Calculate spending by month
  const getMonthlyData = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && 
               tDate.getFullYear() === date.getFullYear() &&
               t.type === 'expense';
      });
      
      const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: total,
        fullDate: date
      });
    }
    
    return months;
  };

  const data = getMonthlyData();
  const avgSpending = data.reduce((sum, d) => sum + d.amount, 0) / data.length;
  const currentMonth = data[data.length - 1]?.amount || 0;
  const lastMonth = data[data.length - 2]?.amount || 0;
  const trend = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

  // AI Commentary
  const getCommentary = () => {
    if (trend > 15) {
      return {
        text: `Your spending increased by ${trend.toFixed(0)}% this month. Consider reviewing your recent expenses to identify areas to cut back.`,
        icon: TrendingUp,
        color: 'text-red-400'
      };
    } else if (trend < -15) {
      return {
        text: `Great job! Your spending decreased by ${Math.abs(trend).toFixed(0)}% this month. Keep up the momentum!`,
        icon: TrendingDown,
        color: 'text-green-400'
      };
    } else {
      return {
        text: `Your spending is relatively stable. Your monthly average is ${currency} ${avgSpending.toFixed(0)}.`,
        icon: Calendar,
        color: 'text-cyan-400'
      };
    }
  };

  const commentary = getCommentary();
  const CommentaryIcon = commentary.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Spending Pattern</h3>
        <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              period === 'monthly'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400'
            }`}
          >
            6 Months
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.amount > avgSpending ? '#ef4444' : '#06b6d4'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Commentary */}
      <div className="flex gap-2 bg-slate-900/50 rounded-lg p-3">
        <CommentaryIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${commentary.color}`} />
        <div className="flex-1">
          <p className="text-xs text-slate-300 leading-relaxed">{commentary.text}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[10px] text-slate-400 mb-0.5">This Month</p>
          <p className="text-sm font-semibold text-white">{currency} {currentMonth.toFixed(0)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[10px] text-slate-400 mb-0.5">6-Month Avg</p>
          <p className="text-sm font-semibold text-white">{currency} {avgSpending.toFixed(0)}</p>
        </div>
      </div>
    </motion.div>
  );
}