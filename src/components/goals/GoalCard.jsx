import React from 'react';
import { Button } from '@/components/ui/button';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { Calendar, ChevronRight, Edit3, Sparkles, Target, Trash2 } from 'lucide-react';
import { differenceInDays, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

const accentMap = {
  cyan: {
    badge: 'bg-cyan-500/14 text-cyan-200 ring-1 ring-cyan-400/20',
    icon: 'bg-cyan-500/16 text-cyan-300',
    text: 'text-cyan-300',
  },
  purple: {
    badge: 'bg-purple-500/14 text-purple-200 ring-1 ring-purple-400/20',
    icon: 'bg-purple-500/16 text-purple-300',
    text: 'text-purple-300',
  },
  pink: {
    badge: 'bg-pink-500/14 text-pink-200 ring-1 ring-pink-400/20',
    icon: 'bg-pink-500/16 text-pink-300',
    text: 'text-pink-300',
  },
  green: {
    badge: 'bg-emerald-500/14 text-emerald-200 ring-1 ring-emerald-400/20',
    icon: 'bg-emerald-500/16 text-emerald-300',
    text: 'text-emerald-300',
  },
  teal: {
    badge: 'bg-teal-500/14 text-teal-200 ring-1 ring-teal-400/20',
    icon: 'bg-teal-500/16 text-teal-300',
    text: 'text-teal-300',
  },
  blue: {
    badge: 'bg-blue-500/14 text-blue-200 ring-1 ring-blue-400/20',
    icon: 'bg-blue-500/16 text-blue-300',
    text: 'text-blue-300',
  },
  amber: {
    badge: 'bg-amber-500/14 text-amber-100 ring-1 ring-amber-400/20',
    icon: 'bg-amber-500/16 text-amber-300',
    text: 'text-amber-300',
  },
  red: {
    badge: 'bg-red-500/14 text-red-100 ring-1 ring-red-400/20',
    icon: 'bg-red-500/16 text-red-300',
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
    ? 'Goal reached'
    : daysLeft === null
      ? 'No target date'
      : isOverdue
        ? 'Past target date'
        : daysLeft === 0
          ? 'Due today'
          : `${daysLeft} days left`;

  return (
    <NeonCard className="overflow-hidden p-4 sm:p-5" glowColor={isComplete ? 'green' : goal.color || 'cyan'}>
      <div className="flex items-start gap-3">
        <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl', accent.icon)}>
          <span>{goal.icon || '🎯'}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-white sm:text-lg">{goal.name}</h3>
                {isComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/14 px-2.5 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-400/20">
                    <Sparkles className="h-3.5 w-3.5" />
                    Complete
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 sm:text-sm">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1', accent.badge)}>
                  <Calendar className="h-3.5 w-3.5" />
                  {timelineLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-slate-300 ring-1 ring-white/10">
                  <Target className="h-3.5 w-3.5" />
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className={cn('text-sm font-semibold sm:text-base', accent.text)}>{formatCurrency(currentAmount)}</p>
              <p className="text-xs text-slate-500">of {formatCurrency(targetAmount)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <NeonProgress
              value={currentAmount}
              max={targetAmount || 1}
              color={goal.color || 'cyan'}
              size="xs"
            />

            <div className="grid grid-cols-3 gap-2 text-left">
              <div className="rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Saved</p>
                <p className="mt-1 text-sm font-semibold text-white sm:text-base">{formatCurrency(currentAmount)}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Remaining</p>
                <p className="mt-1 text-sm font-semibold text-white sm:text-base">{formatCurrency(remaining)}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Target</p>
                <p className="mt-1 text-sm font-semibold text-white sm:text-base">{formatCurrency(targetAmount)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="default" size="sm" className="flex-1 sm:flex-none" onClick={onDetails}>
                Details
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-white/[0.03]" onClick={onEdit}>
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-red-500/12 hover:text-red-200" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </NeonCard>
  );
}
