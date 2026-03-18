import React, { useState, useEffect } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Plus, Edit, Trash2, Target, Sparkles, Lock } from "lucide-react";
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import GoalDetailModal from '@/components/goals/GoalDetailModal';
import { usePremium } from '@/components/providers/PremiumProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '💍', '📱', '💻', '🎓', '🏖️', '💰', '🚀', '🎮'];
const GOAL_COLORS = ['cyan', 'purple', 'pink', 'green', 'teal', 'blue', 'amber', 'red'];

const FREE_GOAL_LIMIT = 5;

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
      queryClient.setQueryData(['savingsGoals'], (old = []) =>
        old.map(g => g.id === id ? { ...g, ...data } : g)
      );
      setShowAddModal(false);
      setEditingGoal(null);
      setSelectedGoal(prev => prev?.id === id ? { ...prev, ...data } : prev);
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
      queryClient.setQueryData(['savingsGoals'], (old = []) => old.filter(g => g.id !== id));
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
    // refresh selectedGoal state so modal reflects changes
    setSelectedGoal(prev => prev ? { ...prev, ...data } : prev);
  };

  const handleGoalDelete = (id) => {
    deleteMutation.mutate(id);
    setShowDetailModal(false);
    setSelectedGoal(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: '',
      target_date: '',
      icon: '🎯',
      color: 'cyan',
    });
    setEditingGoal(null);
  };

  const currency = profile?.currency || 'USD';
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);

  const goalCount = goals.length;
  const isAtLimit = currentTier === 'free' && goalCount >= FREE_GOAL_LIMIT;

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <SubPageHeader title="Savings Goals" />
      <main className="flex-1 overflow-y-auto">
        <SpaceBackground>
          <div className="px-4 sm:px-6 pb-24">
            <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 py-4">
          
          {/* Total Savings */}
          <NeonCard className="p-4 sm:p-5" glowColor="teal">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 rounded-xl bg-teal-500/20 flex-shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-sm">Total Saved</p>
                <p className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">{formatCurrency(totalSaved)}</p>
              </div>
            </div>
            <NeonProgress 
              value={totalSaved} 
              max={totalTarget || 1}
              color="teal"
            />
            <p className="text-slate-400 text-sm mt-2 text-center whitespace-nowrap">
              {formatCurrency(totalTarget - totalSaved)} to go
            </p>
          </NeonCard>

          {/* Free tier usage counter */}
          {currentTier === 'free' && (
            <p className="text-slate-400 text-xs text-center">
              {goalCount} / {FREE_GOAL_LIMIT} savings goals used
            </p>
          )}

          {/* Add Goal Button or Upgrade Card */}
          {isAtLimit ? (
            <NeonCard className="p-4 text-center" glowColor="purple">
              <p className="text-white font-semibold mb-1">🚫 You've maxed out your 5 free goals!</p>
              <p className="text-slate-400 text-sm mb-3">Upgrade to Pro for unlimited goals</p>
              <NeonButton
                variant="purple"
                className="w-full"
                onClick={() => navigate(createPageUrl('Paywall'), { state: { featureName: 'Unlimited Savings Goals', requiredTier: 'pro' } })}
              >
                <Lock className="w-4 h-4" />
                Upgrade to Pro
              </NeonButton>
            </NeonCard>
          ) : (
            <NeonButton
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="w-full"
              disabled={isAtLimit}
              title={isAtLimit ? 'Upgrade to Pro for unlimited goals' : ''}
            >
              <Plus className="w-5 h-5" />
              Create Savings Goal
            </NeonButton>
          )}

          {/* Goals List */}
          <div className="space-y-3 sm:space-y-4">
            {goals.map((goal, index) => {
              const progress = goal.target_amount 
                ? (goal.current_amount / goal.target_amount) * 100 
                : 0;
              const daysLeft = goal.target_date 
                ? differenceInDays(new Date(goal.target_date), new Date())
                : null;
              const isComplete = progress >= 100;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NeonCard 
                    className="p-4 sm:p-5"
                    glowColor={isComplete ? "green" : goal.color || "cyan"}
                  >
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-2xl sm:text-3xl flex-shrink-0">{goal.icon || '🎯'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm sm:text-base truncate">{goal.name}</p>
                          {daysLeft !== null && daysLeft > 0 && (
                            <p className="text-slate-400 text-sm">
                              {daysLeft} days left
                            </p>
                          )}
                          {isComplete && (
                            <p className="text-green-400 text-sm flex items-center gap-1">
                              <Sparkles className="w-4 h-4" /> Goal reached!
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingGoal(goal)}
                          className="p-2 text-slate-400 hover:text-cyan-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(goal.id)}
                          className="p-2 text-slate-400 hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2 gap-2">
                        <span className="text-teal-400 font-medium whitespace-nowrap">
                          {formatCurrency(goal.current_amount)}
                        </span>
                        <span className="text-slate-400 whitespace-nowrap">
                          {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      <NeonProgress 
                        value={goal.current_amount || 0} 
                        max={goal.target_amount}
                        color={goal.color || "teal"}
                        size="lg"
                      />
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400 text-sm whitespace-nowrap">
                        {progress.toFixed(0)}% complete
                      </span>
                      <NeonButton
                       size="sm"
                       onClick={() => { setSelectedGoal(goal); setShowDetailModal(true); }}
                       className="flex-shrink-0"
                      >
                        <span>Details</span>
                      </NeonButton>
                    </div>
                  </NeonCard>
                </motion.div>
              );
            })}
          </div>

          {goals.length === 0 && (
            <NeonCard className="p-8 text-center">
              <p className="text-4xl mb-4">🎯</p>
              <p className="text-white font-medium">No savings goals yet</p>
              <p className="text-slate-400 text-sm mt-2">
                Create your first goal and start saving!
              </p>
            </NeonCard>
          )}
            </div>
          </div>
        </SpaceBackground>
      </main>
      
      <BottomNav currentPage="Savings" />
      
      {/* Safe area bottom spacer */}
      <div style={{ height: 'var(--safe-area-bottom, 0px)' }} className="bg-slate-900" />

      {/* Add/Edit Goal Modal */}
      <Sheet open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetForm(); }}>
        <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>
          
          <div className="px-5 pb-4">
            <h3 className="text-white text-lg font-semibold">
              {editingGoal ? 'Edit Goal' : 'Create Savings Goal'}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-5 pb-6">
            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Goal Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Emergency Fund"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-12 w-full"
              />
            </div>

            <div className="w-full">
              <Label className="text-slate-300 text-sm">Target Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={formData.target_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                placeholder="e.g. 10000"
                className="bg-slate-800 border-slate-700 text-white text-xl h-14 mt-1 w-full"
              />
            </div>

            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Target Date (optional)</Label>
              <MobileDatePicker
                value={formData.target_date}
                onChange={(date) => setFormData(prev => ({ ...prev, target_date: date }))}
                placeholder="Select target date"
                className="mt-2"
              />
            </div>

            <div className="w-full">
              <Label className="text-slate-300 text-sm sm:text-base">Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-2 w-full">
                {GOAL_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`p-2 sm:p-3 rounded-xl text-xl sm:text-2xl transition-all min-h-[48px] flex items-center justify-center ${
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
              <Label className="text-slate-300 text-sm sm:text-base">Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2 w-full">
                {GOAL_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`h-10 sm:h-12 rounded-xl transition-all min-h-[48px] ${
                      formData.color === color
                        ? 'ring-2 ring-white'
                        : ''
                    } bg-gradient-to-r ${
                      color === 'cyan' ? 'from-cyan-500 to-teal-500' :
                      color === 'purple' ? 'from-purple-500 to-pink-500' :
                      color === 'pink' ? 'from-pink-500 to-rose-500' :
                      color === 'green' ? 'from-green-500 to-emerald-500' :
                      color === 'teal' ? 'from-teal-500 to-cyan-500' :
                      color === 'blue' ? 'from-blue-500 to-indigo-500' :
                      color === 'amber' ? 'from-amber-500 to-orange-500' :
                      'from-red-500 to-pink-500'
                    }`}
                  />
                ))}
              </div>
            </div>

          
        </div>
        
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-4 sm:px-6 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
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
          onClose={() => { setShowDetailModal(false); setSelectedGoal(null); }}
          onUpdate={handleGoalUpdate}
          onDelete={handleGoalDelete}
          currency={currency}
          transactions={[]}
        />
      )}

    </div>
  );
}