import React from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import NeonCard from '../ui/NeonCard';

export default function BudgetTrendChart({ budgets, transactions, months = 6, currency = 'USD' }) {
  // Generate last N months
  const now = new Date();
  const monthsData = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const monthBudgets = budgets.filter(b => b.month === month && b.year === year);
    const totalBudget = monthBudgets.reduce((sum, b) => sum + (b.amount || 0) + (b.rollover_amount || 0), 0);
    
    const monthExpenses = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && 
        tDate.getMonth() + 1 === month && 
        tDate.getFullYear() === year;
    });
    const totalSpent = monthExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    monthsData.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      budget: totalBudget,
      spent: totalSpent,
      difference: totalBudget - totalSpent,
    });
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{payload[0].payload.month}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatMoney(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <NeonCard className="p-4 sm:p-5" glowColor="cyan">
      <h3 className="text-white font-semibold mb-4">Budget vs Actual Spending</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={monthsData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="month" 
            stroke="#94a3b8" 
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#94a3b8" 
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => formatMoney(value, currency)}
          />
          <Tooltip trigger="click" content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
          />
          <Bar dataKey="budget" fill="#a855f7" name="Budget" radius={[8, 8, 0, 0]} />
          <Bar dataKey="spent" fill="#06b6d4" name="Spent" radius={[8, 8, 0, 0]} />
          <Line 
            type="monotone" 
            dataKey="difference" 
            stroke="#22c55e" 
            strokeWidth={2}
            name="Difference"
            dot={{ fill: '#22c55e', r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </NeonCard>
  );
}