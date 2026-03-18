import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { addMonths, format } from 'date-fns';

export default function AddGoalModal({ isOpen, onClose, currency, investments = [] }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    icon: '🎯',
    color: '#06b6d4',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SavingsGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['savingsGoals']);
      toast.success('Goal created');
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
      icon: '🎯',
      color: '#06b6d4',
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.target_amount) {
      toast.error('Please fill in required fields');
      return;
    }

    const targetAmount = parseFloat(formData.target_amount);
    const currentAmount = parseFloat(formData.current_amount);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    if (isNaN(currentAmount) || currentAmount < 0) {
      toast.error('Please enter a valid current amount');
      return;
    }

    const data = {
      name: formData.name,
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: formData.target_date,
      icon: formData.icon,
      color: formData.color,
      currency: currency,
    };

    createMutation.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); } }}>
      <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
        {/* Header with drag handle */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-800">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>
          <h3 className="text-white text-lg font-semibold">Add Financial Goal</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-5 pb-6">
          {/* Emoji */}
          <div>
            <Label className="text-slate-300 text-sm">Emoji</Label>
            <Input
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="🎯"
              className="bg-slate-800 border-slate-700 text-white mt-1 h-12 text-2xl text-center"
              maxLength={4}
            />
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Goal Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. House Down Payment, Dream Vacation"
              className="bg-slate-800 border-slate-700 text-white mt-1 h-12"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-sm">Target Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={formData.target_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                placeholder="50000"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-12"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Current Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={formData.current_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
                placeholder="5000"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-12"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Target Date</Label>
            <MobileDatePicker
              value={formData.target_date}
              onChange={(date) => setFormData(prev => ({ ...prev, target_date: date }))}
              className="mt-1"
            />
          </div>


          {/* Link to Investments (future enhancement) */}
          {investments.length > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
              <p className="text-cyan-400 text-xs">
                💡 Tip: You can link your investments to this goal in the goal details page
              </p>
            </div>
          )}

        
        {/* Extra spacing */}
        <div className="h-4" />
        </div>
        
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-4 sm:px-6 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          <NeonButton 
            onClick={handleSubmit}
            loading={createMutation.isPending}
            disabled={!formData.name || !formData.target_amount}
            className="w-full min-h-[52px] text-base font-semibold"
            variant="primary"
          >
            Create Goal
          </NeonButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}