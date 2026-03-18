import React from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import CategoryIcon, { getCategoryByName } from '@/components/ui/CategoryIcon';

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

export default function MonthlyReport({ 
  transactions, 
  budgets, 
  savingsGoals, 
  investments, 
  profile,
  selectedMonth,
  onMonthChange 
}) {
  const currency = profile?.currency || 'USD';
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Filter transactions for selected month
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = income - expenses;
  const savingsRate = income > 0 ? ((netCashFlow / income) * 100) : 0;

  // Category breakdown
  const categoryBreakdown = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const categoryData = Object.entries(categoryBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

  // Budget performance
  const currentMonth = selectedMonth.getMonth() + 1;
  const currentYear = selectedMonth.getFullYear();
  const monthBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);

  const budgetPerformance = monthBudgets.map(budget => {
    const spent = categoryBreakdown[budget.category] || 0;
    const percentage = (spent / budget.amount) * 100;
    return {
      category: budget.category,
      budget: budget.amount,
      spent,
      percentage,
      status: percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
    };
  });

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <NeonCard className="p-4" glowColor="purple">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
            className="p-2 rounded-xl bg-slate-800/50 text-cyan-400 active:bg-slate-700 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-white font-bold text-lg">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
            className="p-2 rounded-xl bg-slate-800/50 text-cyan-400 active:bg-slate-700 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </NeonCard>

      {/* Summary */}
      <NeonCard className="p-5" glowColor="cyan">
        <h3 className="text-white font-semibold mb-4">Financial Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-slate-700">
            <span className="text-slate-400 text-sm">Total Income</span>
            <span className="text-green-400 font-semibold">{formatMoney(income, currency)}</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-700">
            <span className="text-slate-400 text-sm">Total Expenses</span>
            <span className="text-red-400 font-semibold">{formatMoney(expenses, currency)}</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-700">
            <span className="text-slate-400 text-sm">Net Cash Flow</span>
            <span className={`font-semibold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatMoney(netCashFlow, currency)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Savings Rate</span>
            <span className="text-cyan-400 font-semibold">{savingsRate.toFixed(1)}%</span>
          </div>
        </div>
      </NeonCard>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <NeonCard className="p-5" glowColor="purple">
          <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
          
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff' }}
                  formatter={(value) => formatMoney(value, currency)}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {categoryData.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-white font-semibold">{formatMoney(item.value, currency)}</span>
              </div>
            ))}
          </div>
        </NeonCard>
      )}

      {/* Top Spending Categories */}
      {topCategories.length > 0 && (
        <NeonCard className="p-5" glowColor="teal">
          <h3 className="text-white font-semibold mb-4">Top Spending</h3>
          <div className="space-y-3">
            {topCategories.map(([category, amount]) => {
              const cat = getCategoryByName(category);
              const budget = monthBudgets.find(b => 
                b.category?.toLowerCase() === category?.toLowerCase()
              );
              
              return (
                <div key={category} className="flex items-center gap-3">
                  <CategoryIcon category={cat} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-sm mb-1 gap-2">
                      <span className="text-white truncate">{category}</span>
                      <span className="text-slate-400 whitespace-nowrap">{formatMoney(amount, currency)}</span>
                    </div>
                    {budget && (
                      <NeonProgress 
                        value={amount} 
                        max={budget.amount}
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </NeonCard>
      )}

      {/* Budget Performance */}
      {budgetPerformance.length > 0 && (
        <NeonCard className="p-5" glowColor="pink">
          <h3 className="text-white font-semibold mb-4">Budget Performance</h3>
          
          <div className="space-y-3">
            {budgetPerformance.map(item => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.category}</span>
                  <span className={`font-semibold ${
                    item.status === 'over' ? 'text-red-400' :
                    item.status === 'warning' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {formatMoney(item.spent, currency)} / {formatMoney(item.budget, currency)}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      item.status === 'over' ? 'bg-red-500' :
                      item.status === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </NeonCard>
      )}
    </div>
  );
}