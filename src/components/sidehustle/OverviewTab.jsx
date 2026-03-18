import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import StatCard from '@/components/ui/StatCard';
import { DollarSign, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function OverviewTab({ 
  monthIncome, 
  monthExpenses, 
  ytdIncome, 
  ytdExpenses,
  monthlyProfit,
  currency = 'USD' 
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const monthProfit = monthIncome - monthExpenses;
  const ytdProfit = ytdIncome - ytdExpenses;
  const profitMargin = monthIncome > 0 ? (monthProfit / monthIncome) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* This Month Stats */}
      <div>
        <h3 className="text-white font-semibold mb-3">This Month</h3>
        <div className="grid grid-cols-3 gap-2">
          <NeonCard glowColor="green" className="p-3 flex flex-col items-center text-center gap-1">
            <div className="p-2 rounded-xl bg-green-500/10">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-slate-400 text-xs">Income</p>
            <p className="text-green-400 font-bold text-sm leading-tight">{formatCurrency(monthIncome)}</p>
          </NeonCard>
          <NeonCard glowColor="pink" className="p-3 flex flex-col items-center text-center gap-1">
            <div className="p-2 rounded-xl bg-pink-500/10">
              <Wallet className="w-4 h-4 text-pink-400" />
            </div>
            <p className="text-slate-400 text-xs">Expenses</p>
            <p className="text-pink-400 font-bold text-sm leading-tight">{formatCurrency(monthExpenses)}</p>
          </NeonCard>
          <NeonCard glowColor={monthProfit >= 0 ? "cyan" : "red"} className="p-3 flex flex-col items-center text-center gap-1">
            <div className={`p-2 rounded-xl ${monthProfit >= 0 ? 'bg-cyan-500/10' : 'bg-red-500/10'}`}>
              <TrendingUp className={`w-4 h-4 ${monthProfit >= 0 ? 'text-cyan-400' : 'text-red-400'}`} />
            </div>
            <p className="text-slate-400 text-xs">Profit</p>
            <p className={`font-bold text-sm leading-tight ${monthProfit >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{formatCurrency(monthProfit)}</p>
          </NeonCard>
        </div>
      </div>

      {/* YTD Stats */}
      <div>
        <h3 className="text-white font-semibold mb-3">Year to Date</h3>
        <div className="grid grid-cols-3 gap-3">
          <NeonCard className="p-4" glowColor="green">
            <p className="text-slate-400 text-xs mb-1">Income YTD</p>
            <p className="text-green-400 font-bold text-lg">{formatCurrency(ytdIncome)}</p>
          </NeonCard>
          <NeonCard className="p-4" glowColor="pink">
            <p className="text-slate-400 text-xs mb-1">Expenses YTD</p>
            <p className="text-red-400 font-bold text-lg">{formatCurrency(ytdExpenses)}</p>
          </NeonCard>
          <NeonCard className="p-4" glowColor="cyan">
            <p className="text-slate-400 text-xs mb-1">Profit YTD</p>
            <p className={`font-bold text-lg ${ytdProfit >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {formatCurrency(ytdProfit)}
            </p>
          </NeonCard>
        </div>
      </div>

      {/* Profit Chart */}
      <NeonCard className="p-5" glowColor="purple">
        <h3 className="text-white font-semibold mb-4">Monthly Profit Trend</h3>
        <div className="h-48">
          {monthlyProfit.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyProfit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8"
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tickFormatter={(v) => formatCurrency(v)}
                  style={{ fontSize: '11px' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  formatter={(value) => [formatCurrency(value), 'Profit']}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
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

      {/* Profit Insight */}
      <NeonCard className="p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-green-500/30" glowColor="green">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-green-400 font-medium text-sm mb-1">Profit Insight</p>
            <p className="text-white text-sm mb-2">
              You're at <strong>{profitMargin.toFixed(0)}%</strong> profit margin this month 💼
            </p>
            {profitMargin > 0 && (
              <p className="text-slate-400 text-xs">
                💡 Consider setting aside ~20% for taxes: {formatCurrency(monthProfit * 0.2)}
              </p>
            )}
          </div>
        </div>
      </NeonCard>
    </div>
  );
}