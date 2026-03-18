import React from 'react';
import { Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, addMonths, format } from 'date-fns';
import NeonProgress from '@/components/ui/NeonProgress';

export default function GoalProgressForecasting({ savingsGoals, transactions, profile }) {
  const currency = profile?.currency || 'USD';

  if (!savingsGoals || savingsGoals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center"
      >
        <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No savings goals set yet</p>
      </motion.div>
    );
  }

  // Calculate monthly savings rate from recent transactions
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentSavings = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= threeMonthsAgo && t.category === 'Savings';
  });

  const avgMonthlySavings = recentSavings.length > 0
    ? recentSavings.reduce((sum, t) => sum + t.amount, 0) / 3
    : 0;

  return (
    <div className="space-y-3">
      {savingsGoals.slice(0, 3).map((goal, index) => {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const remaining = goal.target_amount - goal.current_amount;
        
        // Forecast completion
        let forecastDate = null;
        let monthsNeeded = 0;
        let suggestedMonthly = 0;

        if (avgMonthlySavings > 0) {
          monthsNeeded = Math.ceil(remaining / avgMonthlySavings);
          forecastDate = addMonths(now, monthsNeeded);
        }

        // Calculate needed monthly savings to reach goal on time
        if (goal.target_date) {
          const targetDate = new Date(goal.target_date);
          const daysLeft = differenceInDays(targetDate, now);
          const monthsLeft = Math.max(1, daysLeft / 30);
          suggestedMonthly = remaining / monthsLeft;
        }

        const onTrack = goal.target_date && avgMonthlySavings >= suggestedMonthly;

        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{goal.icon}</span>
                <div>
                  <h4 className="text-white font-semibold text-sm">{goal.name}</h4>
                  <p className="text-xs text-slate-400">
                    {currency} {goal.current_amount.toFixed(0)} / {goal.target_amount.toFixed(0)}
                  </p>
                </div>
              </div>
              {onTrack !== null && (
                <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                  onTrack 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {onTrack ? 'On Track' : 'Behind'}
                </div>
              )}
            </div>

            {/* Progress */}
            <NeonProgress 
              value={goal.current_amount} 
              max={goal.target_amount}
              size="sm"
              showLabel={false}
            />

            {/* Forecast */}
            <div className="mt-3 space-y-2">
              {forecastDate && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">
                    Forecast: <span className="text-cyan-400 font-medium">
                      {format(forecastDate, 'MMM yyyy')}
                    </span>
                    {goal.target_date && (
                      <span className="text-slate-400 ml-1">
                        (Target: {format(new Date(goal.target_date), 'MMM yyyy')})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Suggestion */}
              {suggestedMonthly > 0 && avgMonthlySavings < suggestedMonthly && (
                <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-300 leading-tight">
                      <span className="font-semibold">Boost needed:</span> Save {currency} {suggestedMonthly.toFixed(0)}/month 
                      (currently {currency} {avgMonthlySavings.toFixed(0)}) to reach goal on time
                    </p>
                  </div>
                </div>
              )}

              {avgMonthlySavings >= suggestedMonthly && suggestedMonthly > 0 && (
                <div className="flex gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                  <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-300 leading-tight">
                    You're on pace! Keep contributing {currency} {avgMonthlySavings.toFixed(0)}/month
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}