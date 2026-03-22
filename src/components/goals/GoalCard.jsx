import React from 'react';
import { Button } from '@/components/ui/button';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { Calendar, ChevronRight, Edit3, Sparkles, Target, Trash2 } from 'lucide-react';
import { differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

const accentMap = {
  cyan: {
    badge: 'bg-cyan-500/12 text-cyan-200 ring-1 ring-cyan-400/15',
    icon: 'bg-cyan-500/12 text-cyan-300',
    text: 'text-cyan-300',
  },
  purple: {
    badge: 'bg-purple-500/12 text-purple-200 ring-1 ring-purple-400/15',
    icon: 'bg-purple-500/12 text-purple-300',
    text: 'text-purple-300',
  },
  pink: {
    badge: 'bg-pink-500/12 text-pink-200 ring-1 ring-pink-400/15',
    icon: 'bg-pink-500/12 text-pink-300',
    text: 'text-pink-300',
  },
  green: {
    badge: 'bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/15',
    icon: 'bg-emerald-500/12 text-emerald-300',
    text: 'text-emerald-300',
  },
  teal: {
    badge: 'bg-teal-500/12 text-teal-200 ring-1 ring-teal-400/15',
    icon: 'bg-teal-500/12 text-teal-300',
    text: 'text-teal-300',
  },
  blue: {
    badge: 'bg-blue-500/12 text-blue-200 ring-1 ring-blue-400/15',
    icon: 'bg-blue-500/12 text-blue-300',
    text: 'text-blue-300',
  },
  amber: {
    badge: 'bg-amber-500/12 text-amber-100 ring-1 ring-amber-400/15',
    icon: 'bg-amber-500/12 text-amber-300',
    text: 'text-amber-300',
  },
  red: {
    badge: 'bg-red-500/12 text-red-100 ring-1 ring-red-400/15',
    icon: 'bg-red-500/12 text-red-300',
    text: 'text-red-300',
  },
};

export default function GoalCard({ goal, currency = 'USD', onDetails, onEdit, onDelete }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const currentAmount = parseFloat(goal.current_amount) || 0;
  const targetAmount = parseFloat(goal.target_amount) || 0;
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(targetAmount - currentAmount, 0);
  const daysLeft = goal.target_date ? differenceInDays(new Date(goal.target_date), new Date()) : null;
  const isOverdue = goal.target_date && isPast(new Date(goal.target_date)) && progress < 100;
  const isComplete = progress >= 100;
  const accent = accentMap[goal.color] || accentMap.cyan;

  const timelineLabel = isComplete
    ? 'Completed'
    : daysLeft === null
      ? 'No date'
      : isOverdue
        ? 'Past due'
        : daysLeft === 0
          ? 'Due today'
          : `${daysLeft}d left`;

  return (
    <NeonCard className="overflow-hidden p-3.5 sm:p-4" glowColor={isComplete ? 'green' : goal.color || 'cyan'}>
      <div className="space-y-3.5">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl', accent.icon)}>
            <span>{goal.icon || '🎯'}</span>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[15px] font-semibold text-white sm:text-base">{goal.name}</h3>
                  {isComplete && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
                      <Sparkles className="h-3 w-3" />
                      Done
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1', accent.badge)}>
                    <Calendar className="h-3 w-3" />
                    {timelineLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-1 text-slate-300 ring-1 ring-white/8">
                    <Target className="h-3 w-3" />
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-white" onClick={onEdit}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-200" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className={cn('text-lg font-semibold tracking-tight sm:text-xl', accent.text)}>{formatCurrency(currentAmount)}</p>
                <p className="text-xs text-slate-500">Saved of {formatCurrency(targetAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Remaining</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(remaining)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <NeonProgress value={currentAmount} max={targetAmount || 1} color={goal.color || 'cyan'} size="xs" />
          <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>{formatCurrency(currentAmount)}</span>
            <span>{formatCurrency(targetAmount)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-3">
          <p className="text-xs text-slate-400">
            {isComplete ? 'Goal reached.' : `${progress.toFixed(0)}% complete`}
          </p>
          <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200" onClick={onDetails}>
            Details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </NeonCard>
  );
}
