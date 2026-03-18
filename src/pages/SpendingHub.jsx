import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import ScreenScrollContainer from '@/components/layout/ScreenScrollContainer';
import NeonCard from '@/components/ui/NeonCard';
import CategoryIcon, { getCategoryByName } from '@/components/ui/CategoryIcon';
import { Receipt, Calendar, ChevronRight, TrendingDown, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function SpendingHub() {
  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 100),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const currency = profile?.currency || 'USD';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  };

  // Calculate this month's spending
  const { thisMonthSpent, lastMonthSpent, percentageChange, moneyLeft, categoryBreakdown } = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonth = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date >= thisMonthStart && date <= thisMonthEnd;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const lastMonth = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Calculate this month's income
    const thisMonthIncome = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date >= thisMonthStart && date <= thisMonthEnd;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const remaining = thisMonthIncome - thisMonth;

    // Category breakdown
    const categoryTotals = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date >= thisMonthStart && date <= thisMonthEnd;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4);

    return {
      thisMonthSpent: thisMonth,
      lastMonthSpent: lastMonth,
      percentageChange: change,
      moneyLeft: remaining,
      categoryBreakdown: sortedCategories
    };
  }, [transactions]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .slice(0, 5);
  }, [transactions]);

  const sections = [
    {
      title: 'Spending',
      items: [
        {
          name: 'Spending Log',
          description: 'View all your transactions',
          icon: Receipt,
          color: 'cyan',
          page: 'SpendingLog'
        },
        {
          name: 'Spending Calendar',
          description: 'Calendar view of expenses',
          icon: Calendar,
          color: 'purple',
          page: 'SpendingCalendar'
        },
      ]
    }
  ];

  return (
    <SpaceBackground>
      <ScreenScrollContainer>
      <div className="max-w-lg mx-auto space-y-4 py-6">
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Spending</h1>
            <p className="text-slate-400">Track and analyze your expenses</p>
          </div>

          {/* Top Summary Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <NeonCard className="p-4" glowColor="cyan">
              <div className="grid grid-cols-3 gap-3">
                {/* This Month */}
                <div className="text-center">
                  <p className="text-slate-400 text-xs mb-1">💸 This Month</p>
                  <p className={`text-white font-bold ${formatCurrency(thisMonthSpent).length > 10 ? 'text-sm' : formatCurrency(thisMonthSpent).length > 8 ? 'text-base' : 'text-xl'}`}>
                    {formatCurrency(thisMonthSpent)}
                  </p>
                </div>

                {/* Last Month */}
                <div className="text-center border-x border-slate-700/50">
                  <p className="text-slate-400 text-xs mb-1">📉 Last Month</p>
                  <p className={`text-white font-bold ${formatCurrency(lastMonthSpent).length > 10 ? 'text-sm' : formatCurrency(lastMonthSpent).length > 8 ? 'text-base' : 'text-xl'}`}>
                    {formatCurrency(lastMonthSpent)}
                  </p>
                </div>

                {/* Money Left */}
                <div className="text-center">
                  <p className="text-slate-400 text-xs mb-1">💰 Money Left</p>
                  <p className={`font-bold ${moneyLeft >= 0 ? 'text-teal-400' : 'text-red-400'} ${formatCurrency(Math.abs(moneyLeft)).length > 10 ? 'text-sm' : formatCurrency(Math.abs(moneyLeft)).length > 8 ? 'text-base' : 'text-xl'}`}>
                    {formatCurrency(Math.abs(moneyLeft))}
                  </p>
                </div>
              </div>
            </NeonCard>
          </motion.div>

          {/* Mini Chart Preview - Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to={createPageUrl("Reports")}>
              <NeonCard className="p-4 cursor-pointer active:scale-[0.98] transition-all" glowColor="purple">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">📊 Spending Overview</h3>
                  <div className="flex items-center gap-1 text-purple-400 text-xs">
                    Tap to view full report <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
                
                {categoryBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {categoryBreakdown.map(([category, amount]) => {
                      const cat = getCategoryByName(category);
                      const percentage = thisMonthSpent > 0 ? (amount / thisMonthSpent) * 100 : 0;
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat.icon}</span>
                              <span className="text-slate-300">{category}</span>
                            </div>
                            <span className="text-white font-semibold">{formatCurrency(amount)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm text-center py-4">No spending data yet</p>
                )}
              </NeonCard>
            </Link>
          </motion.div>

          {/* Recent Spending Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <NeonCard className="p-4" glowColor="cyan">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Recent Spending</h3>
                <Link to={createPageUrl("SpendingLog")} className="text-cyan-400 text-sm flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              {recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {recentTransactions.map(tx => {
                    const cat = getCategoryByName(tx.category);
                    return (
                      <div 
                        key={tx.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {tx.merchant || tx.category}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {format(new Date(tx.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <p className="text-white font-semibold">
                          −{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-4">No recent transactions</p>
              )}
            </NeonCard>
          </motion.div>

          {/* Navigation Links Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">
              Explore
            </h2>
            <div className="space-y-3">
              {sections.map((section) => (
                section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} to={createPageUrl(item.page)}>
                      <NeonCard 
                        className="p-4 cursor-pointer active:scale-[0.98] transition-all duration-200" 
                        glowColor={item.color}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/20 flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 text-${item.color}-400`} />
                            </div>
                            <div>
                              <p className="text-white font-semibold">{item.name}</p>
                              <p className="text-slate-400 text-sm">{item.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </NeonCard>
                    </Link>
                  );
                })
              ))}
            </div>
          </motion.div>

      </div>
      </ScreenScrollContainer>

      <BottomNav currentPage="SpendingHub" />
    </SpaceBackground>
  );
}