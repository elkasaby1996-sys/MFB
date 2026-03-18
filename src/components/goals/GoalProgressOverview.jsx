import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

export default function GoalProgressOverview({ goals, currency = 'USD' }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const chartData = goals.map(goal => ({
    name: goal.name.length > 15 ? goal.name.substring(0, 12) + '...' : goal.name,
    progress: (((parseFloat(goal.current_amount) || 0) / (parseFloat(goal.target_amount) || 1)) * 100).toFixed(0),
    current: parseFloat(goal.current_amount) || 0,
    target: parseFloat(goal.target_amount) || 0,
  }));

  return (
    <NeonCard className="p-5" glowColor="teal">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-teal-400" />
        <h3 className="text-white font-semibold">Progress Overview</h3>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 500 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 500 }}
              width={80}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155', 
                borderRadius: '8px',
                color: '#ffffff'
              }}
              formatter={(value, name) => {
                if (name === 'progress') return [`${value}%`, 'Progress'];
                return [formatCurrency(value), name];
              }}
              labelStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
              itemStyle={{ color: '#ffffff' }}
            />
            <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-slate-400 text-xs mb-1">Total Goals</p>
          <p className="text-white font-bold text-lg">{goals.length}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">In Progress</p>
          <p className="text-cyan-400 font-bold text-lg">
            {goals.filter(g => {
              const current = parseFloat(g.current_amount) || 0;
              const target = parseFloat(g.target_amount) || 0;
              return current > 0 && current < target;
            }).length}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-1">Achieved</p>
          <p className="text-green-400 font-bold text-lg">
            {goals.filter(g => (parseFloat(g.current_amount) || 0) >= (parseFloat(g.target_amount) || 0)).length}
          </p>
        </div>
      </div>
    </NeonCard>
  );
}