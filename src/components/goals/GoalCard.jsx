import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { Target, Calendar, TrendingUp } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

const GOAL_ICONS = {
  '🏠': 'House',
  '🚗': 'Car',
  '✈️': 'Travel',
  '💍': 'Wedding',
  '🎓': 'Education',
  '💼': 'Business',
  '🏖️': 'Vacation',
  '💰': 'Emergency Fund',
  '🎯': 'General',
};

export default function GoalCard({ goal, onClick, currency = 'USD' }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const progress = ((parseFloat(goal.current_amount) || 0) / (parseFloat(goal.target_amount) || 1)) * 100;
  const remaining = (parseFloat(goal.target_amount) || 0) - (parseFloat(goal.current_amount) || 0);
  const daysLeft = goal.target_date ? differenceInDays(new Date(goal.target_date), new Date()) : null;
  const isOverdue = goal.target_date && isPast(new Date(goal.target_date)) && progress < 100;

  const getProgressColor = () => {
    if (progress >= 100) return 'green';
    if (progress >= 75) return 'cyan';
    if (progress >= 50) return 'purple';
    if (progress >= 25) return 'blue';
    return 'pink';
  };

  return (
    <NeonCard 
      className="p-5 cursor-pointer" 
      glowColor={getProgressColor()}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{goal.icon || '🎯'}</div>
          <div>
            <p className="text-white font-semibold text-lg">{goal.name}</p>
            {goal.target_date && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                  {isOverdue ? 'Overdue' : daysLeft > 0 ? `${daysLeft} days left` : 'Today'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-cyan-400 font-bold text-lg">{progress.toFixed(0)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Current</p>
          <p className="text-white font-semibold">{formatCurrency(goal.current_amount)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Target</p>
          <p className="text-cyan-400 font-semibold">{formatCurrency(goal.target_amount)}</p>
        </div>
      </div>

      <NeonProgress 
        value={goal.current_amount}
        max={goal.target_amount}
        color={getProgressColor()}
        size="md"
        showLabel={false}
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-slate-400 text-sm">Remaining</span>
        <span className="text-white font-medium">{formatCurrency(remaining)}</span>
      </div>

      {progress >= 100 && (
        <div className="mt-3 bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2 text-center">
          <p className="text-green-400 text-sm font-medium">🎉 Goal Achieved!</p>
        </div>
      )}
    </NeonCard>
  );
}