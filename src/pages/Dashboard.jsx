import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import ScreenScrollContainer from '@/components/layout/ScreenScrollContainer';
import NotificationBell from '@/components/notifications/NotificationBell';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import StatCard from '@/components/ui/StatCard';
import StreakModal from '@/components/ui/StreakModal';
import CategoryIcon, { getCategoryByName } from '@/components/ui/CategoryIcon';
import SpendingDonutChart from '@/components/dashboard/SpendingDonutChart';
import DailySpendingCircle from '@/components/dashboard/DailySpendingCircle';
import HealthScoreCard from '@/components/health/HealthScoreCard';
import { calculateFinancialHealthScore, getScoreLabel } from '@/components/health/calculateHealthScore';
import { calculateDataPresence, getHealthScoreLabel } from '@/components/utils/dataPresence';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import QuickInsights from '@/components/dashboard/QuickInsights';
import SalaryCheckModal from '@/components/salary/SalaryCheckModal';
import DueSubscriptionsAlert from '@/components/subscription/DueSubscriptionsAlert';
import QueryWrapper from '@/components/ui/QueryWrapper';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target,
  Plus,
  ChevronRight,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PieChart,
  X,
  Sparkles
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { usePremium } from '@/components/providers/PremiumProvider';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showSalaryCheck, setShowSalaryCheck] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upgradeBannerDismissed, setUpgradeBannerDismissed] = useState(() => {
    const val = localStorage.getItem('upgrade_banner_dismissed');
    if (!val) return false;
    return Date.now() - parseInt(val) < 24 * 60 * 60 * 1000;
  });
  const { currentTier } = usePremium();
  
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 100),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
  });

  const { data: userMissions = [] } = useQuery({
    queryKey: ['userMissions'],
    queryFn: () => base44.entities.UserMission.list(),
  });

  // Memoized calculations for performance
  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => startOfMonth(now), [now]);
  const monthEnd = useMemo(() => endOfMonth(now), [now]);
  
  const thisMonthTransactions = useMemo(() => 
    transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    }), [transactions, monthStart, monthEnd]
  );

  // Today's spending
  const { todaySpent, todayStart, todayEnd } = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    const todayTxs = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= start && date <= end && t.type === 'expense';
    });
    
    return {
      todaySpent: todayTxs.reduce((sum, t) => sum + (t.amount || 0), 0),
      todayStart: start,
      todayEnd: end
    };
  }, [transactions, now]);

  const { totalIncome, totalExpenses, netCashFlow } = useMemo(() => {
    const income = thisMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netCashFlow: income - expenses
    };
  }, [thisMonthTransactions]);

  const currency = profile?.currency || 'USD';

  // Category spending
  const topCategories = useMemo(() => {
    const categorySpending = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    return Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4);
  }, [thisMonthTransactions]);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  }, [currency]);

  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);

  const { totalDebt, activeDebts, totalSavings, totalInvestments, netWorth } = useMemo(() => {
    const active = debts.filter(d => d.status === 'active');
    const debt = active.reduce((sum, d) => sum + (parseFloat(d.current_balance) || 0), 0);
    const savings = savingsGoals.reduce((sum, g) => sum + (parseFloat(g.current_amount) || 0), 0);
    const investmentsTotal = investments.reduce((sum, i) => sum + (parseFloat(i.current_value) || 0), 0);
    
    return {
      totalDebt: debt,
      activeDebts: active,
      totalSavings: savings,
      totalInvestments: investmentsTotal,
      netWorth: (savings + investmentsTotal) - debt
    };
  }, [debts, savingsGoals, investments]);

  // Calculate Health Score
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list(),
  });

  const healthScore = useMemo(() => {
    return calculateFinancialHealthScore({
      transactions,
      budgets,
      savingsGoals,
      debts,
      profile,
      userMissions,
      investments,
      subscriptions,
    });
  }, [transactions, budgets, savingsGoals, debts, profile, userMissions, investments, subscriptions]);

  // Calculate data presence
  const dataPresence = useMemo(() => {
    return calculateDataPresence(transactions, investments, budgets);
  }, [transactions, investments, budgets]);

  const { label: scoreLabel, subtitle: scoreSubtitle, color: scoreColor, showScore } = useMemo(() => {
    return getHealthScoreLabel(healthScore.total || 0, dataPresence.state);
  }, [healthScore.total, dataPresence.state]);

  const handleUpdateDailyLimit = useCallback((newLimit) => {
    if (profile?.id) {
      updateProfileMutation.mutate({
        id: profile.id,
        data: { daily_spending_limit: newLimit }
      });
    }
  }, [profile?.id, updateProfileMutation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries(['transactions']);
    await queryClient.invalidateQueries(['budgets']);
    await queryClient.invalidateQueries(['savingsGoals']);
    await queryClient.invalidateQueries(['debts']);
    await queryClient.invalidateQueries(['investments']);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [queryClient]);

  const handleStreakClick = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setShowStreakModal(true);
  }, []);

  // Salary check logic - show modal on salary day and the day before
  useEffect(() => {
    if (!profile?.salary_auto_log || !profile?.salary_day || !profile?.salary_amount) return;

    const today = new Date();
    const todayDay = today.getDate();
    const salaryDay = profile.salary_day;
    const thisMonth = format(today, 'yyyy-MM');
    
    if (profile.salary_last_logged_month === thisMonth) return;

    if (todayDay === salaryDay || todayDay === salaryDay - 1) {
      const timer = setTimeout(() => setShowSalaryCheck(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  // Guard: must be after all hooks
  useEffect(() => {
    if (!isLoading && !profile) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [isLoading, profile, navigate]);

  if (isLoading) return <DashboardSkeleton />;
  if (!profile) return null;





  return (
    <div className="bg-slate-950 min-h-screen">
      <ScreenScrollContainer>
        <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 py-4 px-4 sm:px-6">
          
          {/* Upgrade Banner for free users */}
          {currentTier === 'free' && !upgradeBannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl px-4 py-3">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <p className="text-slate-300 text-sm flex-1">
                  Unlock Receipt Scanner, Reports & more — <span className="text-cyan-400 font-semibold">Upgrade to Pro</span>
                </p>
                <button
                  className="text-cyan-400 text-xs font-bold whitespace-nowrap px-2 py-1 bg-cyan-500/20 rounded-lg active:opacity-70"
                  onClick={() => navigate(createPageUrl('Pricing'))}
                >
                  Upgrade Now
                </button>
                <button
                  className="text-slate-500 active:text-white p-1"
                  onClick={() => {
                    setUpgradeBannerDismissed(true);
                    localStorage.setItem('upgrade_banner_dismissed', Date.now().toString());
                  }}
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Hero Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <NeonCard className="p-6" glowColor="cyan">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-white text-2xl font-bold mb-1">
                    Hey {profile.name?.split(' ')[0] || 'Bro'}! 👽
                  </h1>
                  <p className="text-slate-400 text-sm">
                    {format(now, 'EEEE, MMMM d')}
                  </p>
                </div>
                <NotificationBell />
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={handleStreakClick}
                  className="flex items-center gap-2 bg-orange-500/10 px-3 py-2 rounded-full border border-orange-500/20 active:scale-95 transition-all cursor-pointer"
                  style={{ minHeight: 44, minWidth: 44 }}
                  aria-label={`Streak: ${profile.streak_days || 0} days`}
                >
                  <span className="text-lg">🔥</span>
                  <span className="text-orange-400 font-semibold text-sm">{profile.streak_days || 0} day</span>
                </button>
              </div>
            </NeonCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NeonCard className="p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5 text-cyan-400" />
                </button>
                <button
                  onClick={() => {
                    if (navigator.vibrate) {
                      navigator.vibrate([10, 20, 10]);
                    }
                    navigate(createPageUrl("AIAssistant"));
                  }}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all active:scale-95 relative"
                  aria-label="AI Assistant"
                  style={{
                    animation: 'aiPulse 3s ease-in-out infinite'
                  }}
                >
                  <Zap className="w-5 h-5 text-purple-400" />
                </button>
              </div>
            </NeonCard>
          </motion.div>

          {/* Key Metrics Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => navigate(createPageUrl("SpendingLog") + "?type=income")}
            >
              <NeonCard className="p-4 cursor-pointer active:scale-95 active:opacity-80 transition-all" glowColor="green">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Income</p>
                  <div className="p-1.5 rounded-lg bg-green-500/20">
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
                  </div>
                </div>
                <p className={`text-white font-extrabold ${formatCurrency(totalIncome).length > 10 ? 'text-lg' : formatCurrency(totalIncome).length > 8 ? 'text-xl' : 'text-2xl'}`}>
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-green-400 text-xs mt-1">This month</p>
              </NeonCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate(createPageUrl("SpendingLog") + "?type=expense")}
            >
              <NeonCard className="p-4 cursor-pointer active:scale-95 active:opacity-80 transition-all" glowColor="pink">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Expenses</p>
                  <div className="p-1.5 rounded-lg bg-pink-500/20">
                    <ArrowDownRight className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                </div>
                <p className={`text-white font-extrabold ${formatCurrency(totalExpenses).length > 10 ? 'text-lg' : formatCurrency(totalExpenses).length > 8 ? 'text-xl' : 'text-2xl'}`}>
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-pink-400 text-xs mt-1">This month</p>
              </NeonCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              onClick={() => navigate(createPageUrl("NetWorth"))}
            >
              <NeonCard className="p-4 cursor-pointer active:scale-95 active:opacity-80 transition-all" glowColor={netWorth >= 0 ? "green" : "pink"}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Net Worth</p>
                  <div className={`p-1.5 rounded-lg ${netWorth >= 0 ? 'bg-green-500/20' : 'bg-pink-500/20'}`}>
                    <PieChart className={`w-3.5 h-3.5 ${netWorth >= 0 ? 'text-green-400' : 'text-pink-400'}`} />
                  </div>
                </div>
                <p className={`font-bold ${netWorth >= 0 ? 'text-green-400' : 'text-red-400'} ${formatCurrency(netWorth).length > 10 ? 'text-base' : formatCurrency(netWorth).length > 8 ? 'text-lg' : 'text-xl'}`}>
                  {formatCurrency(netWorth)}
                </p>
                <p className="text-slate-400 text-xs mt-1">Total assets</p>
              </NeonCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate(createPageUrl("Savings"))}
            >
              <NeonCard className="p-4 cursor-pointer active:scale-95 active:opacity-80 transition-all" glowColor="teal">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Savings</p>
                  <div className="p-1.5 rounded-lg bg-teal-500/20">
                    <Target className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                </div>
                <p className={`text-teal-400 font-bold ${formatCurrency(totalSavings).length > 10 ? 'text-base' : formatCurrency(totalSavings).length > 8 ? 'text-lg' : 'text-xl'}`}>
                  {formatCurrency(totalSavings)}
                </p>
                <p className="text-slate-400 text-xs mt-1">{savingsGoals.length} goals</p>
              </NeonCard>
            </motion.div>
          </div>

          {/* Net Cash Flow & Daily Spending Limit */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate(createPageUrl("CashFlow"))}
            >
              <NeonCard className="p-4 cursor-pointer active:scale-95 active:opacity-80 transition-all" glowColor={netCashFlow >= 0 ? "green" : "pink"}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Net Flow</p>
                  <div className={`p-1.5 rounded-lg ${netCashFlow >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {netCashFlow >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                </div>
                <p className={`font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'} ${formatCurrency(netCashFlow).length > 10 ? 'text-base' : formatCurrency(netCashFlow).length > 8 ? 'text-lg' : 'text-xl'}`}>
                  {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                </p>
                <p className="text-slate-400 text-xs mt-1">This month</p>
              </NeonCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <DailySpendingCircle
                todaySpent={todaySpent}
                dailyLimit={profile?.daily_spending_limit}
                currency={currency}
                onUpdateLimit={handleUpdateDailyLimit}
                compact={true}
              />
            </motion.div>
          </div>

          {/* Financial Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => dataPresence.state !== 'no_data' && navigate(createPageUrl("HealthScore"))}
          >
            <NeonCard className={`p-4 transition-all ${dataPresence.state !== 'no_data' ? 'cursor-pointer active:scale-95 active:opacity-80' : ''}`} glowColor={scoreColor === 'slate' ? 'cyan' : scoreColor}>
              <div className="flex items-center justify-between gap-4">
                {/* Left: Icon and Title */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    scoreColor === 'green' ? 'bg-green-500/20' :
                    scoreColor === 'yellow' ? 'bg-yellow-500/20' :
                    scoreColor === 'red' ? 'bg-red-500/20' :
                    'bg-cyan-500/20'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${
                      scoreColor === 'green' ? 'text-green-400' :
                      scoreColor === 'yellow' ? 'text-yellow-400' :
                      scoreColor === 'red' ? 'text-red-400' :
                      'text-cyan-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Financial Health Score</p>
                    <p className="text-slate-400 text-xs">
                      {scoreSubtitle || (dataPresence.state === 'sufficient' ? `Your health is looking ${scoreLabel.toLowerCase()}` : scoreLabel)}
                    </p>
                  </div>
                </div>
                
                {/* Right: Score Circle or Placeholder */}
                {showScore ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-slate-700"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (healthScore.total || 0) / 100)}`}
                          className={`${scoreColor === 'green' ? 'text-green-400' : scoreColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'} transition-all duration-1000`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">{Math.round(healthScore.total || 0)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${scoreColor === 'green' ? 'text-green-400' : scoreColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {scoreLabel}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border-2 border-dashed border-slate-700">
                      <span className="text-slate-500 text-2xl font-bold">—</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">No data</span>
                  </div>
                )}
              </div>
            </NeonCard>
          </motion.div>

          {/* Due Subscriptions Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DueSubscriptionsAlert profile={profile} />
          </motion.div>

          {/* Quick Insights */}
          <QuickInsights
            transactions={transactions}
            budgets={budgets}
            savingsGoals={savingsGoals}
            investments={investments}
            subscriptions={subscriptions}
            profile={profile}
            onAddExpense={() => {
              setTransactionType('expense');
              setShowAddModal(true);
            }}
            onAddIncome={() => {
              setTransactionType('income');
              setShowAddModal(true);
            }}
          />

          {/* Debt Card (if exists) */}
          {totalDebt > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => navigate(createPageUrl("DebtHub"))}
            >
              <NeonCard className="p-4 sm:p-5 cursor-pointer active:scale-95 active:opacity-80 transition-all" glowColor="pink">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-400 text-sm mb-1">Total Debt</p>
                    <p className={`text-red-400 font-bold ${formatCurrency(totalDebt).length > 12 ? 'text-base' : formatCurrency(totalDebt).length > 10 ? 'text-lg' : formatCurrency(totalDebt).length > 8 ? 'text-xl' : 'text-xl sm:text-2xl'}`}>
                      {formatCurrency(totalDebt)}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">{activeDebts.length} active debts</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-500/20 rounded-xl flex-shrink-0">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                  </div>
                </div>
              </NeonCard>
            </motion.div>
          )}





          {/* Savings Goals */}
          {savingsGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <NeonCard className="p-4 sm:p-5" glowColor="teal">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-base sm:text-lg">Savings Goals</h3>
                  <Link to={createPageUrl("Savings")} className="text-cyan-400 text-sm flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {savingsGoals.slice(0, 2).map(goal => {
                    const progress = goal.target_amount 
                      ? (goal.current_amount / goal.target_amount) * 100 
                      : 0;
                    return (
                      <div key={goal.id}>
                        <div className="flex justify-between items-center text-sm mb-2 gap-2">
                          <span className="text-white flex items-center gap-2 truncate">
                            <span>{goal.icon || '🎯'}</span>
                            <span className="truncate">{goal.name}</span>
                          </span>
                          <span className="text-teal-400 whitespace-nowrap text-xs sm:text-sm">
                            {formatCurrency(goal.current_amount || 0)} / {formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                        <NeonProgress 
                          value={goal.current_amount || 0} 
                          max={goal.target_amount}
                          color="teal"
                        />
                      </div>
                    );
                  })}
                </div>
              </NeonCard>
            </motion.div>
          )}

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <NeonCard className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-base sm:text-lg">Recent Activity</h3>
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
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 active:bg-slate-800/50 transition-all cursor-pointer active:scale-[0.98]"
                        onClick={() => navigate(createPageUrl("SpendingLog"))}
                        style={{ minHeight: 44 }}
                      >
                        <CategoryIcon category={cat} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {tx.merchant || tx.category}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {format(new Date(tx.date), 'MMM d')}
                          </p>
                        </div>
                        <p className={`font-semibold text-sm whitespace-nowrap ${tx.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm mb-4">No transactions yet</p>
                  <NeonButton
                    size="sm"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add your first expense
                  </NeonButton>
                </div>
              )}
            </NeonCard>
          </motion.div>

        </div>
      </ScreenScrollContainer>
      
      <BottomNav currentPage="Dashboard" />

      {/* Streak Modal */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streakDays={profile?.streak_days || 0}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        profile={profile}
        initialType={transactionType}
      />

      {/* Salary Check Modal */}
      {profile && (
        <SalaryCheckModal
          isOpen={showSalaryCheck}
          onClose={() => setShowSalaryCheck(false)}
          profile={profile}
          onLogged={() => queryClient.invalidateQueries(['transactions'])}
        />
      )}
    </div>
  );

}