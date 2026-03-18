import React from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import { format, startOfYear, endOfYear, addYears, subYears, eachMonthOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line } from 'recharts';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import CategoryIcon, { getCategoryByName } from '@/components/ui/CategoryIcon';

export default function YearlyReport({ 
  transactions, 
  budgets, 
  savingsGoals, 
  investments, 
  profile,
  selectedYear,
  onYearChange 
}) {
  const currency = profile?.currency || 'USD';
  const yearStart = startOfYear(selectedYear);
  const yearEnd = endOfYear(selectedYear);

  // Filter transactions for selected year
  const yearTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= yearStart && date <= yearEnd;
  });

  const totalIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;
  const avgMonthlyIncome = totalIncome / 12;
  const avgMonthlyExpenses = totalExpenses / 12;

  // Monthly breakdown
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const monthlyData = months.map(month => {
    const monthTransactions = yearTransactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: format(month, 'MMM'),
      income,
      expenses,
      net: income - expenses
    };
  });

  // Quarterly breakdown
  const quarters = [
    { name: 'Q1', months: [0, 1, 2] },
    { name: 'Q2', months: [3, 4, 5] },
    { name: 'Q3', months: [6, 7, 8] },
    { name: 'Q4', months: [9, 10, 11] }
  ];

  const quarterlyData = quarters.map(quarter => {
    const quarterTransactions = yearTransactions.filter(t => {
      const month = new Date(t.date).getMonth();
      return quarter.months.includes(month);
    });

    const income = quarterTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = quarterTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      quarter: quarter.name,
      income,
      expenses,
      net: income - expenses
    };
  });

  // Category totals
  const categoryTotals = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

  // Savings & Investments
  const totalSavings = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalInvestments = investments.reduce((sum, i) => sum + i.current_value, 0);
  const totalInvested = investments.reduce((sum, i) => sum + i.amount_invested, 0);
  const investmentReturn = totalInvestments - totalInvested;
  const returnPercentage = totalInvested > 0 ? ((investmentReturn / totalInvested) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Year Selector */}
      <NeonCard className="p-4" glowColor="purple">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onYearChange(subYears(selectedYear, 1))}
            className="p-2 rounded-xl bg-slate-800/50 text-cyan-400 active:bg-slate-700 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-white font-bold text-lg">
            {format(selectedYear, 'yyyy')}
          </h2>
          <button
            onClick={() => onYearChange(addYears(selectedYear, 1))}
            className="p-2 rounded-xl bg-slate-800/50 text-cyan-400 active:bg-slate-700 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </NeonCard>

      {/* Annual Summary */}
      <NeonCard className="p-5" glowColor="cyan">
        <h3 className="text-white font-semibold mb-4">Annual Summary</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-xs mb-1">Total Income</p>
              <p className="text-green-400 font-bold text-lg">{formatMoney(totalIncome, currency)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Avg Monthly Income</p>
              <p className="text-green-400 font-semibold">{formatMoney(avgMonthlyIncome, currency)}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-xs mb-1">Total Expenses</p>
              <p className="text-red-400 font-bold text-lg">{formatMoney(totalExpenses, currency)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Avg Monthly Expenses</p>
              <p className="text-red-400 font-semibold">{formatMoney(avgMonthlyExpenses, currency)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Net Cash Flow</span>
            <span className={`font-bold text-lg ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatMoney(netCashFlow, currency)}
            </span>
          </div>
        </div>
      </NeonCard>

      {/* Monthly Trend */}
      <NeonCard className="p-5" glowColor="purple">
        <h3 className="text-white font-semibold mb-4">Monthly Trend</h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value) => formatMoney(value, currency)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </NeonCard>

      {/* Quarterly Breakdown */}
      <NeonCard className="p-5" glowColor="pink">
        <h3 className="text-white font-semibold mb-4">Quarterly Performance</h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <XAxis 
                dataKey="quarter" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value) => formatMoney(value, currency)}
              />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </NeonCard>

      {/* Top Spending Categories */}
      <NeonCard className="p-5" glowColor="teal">
        <h3 className="text-white font-semibold mb-4">Top Spending</h3>
        <div className="space-y-3">
          {topCategories.map(([category, amount]) => {
            const cat = getCategoryByName(category);
            const percentage = (amount / totalExpenses) * 100;
            
            return (
              <div key={category} className="flex items-center gap-3">
                <CategoryIcon category={cat} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-sm mb-1 gap-2">
                    <span className="text-white truncate">{category}</span>
                    <span className="text-slate-400 whitespace-nowrap">{formatMoney(amount, currency)}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </NeonCard>

      {/* Savings & Investments */}
      <NeonCard className="p-5" glowColor="cyan">
        <h3 className="text-white font-semibold mb-4">Savings & Investments</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Total Savings</p>
            <p className="text-cyan-400 font-bold text-lg">{formatMoney(totalSavings, currency)}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Total Invested</p>
            <p className="text-purple-400 font-bold text-lg">{formatMoney(totalInvested, currency)}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Investment Value</p>
            <p className="text-purple-400 font-bold text-lg">{formatMoney(totalInvestments, currency)}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Return</p>
            <p className={`font-bold text-lg ${investmentReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </NeonCard>
    </div>
  );
}