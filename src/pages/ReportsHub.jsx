import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import ScreenScrollContainer from '@/components/layout/ScreenScrollContainer';
import NeonCard from '@/components/ui/NeonCard';
import { FileText, Heart, ChevronRight, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { calculateFinancialHealthScore, getScoreLabel } from '@/components/health/calculateHealthScore';
import PaywallGate from '@/components/subscription/PaywallGate';
import { calculateDataPresence, getHealthScoreLabel } from '@/components/utils/dataPresence';

export default function ReportsHub() {
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

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
  });

  const { data: userMissions = [] } = useQuery({
    queryKey: ['userMissions'],
    queryFn: () => base44.entities.UserMission.list(),
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
  });

  const currency = profile?.currency || 'USD';

  const dataPresence = useMemo(() => {
    return calculateDataPresence(transactions, investments, budgets);
  }, [transactions, investments, budgets]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount) || 0);
  };

  // Calculate key metrics
  const { thisMonthIncome, thisMonthExpenses, lastMonthIncome, lastMonthExpenses, thisMonthIncomeCount, thisMonthExpenseCount, healthScore, scoreLabel, scoreColor, showScore } = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthIncomeTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return t.type === 'income' && date >= thisMonthStart && date <= thisMonthEnd;
    });

    const thisMonthExpenseTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && date >= thisMonthStart && date <= thisMonthEnd;
    });

    const thisIncome = thisMonthIncomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const thisExpenses = thisMonthExpenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const lastIncome = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'income' && date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const lastExpenses = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const health = calculateFinancialHealthScore({
      transactions,
      budgets,
      savingsGoals,
      debts,
      profile,
      userMissions,
    });

    const { label, color, showScore: shouldShowScore } = getHealthScoreLabel(health.total || 0, dataPresence.state);

    return {
      thisMonthIncome: thisIncome,
      thisMonthExpenses: thisExpenses,
      lastMonthIncome: lastIncome,
      lastMonthExpenses: lastExpenses,
      thisMonthIncomeCount: thisMonthIncomeTransactions.length,
      thisMonthExpenseCount: thisMonthExpenseTransactions.length,
      healthScore: health,
      scoreLabel: label,
      scoreColor: color,
      showScore: shouldShowScore
    };
  }, [transactions, budgets, savingsGoals, debts, profile, userMissions, dataPresence.state]);

  const incomeChange = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
  const expenseChange = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
  
  // CRITICAL: Savings Rate = (Income - Expenses) / Income
  // Only calculate if income > 0, clamp to minimum 0%
  const savingsRate = thisMonthIncome > 0 
    ? Math.max(0, ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100)
    : null;

  const sections = [
    {
      title: 'Reports',
      items: [
        {
          name: 'Reports',
          description: 'Monthly and yearly reports',
          icon: FileText,
          color: 'cyan',
          page: 'Reports'
        },
        {
          name: 'Financial Health',
          description: 'Health score and insights',
          icon: Heart,
          color: 'pink',
          page: 'HealthScore'
        },
      ]
    }
  ];

  return (
    <SpaceBackground>
      <PaywallGate featureId="financial_reports" requiredTier="pro">
      <ScreenScrollContainer>
      <div className="max-w-lg mx-auto space-y-4 py-6">
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
            <p className="text-slate-400">View your financial reports and health</p>
          </div>

          {/* Financial Health Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Link to={createPageUrl("HealthScore")}>
              <NeonCard className="p-5 cursor-pointer active:scale-[0.98] transition-all" glowColor={scoreColor === 'green' ? 'green' : scoreColor === 'yellow' ? 'teal' : scoreColor === 'slate' ? 'cyan' : 'pink'}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className={`w-5 h-5 ${
                        scoreColor === 'green' ? 'text-green-400' : 
                        scoreColor === 'yellow' ? 'text-yellow-400' : 
                        scoreColor === 'slate' ? 'text-cyan-400' : 
                        'text-red-400'
                      }`} />
                      <h3 className="text-white font-semibold">Financial Health</h3>
                    </div>
                    {showScore ? (
                      <>
                        <p className="text-3xl font-bold text-white mb-1">{Math.round(healthScore.total || 0)}<span className="text-slate-400 text-lg">/100</span></p>
                        <p className={`text-sm font-semibold ${scoreColor === 'green' ? 'text-green-400' : scoreColor === 'yellow' ? 'text-yellow-400' : scoreColor === 'slate' ? 'text-cyan-400' : 'text-red-400'}`}>
                          {scoreLabel}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-slate-500 mb-1">—<span className="text-slate-600 text-lg">/100</span></p>
                        <p className="text-sm font-medium text-cyan-400">
                          {scoreLabel}
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-500" />
                </div>
              </NeonCard>
            </Link>
          </motion.div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <NeonCard className="p-4" glowColor="green">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <p className="text-slate-400 text-xs font-semibold uppercase">Income</p>
                </div>
                <p className={`text-white font-bold mb-1 ${formatCurrency(thisMonthIncome).length > 12 ? 'text-base' : formatCurrency(thisMonthIncome).length > 10 ? 'text-lg' : formatCurrency(thisMonthIncome).length > 8 ? 'text-xl' : 'text-2xl'}`}>
                  {formatCurrency(thisMonthIncome)}
                </p>
                <div className="flex items-center gap-1">
                  {incomeChange > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : incomeChange < 0 ? (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  ) : null}
                  <p className={`text-xs font-semibold ${incomeChange > 0 ? 'text-green-400' : incomeChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {incomeChange > 0 ? '+' : ''}{Math.round(incomeChange)}% vs last month
                  </p>
                </div>
              </NeonCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <NeonCard className="p-4" glowColor="pink">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-pink-400" />
                  <p className="text-slate-400 text-xs font-semibold uppercase">Expenses</p>
                </div>
                <p className={`text-white font-bold mb-1 ${formatCurrency(thisMonthExpenses).length > 12 ? 'text-base' : formatCurrency(thisMonthExpenses).length > 10 ? 'text-lg' : formatCurrency(thisMonthExpenses).length > 8 ? 'text-xl' : 'text-2xl'}`}>
                  {formatCurrency(thisMonthExpenses)}
                </p>
                <div className="flex items-center gap-1">
                  {expenseChange > 0 ? (
                    <TrendingUp className="w-3 h-3 text-red-400" />
                  ) : expenseChange < 0 ? (
                    <TrendingDown className="w-3 h-3 text-green-400" />
                  ) : null}
                  <p className={`text-xs font-semibold ${expenseChange > 0 ? 'text-red-400' : expenseChange < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                    {expenseChange > 0 ? '+' : ''}{Math.round(expenseChange)}% vs last month
                  </p>
                </div>
              </NeonCard>
            </motion.div>
          </div>

          {/* Savings Rate Card - Only show if income exists */}
          {thisMonthIncomeCount > 0 && thisMonthExpenseCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <NeonCard className="p-4" glowColor="teal">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-teal-400" />
                  <h3 className="text-white font-semibold">Savings Rate</h3>
                </div>
                <p className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-green-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(savingsRate)}%
                </p>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${savingsRate >= 20 ? 'bg-green-400' : savingsRate >= 10 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(savingsRate, 100)}%` }}
                />
              </div>
              <p className="text-slate-400 text-xs mt-2">
                Percentage of income remaining after expenses
              </p>
            </NeonCard>
          </motion.div>
          )}

          {/* Savings Rate Placeholder - No income logged */}
          {thisMonthIncomeCount === 0 && dataPresence.hasAnyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <NeonCard className="p-4 bg-slate-800/50" glowColor="teal">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-5 h-5 text-slate-500" />
                <h3 className="text-white font-semibold">Savings Rate</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Savings rate appears once income is logged.
              </p>
            </NeonCard>
          </motion.div>
          )}

          {/* Quick Insights */}
          {dataPresence.hasAnyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <NeonCard className="p-4" glowColor="purple">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Quick Insights
              </h3>
              <div className="space-y-2 text-sm">
                {/* Only show income vs expense insight if BOTH exist */}
                {thisMonthIncomeCount > 0 && thisMonthExpenseCount > 0 && (
                  thisMonthIncome > thisMonthExpenses ? (
                    <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-lg">✅</span>
                      <p className="text-slate-300 flex-1">
                        You're spending less than you earn this month. Keep it up!
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                      <span className="text-lg">⚠️</span>
                      <p className="text-slate-300 flex-1">
                        Your expenses exceed income this month. Consider budgeting.
                      </p>
                    </div>
                  )
                )}
                
                {/* Only show if user has some activity */}
                {dataPresence.hasMinimumActivity && savingsGoals.length === 0 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span className="text-lg">🎯</span>
                    <p className="text-slate-300 flex-1">
                      Set a savings goal to stay motivated and track progress.
                    </p>
                  </div>
                )}
                
                {/* Only show if there's SOME data but not enough */}
                {dataPresence.transactionCount > 0 && dataPresence.transactionCount < 5 && (
                  <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <span className="text-lg">📝</span>
                    <p className="text-slate-300 flex-1">
                      Log more transactions for better insights and reports.
                    </p>
                  </div>
                )}
              </div>
            </NeonCard>
          </motion.div>
          )}

          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">
              Detailed Reports
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
      </PaywallGate>

      <BottomNav currentPage="ReportsHub" />
    </SpaceBackground>
  );
}