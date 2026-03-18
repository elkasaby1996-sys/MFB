import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartAlerts({ transactions, budgets, profile }) {
  const alerts = [];
  const currency = profile?.currency || 'USD';

  // Calculate current month spending by category
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && t.type === 'expense';
  });

  const categorySpending = thisMonthTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // Check budget overruns
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  budgets.forEach(budget => {
    if (budget.month === currentMonth && budget.year === currentYear) {
      const spent = categorySpending[budget.category] || 0;
      const percentUsed = (spent / budget.amount) * 100;
      
      if (percentUsed >= 90 && percentUsed < 100) {
        alerts.push({
          type: 'warning',
          icon: AlertTriangle,
          title: `${budget.category} budget almost exceeded`,
          message: `You've used ${percentUsed.toFixed(0)}% of your ${currency} ${budget.amount} budget`,
          color: 'amber'
        });
      } else if (percentUsed >= 100) {
        alerts.push({
          type: 'danger',
          icon: TrendingUp,
          title: `${budget.category} budget exceeded!`,
          message: `You've spent ${currency} ${spent.toFixed(0)} of ${currency} ${budget.amount}`,
          color: 'red'
        });
      }
    }
  });

  // Check for unusual spending spikes
  const lastWeekTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && t.type === 'expense';
  });

  const lastWeekSpending = lastWeekTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgDailySpending = lastWeekSpending / 7;
  const dailyBudget = profile?.daily_spending_limit;

  if (dailyBudget && avgDailySpending > dailyBudget * 1.5) {
    alerts.push({
      type: 'info',
      icon: TrendingDown,
      title: 'Spending spike detected',
      message: `Your daily average is ${currency} ${avgDailySpending.toFixed(0)}, 50% above your limit`,
      color: 'cyan'
    });
  }

  // Savings opportunity alert
  const monthlyIncome = profile?.monthly_income || 0;
  const monthlyExpenses = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  if (monthlyIncome > 0 && savingsRate < 20 && savingsRate > 0) {
    alerts.push({
      type: 'opportunity',
      icon: Zap,
      title: 'Savings opportunity',
      message: `You're saving ${savingsRate.toFixed(0)}% of income. Aim for 20%+ to build wealth faster`,
      color: 'green'
    });
  }

  if (alerts.length === 0) return null;

  const colorStyles = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400'
  };

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((alert, index) => {
        const Icon = alert.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-xl border ${colorStyles[alert.color]}`}
          >
            <div className="flex gap-3">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-0.5">{alert.title}</h4>
                <p className="text-xs opacity-90">{alert.message}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}