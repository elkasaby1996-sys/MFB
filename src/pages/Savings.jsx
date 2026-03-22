import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { ChevronRight, Lock, PiggyBank, Plus } from 'lucide-react';

import { base44 } from '@/api/base44Client';
import { usePremium } from '@/components/providers/PremiumProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import SubPageHeader from '@/components/layout/SubPageHeader';
import BottomNav from '@/components/layout/BottomNav';
import ScreenScrollContainer from '@/components/layout/ScreenScrollContainer';
import SpaceBackground from '@/components/layout/SpaceBackground';
import GoalCard from '@/components/goals/GoalCard';
import GoalDetailModal from '@/components/goals/GoalDetailModal';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import NeonButton from '@/components/ui/NeonButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { motion } from 'framer-motion';

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '💍', '📱', '💻', '🎓', '🏖️', '💰', '🚀', '🎮'];
const GOAL_COLORS = ['cyan', 'purple', 'pink', 'green', 'teal', 'blue', 'amber', 'red'];
const FREE_GOAL_LIMIT = 5;

const colorPreviewMap = {
  cyan: 'from-cyan-500 to-teal-500',
  purple: 'from-purple-500 to-pink-500',
  pink: 'from-pink-500 to-rose-500',
  green: 'from-green-500 to-emerald-500',
  teal: 'from-teal-500 to-cyan-500',
  blue: 'from-blue-500 to-indigo-500',
  amber: 'from-amber-500 to-orange-500',
  red: 'from-red-500 to-pink-500',
};

