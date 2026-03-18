import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import IOSPicker from '@/components/ui/IOSPicker';
import { Plus, Target, Trash2 } from "lucide-react";
import { formatCurrency } from '../currency/currencyUtils';
import { format } from 'date-fns';

const GOAL_TYPES = [
  { value: 'monthly_fixed', label: 'Fixed amount per month' },
  { value: 'yearly_fixed', label: 'Fixed amount per year' },
  { value: 'monthly_percent', label: 'Percentage of income (monthly)' },
  { value: 'yearly_percent', label: 'Percentage of income (yearly)' },
];

const CATEGORIES = [
  { value: 'all', label: 'All Giving' },
  { value: 'charity', label: 'Charity' },
  { value: 'family_support', label: 'Family Support' },
  { value: 'community', label: 'Community' },
  { value: 'religious', label: 'Religious / Zakat' },
];

export default function GivingGoals({ 
  goals, 
  currentProgress,
  onAdd, 
  onDelete,
  currency 
}) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'monthly_fixed',
    target_amount: '',
    target_percent: '',
    category_focus: 'all',
    start_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = () => {
    onAdd({
      ...formData,
      target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
      target_percent: formData.target_percent ? parseFloat(formData.target_percent) : null,
      currency,
      is_active: true,
    });
    setShowModal(false);
    setFormData({
      name: '',
      goal_type: 'monthly_fixed',
      target_amount: '',
      target_percent: '',
      category_focus: 'all',
      start_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const isPercentGoal = formData.goal_type.includes('percent');

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Giving Goals</h3>
          <NeonButton onClick={() => setShowModal(true)} size="sm" variant="secondary">
            <Plus className="w-4 h-4" />
            Add Goal
          </NeonButton>
        </div>

        {goals.length > 0 ? (
          goals.map(goal => {
            const progress = currentProgress[goal.id] || { current: 0, target: 0 };
            const progressPercent = progress.target > 0 ? (progress.current / progress.target) * 100 : 0;

            return (
              <NeonCard key={goal.id} className="p-4" glowColor="green">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{goal.name}</p>
                      <p className="text-slate-400 text-xs">
                        {GOAL_TYPES.find(t => t.value === goal.goal_type)?.label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(goal.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white font-medium">
                      {goal.goal_type.includes('percent') 
                        ? `${progress.current.toFixed(1)}% / ${progress.target.toFixed(1)}%`
                        : `${formatCurrency(progress.current, currency)} / ${formatCurrency(progress.target, currency)}`
                      }
                    </span>
                  </div>
                  <NeonProgress 
                    value={progress.current} 
                    max={progress.target}
                    color="green"
                    showLabel={false}
                  />
                  {progressPercent >= 100 && (
                    <p className="text-green-400 text-xs">🎉 Goal achieved!</p>
                  )}
                </div>
              </NeonCard>
            );
          })
        ) : (
          <NeonCard className="p-6 text-center">
            <p className="text-4xl mb-2">🎯</p>
            <p className="text-white font-medium mb-1">No giving goals yet</p>
            <p className="text-slate-400 text-sm">Set a goal to track your generosity</p>
          </NeonCard>
        )}
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
          {/* Header with drag handle */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-slate-800">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>
            <h3 className="text-white text-lg font-semibold">Create Giving Goal</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-4">
            <div>
              <Label className="text-slate-300">Goal Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monthly Charity"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-14"
              />
            </div>

            <div>
              <Label className="text-slate-300">Goal Type</Label>
              <IOSPicker
                value={formData.goal_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, goal_type: v }))}
                title="Select Goal Type"
                options={GOAL_TYPES.map(t => ({ value: t.value, label: t.label }))}
                triggerClassName="mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">
                {isPercentGoal ? 'Target Percentage' : 'Target Amount'}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                value={isPercentGoal ? formData.target_percent : formData.target_amount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [isPercentGoal ? 'target_percent' : 'target_amount']: e.target.value
                }))}
                placeholder={isPercentGoal ? "5" : "1000"}
                className="bg-slate-800 border-slate-700 text-white mt-1 h-14"
              />
            </div>

            <div>
              <Label className="text-slate-300">Category Focus</Label>
              <IOSPicker
                value={formData.category_focus}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category_focus: v }))}
                title="Select Category"
                options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                triggerClassName="mt-1"
              />
            </div>

            <div className="h-2" />
          </div>

          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            <NeonButton
              onClick={handleSubmit}
              disabled={!formData.name || (!formData.target_amount && !formData.target_percent)}
              className="w-full min-h-[52px] text-base font-semibold"
              variant="purple"
            >
              Create Goal
            </NeonButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}