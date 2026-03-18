import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import { Home, Lightbulb, Droplet, Flame, Wifi, ShoppingCart, Wrench, DollarSign, Calendar, AlertCircle, TrendingUp, FileText } from "lucide-react";
import SubPageHeader from '@/components/layout/SubPageHeader';
import PaywallGate from '@/components/subscription/PaywallGate';
import { format, startOfMonth, endOfMonth, differenceInDays, isWithinInterval, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const HOME_CATEGORIES = [
  { name: 'Rent', icon: Home, color: 'pink', bgColor: 'bg-pink-500/20', textColor: 'text-pink-400' },
  { name: 'Electricity', icon: Lightbulb, color: 'cyan', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' },
  { name: 'Water', icon: Droplet, color: 'blue', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  { name: 'Gas', icon: Flame, color: 'purple', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' },
  { name: 'Wi-Fi', icon: Wifi, color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
  { name: 'Groceries', icon: ShoppingCart, color: 'teal', bgColor: 'bg-teal-500/20', textColor: 'text-teal-400' },
  { name: 'Maintenance', icon: Wrench, color: 'cyan', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400' },
  { name: 'Other Home Bills', icon: FileText, color: 'purple', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', isOther: true },
];

export default function HomeFinance() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const currency = profile?.currency || 'USD';
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Filter home-related transactions (only category = "Home Expenses")
  const homeTransactions = transactions.filter(t => 
    t.category === 'Home Expenses' &&
    t.type === 'expense' &&
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  const totalHomeSpending = homeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Filter home-related subscriptions
  const homeSubscriptions = subscriptions.filter(s => 
    ['housing', 'utilities'].includes(s.category) || 
    (s.name && s.name.toLowerCase().includes('rent')) ||
    (s.name && s.name.toLowerCase().includes('mortgage'))
  );

  const activeHomeBills = homeSubscriptions.filter(s => s.status === 'active');

  // Calculate upcoming bills (next 30 days)
  const next30Days = addDays(now, 30);
  const upcomingBills = activeHomeBills.filter(bill => {
    const dueDate = new Date(bill.next_due_date);
    return isWithinInterval(dueDate, { start: now, end: next30Days });
  });

  const totalUpcomingBills = upcomingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

  // Home savings
  const homeSavingsGoal = savingsGoals.find(g => 
    g.name.toLowerCase().includes('home') || 
    g.name.toLowerCase().includes('house') ||
    g.name.toLowerCase().includes('emergency')
  );

  // Calculate spending by home sub-category
  const categorySpending = HOME_CATEGORIES.map(cat => {
    let transactions = [];

    if (cat.isOther) {
      // "Other" = home transactions NOT matched by other specific sub-categories
      const mappedSubCategories = HOME_CATEGORIES.filter(c => !c.isOther).map(c => c.name);
      transactions = homeTransactions.filter(t => 
        !t.subCategory || !mappedSubCategories.includes(t.subCategory)
      );
    } else {
      // Match by subCategory
      transactions = homeTransactions.filter(t => t.subCategory === cat.name);
    }

    const spent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Budget matching (can be by specific sub-category or general Home Expenses)
    const budget = budgets.find(b => 
      (b.category === cat.name || b.category === 'Home Expenses') &&
      b.month === (now.getMonth() + 1) &&
      b.year === now.getFullYear()
    );

    return {
      ...cat,
      spent,
      transactions,
      budget: budget?.amount || 0,
      percentage: budget?.amount ? (spent / budget.amount) * 100 : 0,
    };
  });

  // Home spending as % of income
  const monthlyIncome = profile?.monthly_income || 0;
  const homeSpendingPercent = monthlyIncome > 0 ? (totalHomeSpending / monthlyIncome) * 100 : 0;

  // Upcoming bills for calendar
  const next7DaysBills = activeHomeBills
    .filter(bill => {
      const daysUntil = differenceInDays(new Date(bill.next_due_date), now);
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

  const getBillUrgency = (dueDate) => {
    const daysUntil = differenceInDays(new Date(dueDate), now);
    if (daysUntil < 0) return { label: 'Overdue', color: 'red' };
    if (daysUntil === 0) return { label: 'Due today', color: 'orange' };
    if (daysUntil === 1) return { label: 'Due tomorrow', color: 'yellow' };
    return { label: `Due in ${daysUntil}d`, color: 'cyan' };
  };

  return (
    <SpaceBackground>
      <SubPageHeader title="Home Finance" />
      <PaywallGate featureId="vault" requiredTier="pro">
      <main className="pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-4 py-4">

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <NeonCard className="p-4 text-center" glowColor="cyan">
              <Home className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-slate-400 text-xs mb-1">Home Spending</p>
              <p className="text-white font-bold">
                {totalHomeSpending > 0 ? formatCurrency(totalHomeSpending) : '—'}
              </p>
              <p className="text-slate-500 text-xs mt-1">This Month</p>
            </NeonCard>
            <NeonCard className="p-4 text-center" glowColor="pink">
              <AlertCircle className="w-5 h-5 text-pink-400 mx-auto mb-2" />
              <p className="text-slate-400 text-xs mb-1">Upcoming Bills</p>
              <p className="text-white font-bold">
                {totalUpcomingBills > 0 ? formatCurrency(totalUpcomingBills) : '—'}
              </p>
              <p className="text-slate-500 text-xs mt-1">Next 30 Days</p>
            </NeonCard>
            <NeonCard className="p-4 text-center" glowColor="green">
              <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-slate-400 text-xs mb-1">Home Savings</p>
              <p className="text-white font-bold">
                {homeSavingsGoal?.current_amount ? formatCurrency(homeSavingsGoal.current_amount) : '—'}
              </p>
              <p className="text-slate-500 text-xs mt-1">Safety Buffer</p>
            </NeonCard>
          </div>

          {/* Upcoming Bills Alert */}
          {next7DaysBills.length > 0 && (
            <NeonCard className="p-5" glowColor="pink">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-pink-400" />
                <h3 className="text-white font-semibold">Upcoming Home Bills (Next 7 Days)</h3>
              </div>
              <div className="space-y-2">
                {next7DaysBills.map(bill => {
                  const urgency = getBillUrgency(bill.next_due_date);
                  return (
                    <div key={bill.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{bill.icon || '🏠'}</span>
                        <div>
                          <p className="text-white font-medium">{bill.name}</p>
                          <p className={`text-xs ${urgency.color === 'red' ? 'text-red-400' : urgency.color === 'orange' ? 'text-orange-400' : urgency.color === 'yellow' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                            {urgency.label}
                          </p>
                        </div>
                      </div>
                      <p className="text-white font-semibold">{formatCurrency(bill.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </NeonCard>
          )}

          {/* Home Categories */}
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Home className="w-5 h-5 text-cyan-400" />
              Home Categories
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {categorySpending.map((cat, index) => {
                const Icon = cat.icon;
                const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;
                const isNearBudget = cat.budget > 0 && cat.percentage >= 80 && cat.percentage < 100;
                
                return (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NeonCard 
                      className="p-4 cursor-pointer active:scale-95 transition-transform duration-200" 
                      glowColor={isOverBudget ? 'pink' : isNearBudget ? 'purple' : cat.color}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <div className={`w-10 h-10 rounded-xl ${cat.bgColor} flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 ${cat.textColor}`} />
                      </div>
                      <p className="text-white font-semibold text-sm mb-1">{cat.name}</p>
                      <p className="text-white font-bold text-lg">{formatCurrency(cat.spent)}</p>
                      
                      {cat.budget > 0 && (
                        <>
                          <p className="text-slate-400 text-xs mt-1">of {formatCurrency(cat.budget)}</p>
                          <NeonProgress 
                            value={cat.spent} 
                            max={cat.budget}
                            size="sm"
                            color={isOverBudget ? 'pink' : isNearBudget ? 'purple' : 'green'}
                            showLabel={false}
                            className="mt-2"
                          />
                          {isOverBudget && (
                            <p className="text-red-400 text-xs mt-1 font-medium">Over Budget!</p>
                          )}
                        </>
                      )}
                    </NeonCard>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Category Detail Modal */}
          {selectedCategory && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md my-8"
              >
                <NeonCard className="p-6" glowColor={selectedCategory.color}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${selectedCategory.bgColor} flex items-center justify-center`}>
                        <selectedCategory.icon className={`w-6 h-6 ${selectedCategory.textColor}`} />
                      </div>
                      <h3 className="text-white font-semibold text-xl">{selectedCategory.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="p-2 rounded-lg text-slate-400 active:text-white active:bg-slate-800 transition-colors"
                    >
                      <AlertCircle className="w-5 h-5 rotate-45" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-slate-400 text-sm mb-1">Total Spent</p>
                    <p className="text-white font-bold text-2xl">{formatCurrency(selectedCategory.spent)}</p>
                    {selectedCategory.budget > 0 && (
                      <p className="text-slate-400 text-sm mt-1">of {formatCurrency(selectedCategory.budget)} budget</p>
                    )}
                  </div>

                  {selectedCategory.transactions && selectedCategory.transactions.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-slate-400 text-sm mb-2">Transactions ({selectedCategory.transactions.length})</p>
                      {selectedCategory.transactions.map(transaction => (
                        <div key={transaction.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{transaction.category_icon || '🏠'}</span>
                            <div>
                              <p className="text-white font-medium text-sm">{transaction.merchant || transaction.category}</p>
                              <p className="text-slate-400 text-xs">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <p className="text-white font-semibold">{formatCurrency(transaction.amount)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-slate-400 text-sm">No transactions in this category yet</p>
                    </div>
                  )}

                  <NeonButton
                    variant="ghost"
                    className="w-full mt-4"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Close
                  </NeonButton>
                </NeonCard>
              </motion.div>
            </div>
          )}

          {/* Home Bills & Subscriptions */}
          <NeonCard className="p-5" glowColor="purple">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Home Bills & Subscriptions</h3>
              <Link to={createPageUrl('Subscriptions')}>
                <NeonButton size="sm" variant="ghost">
                  View All
                </NeonButton>
              </Link>
            </div>
            
            {activeHomeBills.length > 0 ? (
              <div className="space-y-2">
                {activeHomeBills.slice(0, 5).map(bill => (
                  <div key={bill.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{bill.icon || '🏠'}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{bill.name}</p>
                        <p className="text-slate-400 text-xs capitalize">{bill.billing_frequency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(bill.amount)}</p>
                      <p className="text-slate-400 text-xs">{bill.next_due_date ? format(new Date(bill.next_due_date), 'MMM d') : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">No home bills tracked yet</p>
                <Link to={createPageUrl('Subscriptions')}>
                  <NeonButton className="mt-3" size="sm" variant="purple">
                    Add Home Bill
                  </NeonButton>
                </Link>
              </div>
            )}
          </NeonCard>

          {/* Analytics */}
          <NeonCard className="p-5" glowColor="blue">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Home Spending Analytics</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Home Spending vs Income</p>
                  <p className="text-white font-semibold">{homeSpendingPercent.toFixed(1)}%</p>
                </div>
                <NeonProgress 
                  value={homeSpendingPercent} 
                  max={100}
                  size="sm"
                  color={homeSpendingPercent > 50 ? 'pink' : homeSpendingPercent > 30 ? 'purple' : 'green'}
                  showLabel={false}
                />
                <p className="text-slate-500 text-xs mt-1">
                  {formatCurrency(totalHomeSpending)} of {formatCurrency(monthlyIncome)} monthly income
                </p>
              </div>

              {homeSavingsGoal && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-sm">Home Safety Buffer</p>
                    <p className="text-white font-semibold">
                      {homeSavingsGoal.target_amount > 0 ? ((homeSavingsGoal.current_amount / homeSavingsGoal.target_amount) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                  <NeonProgress 
                    value={homeSavingsGoal.current_amount} 
                    max={homeSavingsGoal.target_amount}
                    size="sm"
                    color="green"
                    showLabel={false}
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    {formatCurrency(homeSavingsGoal.current_amount)} of {formatCurrency(homeSavingsGoal.target_amount)} goal
                  </p>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-300 text-sm">3-Month Home Buffer</p>
                  <p className="text-cyan-400 font-bold">{formatCurrency(totalHomeSpending * 3)}</p>
                </div>
                <p className="text-slate-500 text-xs">Recommended emergency fund for home expenses</p>
              </div>
            </div>
          </NeonCard>

          {/* Recent Home Transactions */}
          <NeonCard className="p-5" glowColor="cyan">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Recent Home Transactions</h3>
              <Link to={createPageUrl('SpendingLog')}>
                <NeonButton size="sm" variant="ghost">
                  View All
                </NeonButton>
              </Link>
            </div>
            
            {homeTransactions.length > 0 ? (
              <div className="space-y-2">
                {homeTransactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{transaction.category_icon || '🏠'}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{transaction.merchant || transaction.category}</p>
                        <p className="text-slate-400 text-xs">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <p className="text-white font-semibold">{formatCurrency(transaction.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">No home transactions this month</p>
              </div>
            )}
          </NeonCard>

        </div>
      </main>

      </PaywallGate>
      <BottomNav currentPage="HomeFinance" />
    </SpaceBackground>
  );
}