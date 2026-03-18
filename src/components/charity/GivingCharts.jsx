import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../currency/currencyUtils';

const CATEGORY_COLORS = {
  charity: '#10b981',
  family_support: '#06b6d4',
  community: '#a855f7',
  religious: '#f59e0b',
  other: '#64748b',
};

export default function GivingCharts({ monthlyData, categoryData, currency }) {
  return (
    <div className="space-y-4">
      {/* Monthly Trend */}
      <NeonCard className="p-5" glowColor="green">
        <h3 className="text-white font-semibold mb-4">Giving Over Time</h3>
        <div className="h-48">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8"
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tickFormatter={(v) => formatCurrency(v, currency)}
                  style={{ fontSize: '11px' }}
                />
                <Tooltip 
                  trigger="click"
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value) => [formatCurrency(value, currency), 'Given']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-sm">No data yet</p>
            </div>
          )}
        </div>
      </NeonCard>

      {/* Category Breakdown */}
      <NeonCard className="p-5" glowColor="purple">
        <h3 className="text-white font-semibold mb-4">Giving by Category</h3>
        <div className="h-64">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip 
                  trigger="click"
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value) => formatCurrency(value, currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-sm">No data yet</p>
            </div>
          )}
        </div>
      </NeonCard>
    </div>
  );
}