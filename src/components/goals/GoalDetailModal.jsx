import React, { useState } from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { Trash2, DollarSign, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function GoalDetailModal({ 
  goal, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  currency,
  transactions,
}) {
  const queryClient = useQueryClient();
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const { data: contributions = [] } = useQuery({
    queryKey: ['goalContributions', goal?.id],
    queryFn: () => base44.entities.GoalContribution.filter({ goal_id: goal.id }, '-date'),
    enabled: !!goal?.id && isOpen,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.GoalContribution.create(data),
    onSuccess: (newContrib) => {
      queryClient.invalidateQueries(['goalContributions', goal.id]);
      const newTotal = (goal.current_amount || 0) + parseFloat(newContrib.amount);
      onUpdate(goal.id, { current_amount: newTotal });
      if (newTotal >= goal.target_amount) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        toast.success('🎉 Goal Achieved! Amazing work!');
      } else {
        toast.success('Contribution added');
      }
      setContributionAmount('');
      setContributionDate(format(new Date(), 'yyyy-MM-dd'));
      setShowContributionForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GoalContribution.update(id, data),
    onSuccess: (_, { id }) => {
      const old = contributions.find(c => c.id === id);
      const diff = parseFloat(editAmount) - parseFloat(old.amount);
      onUpdate(goal.id, { current_amount: (goal.current_amount || 0) + diff });
      queryClient.invalidateQueries(['goalContributions', goal.id]);
      setEditingId(null);
      toast.success('Contribution updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GoalContribution.delete(id),
    onSuccess: (_, id) => {
      const contrib = contributions.find(c => c.id === id);
      onUpdate(goal.id, { current_amount: Math.max(0, (goal.current_amount || 0) - parseFloat(contrib.amount)) });
      queryClient.invalidateQueries(['goalContributions', goal.id]);
      toast.success('Contribution removed');
    },
  });

  if (!goal) return null;

  const progress = ((parseFloat(goal.current_amount) || 0) / (parseFloat(goal.target_amount) || 1)) * 100;

  const startEdit = (contrib) => {
    setEditingId(contrib.id);
    setEditAmount(contrib.amount.toString());
    setEditDate(contrib.date);
  };

  const saveEdit = () => {
    updateMutation.mutate({ id: editingId, data: { amount: parseFloat(editAmount), date: editDate } });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
        
        <div className="px-5 pb-4">
          <h3 className="text-white text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">{goal.icon}</span>
            {goal.name}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-6 pb-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Progress</span>
              <span className="text-cyan-400 font-bold text-lg">{progress.toFixed(0)}%</span>
            </div>
            <NeonProgress value={goal.current_amount} max={goal.target_amount} color="cyan" size="lg" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-white">{formatCurrency(goal.current_amount)}</span>
              <span className="text-slate-400">{formatCurrency(goal.target_amount)}</span>
            </div>
          </div>

          {/* Contributions History */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              Contributions ({contributions.length})
            </h3>
            {contributions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No contributions yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {contributions.map(contrib => (
                  <div key={contrib.id} className="bg-slate-800/50 rounded-xl p-3">
                    {editingId === contrib.id ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white h-9 w-24 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <MobileDatePicker
                            value={editDate}
                            onChange={setEditDate}
                          />
                        </div>
                        <button onClick={saveEdit} className="text-green-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{formatCurrency(contrib.amount)}</p>
                          <p className="text-slate-400 text-xs">{contrib.date ? format(new Date(contrib.date), 'MMM d, yyyy') : ''}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(contrib)} className="text-slate-400 active:text-cyan-400 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(contrib.id)} className="text-slate-400 active:text-red-400 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Contribution */}
          <div className="space-y-3">
            {!showContributionForm ? (
              <div className="grid grid-cols-2 gap-3">
                <NeonButton onClick={() => setShowContributionForm(true)} variant="primary" className="w-full">
                  <DollarSign className="w-4 h-4" />
                  Add Contribution
                </NeonButton>
                <NeonButton
                  onClick={() => onUpdate(goal.id, { current_amount: goal.target_amount })}
                  variant="secondary"
                  className="w-full"
                  disabled={progress >= 100}
                >
                  Mark Complete
                </NeonButton>
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
                <div>
                  <Label className="text-slate-300 text-sm">Amount</Label>
                  <Input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Date</Label>
                  <MobileDatePicker
                    value={contributionDate}
                    onChange={setContributionDate}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <NeonButton
                    onClick={() => {
                      const amount = parseFloat(contributionAmount);
                      if (amount > 0) {
                        addMutation.mutate({ goal_id: goal.id, amount, date: contributionDate });
                      }
                    }}
                    loading={addMutation.isPending}
                    className="flex-1"
                  >
                    Add to Goal
                  </NeonButton>
                  <NeonButton onClick={() => { setShowContributionForm(false); setContributionAmount(''); }} variant="ghost">
                    Cancel
                  </NeonButton>
                </div>
              </div>
            )}

            <NeonButton onClick={() => onDelete(goal.id)} variant="danger" className="w-full">
              <Trash2 className="w-4 h-4" />
              Delete Goal
            </NeonButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}