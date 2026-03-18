import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import SubPageHeader from '@/components/layout/SubPageHeader';
import NeonCard from '@/components/ui/NeonCard';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { formatMoney } from '@/components/utils/formatMoney';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, startOfYear, endOfYear
} from 'date-fns';

export default function CashFlow() {
  const [period, setPeriod] = useState('6m'); // 3m, 6m, 1y

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];
  const currency = profile?.currency || 'USD';

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const months = useMemo(() => {
    const now = new Date();
    const monthCount = period === '3m' ? 3 : period === '6m' ? 6 : 12;
    const start = startOfMonth(subMonths(now, monthCount - 1));
    const end = endOfMonth(now);
    return eachMonthOfInterval({ start, end });
  }, [period]);

  const monthlyData = useMemo(() => {
    return months.map(monthDate => {
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
      const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
      const netFlow = income - expenses;
      return {
        month: format(monthDate, 'MMM'),
        income: Math.round(income),
        expenses: Math.round(expenses),
        netFlow: Math.round(netFlow),
      };
    });
  }, [months, transactions]);

  // Current month stats
  const now = new Date();
  const thisMonthData = monthlyData[monthlyData.length - 1] || { income: 0, expenses: 0, netFlow: 0 };
  const lastMonthData = monthlyData[monthlyData.length - 2] || { income: 0, expenses: 0, netFlow: 0 };

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const totalNet = totalIncome - totalExpenses;

  const netChange = lastMonthData.netFlow !== 0
    ? ((thisMonthData.netFlow - lastMonthData.netFlow) / Math.abs(lastMonthData.netFlow)) * 100
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-lg">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
            {p.name}: {formatMoney(p.value, currency, { decimals: 0 })}
          </p>
        ))}
      </div>
    );
  };

  return (
    <SpaceBackground>
      <SubPageHeader title="Cash Flow" backLabel="Back" />
      <main className="pb-28 px-4">
        <div className="max-w-lg mx-auto space-y-4 py-4">

          {/* Period Selector */}
          <div className="flex gap-2">
            {[['3m', '3 Months'], ['6m', '6 Months'], ['1y', '1 Year']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  period === val
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <NeonCard className="p-3 text-center" glowColor="green">
              <p className="text-slate-400 text-xs mb-1">Income</p>
              <p className="text-green-400 font-bold text-sm">{formatMoney(totalIncome, currency, { decimals: 0 })}</p>
            </NeonCard>
            <NeonCard className="p-3 text-center" glowColor="pink">
              <p className="text-slate-400 text-xs mb-1">Expenses</p>
              <p className="text-red-400 font-bold text-sm">{formatMoney(totalExpenses, currency, { decimals: 0 })}</p>
            </NeonCard>
            <NeonCard className="p-3 text-center" glowColor={totalNet >= 0 ? 'cyan' : 'pink'}>
              <p className="text-slate-400 text-xs mb-1">Net Flow</p>
              <p className={`font-bold text-sm ${totalNet >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {totalNet >= 0 ? '+' : ''}{formatMoney(totalNet, currency, { decimals: 0 })}
              </p>
            </NeonCard>
          </div>

          {/* This Month Net Flow */}
          <NeonCard className="p-5" glowColor={thisMonthData.netFlow >= 0 ? 'cyan' : 'pink'}>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpDown className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-semibold">This Month Net Flow</h3>
            </div>
            <div className="flex items-end justify-between">
              <p className={`text-3xl font-bold ${thisMonthData.netFlow >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {thisMonthData.netFlow >= 0 ? '+' : ''}{formatMoney(thisMonthData.netFlow, currency, { decimals: 0 })}
              </p>
              {lastMonthData.netFlow !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${netChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {netChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="text-xs font-semibold">{netChange >= 0 ? '+' : ''}{Math.round(netChange)}%</span>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-2">
              {formatMoney(thisMonthData.income, currency, { decimals: 0 })} income — {formatMoney(thisMonthData.expenses, currency, { decimals: 0 })} expenses
            </p>
          </NeonCard>

          {/* Income vs Expenses Chart */}
          <NeonCard className="p-5" glowColor="cyan">
            <h3 className="text-white font-semibold mb-4">Income vs Expenses</h3>
            {monthlyData.every(m => m.income === 0 && m.expenses === 0) ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No transactions in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatMoney(v, currency, { decimals: 0 }).replace(/[^0-9KMBk,.]/g, '') + (v >= 1000 ? 'k' : '')} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </NeonCard>

          {/* Net Flow Trend */}
          <NeonCard className="p-5" glowColor="teal">
            <h3 className="text-white font-semibold mb-4">Net Flow Trend</h3>
            {monthlyData.every(m => m.netFlow === 0) ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="netFlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => (v >= 0 ? '+' : '') + Math.round(v / 1000) + 'k'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="netFlow"
                    name="Net Flow"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#netFlowGradient)"
                    dot={{ fill: '#06b6d4', r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </NeonCard>

          {/* Monthly Breakdown Table */}
          <NeonCard className="p-5" glowColor="purple">
            <h3 className="text-white font-semibold mb-4">Monthly Breakdown</h3>
            <div className="space-y-2">
              {[...monthlyData].reverse().map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                  <p className="text-slate-400 text-sm w-10">{m.month}</p>
                  <p className="text-green-400 text-sm font-medium w-20 text-right">{formatMoney(m.income, currency, { decimals: 0 })}</p>
                  <p className="text-red-400 text-sm font-medium w-20 text-right">{formatMoney(m.expenses, currency, { decimals: 0 })}</p>
                  <p className={`text-sm font-bold w-20 text-right ${m.netFlow >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                    {m.netFlow >= 0 ? '+' : ''}{formatMoney(m.netFlow, currency, { decimals: 0 })}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <p className="text-white text-sm font-semibold w-10">Total</p>
                <p className="text-green-400 text-sm font-bold w-20 text-right">{formatMoney(totalIncome, currency, { decimals: 0 })}</p>
                <p className="text-red-400 text-sm font-bold w-20 text-right">{formatMoney(totalExpenses, currency, { decimals: 0 })}</p>
                <p className={`text-sm font-bold w-20 text-right ${totalNet >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                  {totalNet >= 0 ? '+' : ''}{formatMoney(totalNet, currency, { decimals: 0 })}
                </p>
              </div>
            </div>
          </NeonCard>

        </div>
      </main>
      <BottomNav currentPage="CashFlow" />
    </SpaceBackground>
  );
}