export default function Savings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentTier } = usePremium();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: goals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SavingsGoal.create(data),
    onMutate: async (newGoal) => {
      await queryClient.cancelQueries(['savingsGoals']);
      const previous = queryClient.getQueryData(['savingsGoals']);
      queryClient.setQueryData(['savingsGoals'], (old = []) => [
        { ...newGoal, id: `temp-${Date.now()}`, current_amount: 0 },
        ...old,
      ]);
      setShowAddModal(false);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['savingsGoals'], context.previous);
      setShowAddModal(true);
    },
    onSettled: () => queryClient.invalidateQueries(['savingsGoals']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavingsGoal.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['savingsGoals']);
      const previous = queryClient.getQueryData(['savingsGoals']);
      queryClient.setQueryData(['savingsGoals'], (old = []) => old.map((g) => (g.id === id ? { ...g, ...data } : g)));
      setShowAddModal(false);
      setEditingGoal(null);
      setSelectedGoal((prev) => (prev?.id === id ? { ...prev, ...data } : prev));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['savingsGoals'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries(['savingsGoals']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavingsGoal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['savingsGoals']);
      const previous = queryClient.getQueryData(['savingsGoals']);
      queryClient.setQueryData(['savingsGoals'], (old = []) => old.filter((g) => g.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['savingsGoals'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries(['savingsGoals']),
  });

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    icon: '🎯',
    color: 'cyan',
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name || '',
        target_amount: editingGoal.target_amount?.toString() || '',
        target_date: editingGoal.target_date || '',
        icon: editingGoal.icon || '🎯',
        color: editingGoal.color || 'cyan',
      });
      setShowAddModal(true);
    }
  }, [editingGoal]);

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      target_date: formData.target_date || null,
      icon: formData.icon,
      color: formData.color,
      current_amount: editingGoal?.current_amount || 0,
    };

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleGoalUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
    setSelectedGoal((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const handleGoalDelete = (id) => {
    deleteMutation.mutate(id);
    setShowDetailModal(false);
    setSelectedGoal(null);
  };

  const resetForm = () => {
    setFormData({ name: '', target_amount: '', target_date: '', icon: '🎯', color: 'cyan' });
    setEditingGoal(null);
  };

  const currency = profile?.currency || 'USD';
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const averageProgress = goals.length > 0 ? goals.reduce((sum, goal) => {
    if (!goal.target_amount) return sum;
    return sum + Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100);
  }, 0) / goals.length : 0;
  const activeGoals = goals.filter((goal) => (goal.current_amount || 0) < (goal.target_amount || 0)).length;
  const nearestGoal = goals.filter((goal) => goal.target_date).sort((a, b) => new Date(a.target_date) - new Date(b.target_date))[0];
  const goalCount = goals.length;
  const isAtLimit = currentTier === 'free' && goalCount >= FREE_GOAL_LIMIT;
  const totalRemaining = Math.max(totalTarget - totalSaved, 0);
  const nearestGoalDays = nearestGoal?.target_date ? differenceInDays(new Date(nearestGoal.target_date), new Date()) : null;

  const openCreateGoal = () => {
    resetForm();
    setShowAddModal(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <SubPageHeader
        title="Savings"
        subtitle={goalCount > 0 ? `${goalCount} goal${goalCount === 1 ? '' : 's'} in progress` : 'Build each goal with a tighter plan'}
        rightContent={
          !isAtLimit ? (
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-200 hover:bg-white/[0.05]" onClick={openCreateGoal}>
              <Plus className="h-5 w-5" />
            </Button>
          ) : null
        }
      />

      <ScreenScrollContainer className="bg-slate-950" contentClassName="pb-[calc(var(--tabbar-offset)+var(--space-4))]">
        <SpaceBackground>
          <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 py-3.5 sm:gap-4 sm:py-4">
            <NeonCard className="overflow-hidden p-4 sm:p-4.5" glowColor="teal">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-slate-400">Total saved</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-white">{formatCurrency(totalSaved)}</h2>
                      <p className="mt-1 text-sm text-slate-500">{formatCurrency(totalRemaining)} left across all goals</p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] ring-1 ring-white/8">
                      <PiggyBank className="h-5 w-5 text-cyan-300" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[12px] text-slate-400">
                  <span>Portfolio progress</span>
                  <span className="font-medium text-slate-300">{averageProgress.toFixed(0)}%</span>
                </div>
                <NeonProgress value={totalSaved} max={totalTarget || 1} color="teal" size="xs" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Goals</p>
                  <p className="mt-1 text-base font-semibold text-white">{goalCount}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Active</p>
                  <p className="mt-1 text-base font-semibold text-white">{activeGoals}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Target</p>
                  <p className="mt-1 truncate text-base font-semibold text-white">{formatCurrency(totalTarget)}</p>
                </div>
              </div>
            </NeonCard>

            <section className="space-y-2">
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <h2 className="text-base font-semibold text-white">Your goals</h2>
                  <p className="mt-0.5 text-[13px] text-slate-500">
                    {currentTier === 'free' ? `${goalCount} / ${FREE_GOAL_LIMIT} savings goals used` : 'Track progress and update details anytime'}
                  </p>
                </div>
                {!isAtLimit && (
                  <Button variant="outline" size="sm" className="h-9 rounded-full px-3.5 text-slate-100" onClick={openCreateGoal}>
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                )}
              </div>

              {nearestGoal && (
                <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-slate-400">
                  <span className="truncate">Next milestone: <span className="text-slate-200">{nearestGoal.name}</span></span>
                  <span className="shrink-0 text-slate-500">{nearestGoalDays !== null && nearestGoalDays >= 0 ? `${nearestGoalDays}d` : 'Past due'}</span>
                </div>
              )}
            </section>

            {isAtLimit ? (
              <NeonCard className="p-4" glowColor="purple">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/12 text-purple-200 ring-1 ring-purple-400/20">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-white">Free plan limit reached</p>
                    <p className="mt-1 text-sm text-slate-400">Upgrade to Pro to add more savings goals and keep every milestone together.</p>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-3 rounded-full px-4"
                      onClick={() => navigate(createPageUrl('Paywall'), { state: { featureName: 'Unlimited Savings Goals', requiredTier: 'pro' } })}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </NeonCard>
            ) : null}

            {goals.length > 0 ? (
              <div className="space-y-2.5">
                {goals.map((goal, index) => (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <GoalCard
                      goal={goal}
                      currency={currency}
                      onDetails={() => {
                        setSelectedGoal(goal);
                        setShowDetailModal(true);
                      }}
                      onEdit={() => setEditingGoal(goal)}
                      onDelete={() => deleteMutation.mutate(goal.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <NeonCard className="p-6 text-center" glowColor="cyan">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/10 text-3xl ring-1 ring-cyan-400/15">🎯</div>
                <h3 className="mt-4 text-lg font-semibold text-white">No savings goals yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-400">Start with one focused target and keep the plan easy to scan.</p>
                <NeonButton variant="secondary" size="md" onClick={openCreateGoal} className="mt-4 rounded-full px-4">
                  <Plus className="h-4 w-4" />
                  Create your first goal
                </NeonButton>
              </NeonCard>
            )}

            {!isAtLimit && goals.length > 0 ? (
              <div className="flex justify-center pt-1">
                <Button variant="ghost" size="sm" className="h-9 rounded-full px-4 text-slate-300 hover:bg-white/[0.04]" onClick={openCreateGoal}>
                  Add another goal
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </SpaceBackground>
      </ScreenScrollContainer>

      <BottomNav currentPage="Savings" />

      <Sheet
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent side="bottom" hideClose className="flex flex-col rounded-t-[28px] border-slate-800 bg-slate-950" style={{ paddingBottom: 0 }}>
          <div className="flex justify-center pb-3 pt-3">
            <div className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="px-5 pb-3">
            <h3 className="text-lg font-semibold text-white">{editingGoal ? 'Edit goal' : 'New savings goal'}</h3>
            <p className="mt-1 text-sm text-slate-500">Set the target, optional date, and the icon you want to see every day.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-5 sm:px-5">
            <div className="space-y-2">
              <Label>Goal name</Label>
              <Input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Emergency fund" className="bg-slate-800/90" />
            </div>

            <div className="space-y-2">
              <Label>Target amount</Label>
              <Input type="number" inputMode="decimal" value={formData.target_amount} onChange={(e) => setFormData((prev) => ({ ...prev, target_amount: e.target.value }))} placeholder="10000" className="bg-slate-800/90 text-lg" />
            </div>

            <div className="space-y-2">
              <Label>Target date</Label>
              <MobileDatePicker value={formData.target_date} onChange={(date) => setFormData((prev) => ({ ...prev, target_date: date }))} placeholder="Select target date" />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                    className={`flex min-h-[44px] items-center justify-center rounded-2xl p-2.5 text-xl transition-all ${
                      formData.icon === icon ? 'bg-cyan-500/16 ring-1 ring-cyan-400/40' : 'bg-slate-800/90'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accent color</Label>
              <div className="grid grid-cols-4 gap-2">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`h-10 rounded-2xl bg-gradient-to-r ${colorPreviewMap[color]} ${formData.color === color ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-slate-950' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-slate-800/90 bg-slate-950/95 px-4 py-3.5 backdrop-blur" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 14px)' }}>
            <NeonButton onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending} disabled={!formData.name || !formData.target_amount} className="w-full min-h-[48px] rounded-2xl text-[15px] font-semibold">
              {editingGoal ? 'Update goal' : 'Create goal'}
            </NeonButton>
          </div>
        </SheetContent>
      </Sheet>

      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedGoal(null);
          }}
          onUpdate={handleGoalUpdate}
          onDelete={handleGoalDelete}
          currency={currency}
          transactions={[]}
        />
      )}
    </div>
  );
}
