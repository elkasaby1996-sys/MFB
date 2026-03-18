import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { evaluateInsights, hasMinimumData } from './insightCatalog';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, Info, Plus } from 'lucide-react';
import { startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export default function QuickInsights({ 
  transactions = [], 
  budgets = [], 
  savingsGoals = [], 
  investments = [], 
  subscriptions = [],
  profile,
  onAddExpense,
  onAddIncome 
}) {
  const navigate = useNavigate();

  // Calculate insight data with explicit counts
  const insightData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const thisMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    // EXPLICIT COUNT CHECKS - NO ASSUMPTIONS
    const incomeTransactions = thisMonthTransactions.filter(t => t.type === 'income');
    const expenseTransactions = thisMonthTransactions.filter(t => t.type === 'expense');
    
    const incomeCount = incomeTransactions.length;
    const expenseCount = expenseTransactions.length;
    const transactionCount = thisMonthTransactions.length;

    // Only calculate totals if entries exist (avoid false 0 = 0 comparisons)
    const totalIncome = incomeCount > 0 
      ? incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      : 0;
    
    const totalExpenses = expenseCount > 0
      ? expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      : 0;

    const savingsTransactions = thisMonthTransactions
      .filter(t => t.category === 'Savings')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalSavings = savingsGoals.reduce((sum, g) => sum + (parseFloat(g.current_amount) || 0), 0);

    // Category spending
    const categorySpending = expenseCount > 0
      ? expenseTransactions.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {})
      : {};

    // Subscription costs
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const totalSubscriptionCost = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        const amount = parseFloat(s.amount) || 0;
        if (s.billing_frequency === 'yearly') return sum + (amount / 12);
        if (s.billing_frequency === 'weekly') return sum + (amount * 4);
        return sum + amount;
      }, 0);

    // Budget analysis
    const exceededBudgets = budgets.filter(budget => {
      const categoryTotal = categorySpending[budget.category] || 0;
      return categoryTotal > (budget.amount || 0);
    }).length;

    // Tracking analysis
    const firstTransaction = transactions.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    const daysSinceFirstTransaction = firstTransaction 
      ? differenceInDays(now, new Date(firstTransaction.date))
      : 0;

    return {
      // Explicit counts (NEVER assume missing = 0)
      transactionCount,
      incomeCount,
      expenseCount,
      
      // Totals (only meaningful if counts > 0)
      totalIncome,
      totalExpenses,
      savingsTransactions,
      totalSavings,
      categorySpending,
      
      // Other data
      savingsGoals,
      budgets,
      exceededBudgets,
      investments,
      activeSubscriptions,
      totalSubscriptionCost,
      daysSinceFirstTransaction
    };
  }, [transactions, budgets, savingsGoals, investments, subscriptions, profile]);

  // Check data availability with explicit counts
  const dataStatus = useMemo(() => {
    return hasMinimumData(
      insightData.transactionCount,
      insightData.incomeCount,
      insightData.expenseCount,
      budgets.length,
      investments.length
    );
  }, [insightData.transactionCount, insightData.incomeCount, insightData.expenseCount, budgets.length, investments.length]);

  // Get matched insights - ONLY if we have data
  const insights = useMemo(() => {
    if (!dataStatus || !dataStatus.hasMinimumData) return [];
    return evaluateInsights(insightData);
  }, [insightData, dataStatus]);

  const handleCTA = (action) => {
    if (action === 'add_expense') {
      onAddExpense?.();
    } else if (action === 'add_income') {
      onAddIncome?.();
    } else {
      navigate(createPageUrl(action));
    }
  };

  // ABSOLUTE ZERO DATA - don't show section at all
  if (dataStatus === null) {
    return null;
  }

  // No meaningful data - show empty state
  if (!dataStatus.hasAnyData) {
    return null;
  }

  // Limited data - show empty state
  if (!dataStatus.hasMinimumData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <NeonCard className="p-5" glowColor="purple">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Quick Insights</h3>
            <p className="text-slate-400 text-sm">
              Start tracking to see personalized insights.
            </p>
          </div>
        </NeonCard>
      </motion.div>
    );
  }

  // Has minimum data but limited (early stage)
  if (dataStatus.isEarlyStage && insights.length > 0) {
    const insight = insights[0]; // Show only 1 insight
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <NeonCard className="p-5" glowColor="purple">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">{insight.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold text-sm">Quick Insights</h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  Early insight
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Based on limited data so far.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-3 mb-3">
            <p className="text-white text-sm font-medium mb-1">
              {insight.message_primary}
            </p>
            <p className="text-slate-400 text-xs">
              {insight.message_secondary}
            </p>
          </div>

          {insight.cta_label && (
            <NeonButton
              size="sm"
              variant="secondary"
              onClick={() => handleCTA(insight.cta_action)}
              className="w-full"
            >
              {insight.cta_label}
            </NeonButton>
          )}
        </NeonCard>
      </motion.div>
    );
  }

  // Full insights (2 max)
  if (insights.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <NeonCard className="p-5" glowColor="purple">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Quick Insights</h3>
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div 
              key={insight.id}
              className="bg-slate-800/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  insight.severity === 'warning' 
                    ? 'bg-orange-500/20' 
                    : 'bg-cyan-500/20'
                }`}>
                  <span className="text-lg">{insight.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium mb-1">
                    {insight.message_primary}
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {insight.message_secondary}
                  </p>
                </div>
              </div>

              {insight.cta_label && (
                <NeonButton
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCTA(insight.cta_action)}
                  className="w-full mt-2"
                >
                  {insight.cta_label}
                </NeonButton>
              )}
            </div>
          ))}
        </div>
      </NeonCard>
    </motion.div>
  );
}