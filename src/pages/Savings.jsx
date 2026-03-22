import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { Plus, Lock, PiggyBank, Sparkles } from 'lucide-react';

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
  const nearestGoal = goals
    .filter((goal) => goal.target_date)
    .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))[0];
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
        title="Savings Goals"
        rightContent={
          !isAtLimit ? (
            <Button variant="ghost" size="icon" className="text-cyan-300 hover:bg-cyan-500/10" onClick={openCreateGoal}>
              <Plus className="h-5 w-5" />
            </Button>
          ) : null
        }
      />

      <ScreenScrollContainer className="bg-slate-950" contentClassName="pb-[calc(var(--tabbar-offset)+var(--space-6))]">
        <SpaceBackground>
          <div className="mx-auto flex w-full max-w-lg flex-col gap-4 py-4 sm:gap-5 sm:py-5">
            <NeonCard className="overflow-hidden p-5 sm:p-6" glowColor="teal">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/12 px-3 py-1 text-xs font-medium text-cyan-200 ring-1 ring-cyan-400/20">
                    <Sparkles className="h-3.5 w-3.5" />
                    Savings overview
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total saved across your goals</p>
                    <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{formatCurrency(totalSaved)}</h2>
                  </div>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                  <PiggyBank className="h-7 w-7 text-cyan-300" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Portfolio progress</span>
                  <span className="font-medium text-slate-200">{formatCurrency(totalRemaining)} remaining</span>
                </div>
                <NeonProgress value={totalSaved} max={totalTarget || 1} color="teal" size="xs" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/8">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Goals</p>
                  <p className="mt-1 text-lg font-semibold text-white">{goalCount}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/8">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Active</p>
                  <p className="mt-1 text-lg font-semibold text-white">{activeGoals}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/8">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Avg progress</p>
                  <p className="mt-1 text-lg font-semibold text-white">{averageProgress.toFixed(0)}%</p>
                </div>
              </div>

              {(currentTier === 'free' || nearestGoal) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  {currentTier === 'free' && (
                    <span className="rounded-full bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/8">
                      {goalCount} / {FREE_GOAL_LIMIT} goals used
                    </span>
                  )}
                  {nearestGoal && (
                    <span className="rounded-full bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/8">
                      {nearestGoalDays !== null && nearestGoalDays >= 0
                        ? `${nearestGoal.name} due in ${nearestGoalDays} days`
                        : `${nearestGoal.name} is past due`}
                    </span>
                  )}
                </div>
              )}
            </NeonCard>

            {isAtLimit ? (
              <NeonCard className="p-4 sm:p-5" glowColor="purple">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/14 text-purple-200 ring-1 ring-purple-400/20">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-white">You’ve reached the free goal limit</p>
                    <p className="mt-1 text-sm text-slate-400">Upgrade to Pro to create unlimited savings goals and keep every milestone in one place.</p>
                    <Button
                      variant="default"
                      className="mt-4 w-full sm:w-auto"
                      onClick={() => navigate(createPageUrl('Paywall'), { state: { featureName: 'Unlimited Savings Goals', requiredTier: 'pro' } })}
                    >
                      <Lock className="h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </NeonCard>
            ) : (
              <NeonCard className="p-4 sm:p-5" glowColor="cyan">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Create a new goal</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">Turn your next milestone into a focused savings plan.</h3>
                  </div>
                  <Button variant="default" size="lg" className="w-full sm:w-auto" onClick={openCreateGoal}>
                    <Plus className="h-5 w-5" />
                    Create Savings Goal
                  </Button>
                </div>
              </NeonCard>
            )}

            {goals.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {goals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
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
              <NeonCard className="p-8 text-center sm:p-10" glowColor="cyan">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/12 text-3xl ring-1 ring-cyan-400/20">
                  🎯
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">No savings goals yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Start with one clear target and track progress in a calmer, easier-to-scan savings dashboard.
                </p>
                <Button variant="default" size="lg" className="mt-5 w-full sm:w-auto" onClick={openCreateGoal}>
                  <Plus className="h-5 w-5" />
                  Create your first goal
                </Button>
              </NeonCard>
            )}
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
        <SheetContent side="bottom" hideClose className="flex flex-col rounded-t-3xl border-slate-800 bg-slate-950" style={{ paddingBottom: 0 }}>
          <div className="flex justify-center pb-4 pt-3">
            <div className="h-1 w-10 rounded-full bg-slate-700" />
          </div>

          <div className="px-5 pb-4">
            <h3 className="text-lg font-semibold text-white">{editingGoal ? 'Edit Goal' : 'Create Savings Goal'}</h3>
            <p className="mt-1 text-sm text-slate-400">Set a target, pick an icon, and keep the plan simple.</p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="w-full">
              <Label className="text-sm text-slate-300 sm:text-base">Goal Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Emergency Fund"
                className="mt-2 border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="w-full">
              <Label className="text-sm text-slate-300">Target Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={formData.target_amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_amount: e.target.value }))}
                placeholder="e.g. 10000"
                className="mt-2 border-slate-700 bg-slate-800 text-xl text-white"
              />
            </div>

            <div className="w-full">
              <Label className="text-sm text-slate-300 sm:text-base">Target Date (optional)</Label>
              <MobileDatePicker
                value={formData.target_date}
                onChange={(date) => setFormData((prev) => ({ ...prev, target_date: date }))}
                placeholder="Select target date"
                className="mt-2"
              />
            </div>

            <div className="w-full">
              <Label className="text-sm text-slate-300 sm:text-base">Icon</Label>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                    className={`flex min-h-[48px] items-center justify-center rounded-2xl p-3 text-xl transition-all sm:text-2xl ${
                      formData.icon === icon
                        ? 'bg-cyan-500/20 ring-2 ring-cyan-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full">
              <Label className="text-sm text-slate-300 sm:text-base">Color</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`h-12 rounded-2xl bg-gradient-to-r ${colorPreviewMap[color]} ${
                      formData.color === color ? 'ring-2 ring-white' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-4 sm:px-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            <NeonButton
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!formData.name || !formData.target_amount}
              className="w-full min-h-[52px] text-base font-semibold"
            >
              {editingGoal ? 'Update' : 'Create'} Goal
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
