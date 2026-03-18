import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NeonButton from '@/components/ui/NeonButton';
import NeonCard from '@/components/ui/NeonCard';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DollarSign, Check, X, Edit3 } from 'lucide-react';

export default function SalaryCheckModal({ isOpen, onClose, profile, onLogged }) {
  const [mode, setMode] = useState('confirm'); // 'confirm' | 'edit'
  const [customAmount, setCustomAmount] = useState(profile?.salary_amount || '');
  const [logging, setLogging] = useState(false);

  const salaryAmount = profile?.salary_amount || 0;
  const currency = profile?.currency || 'USD';

  const logSalary = async (amount) => {
    setLogging(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const thisMonth = format(new Date(), 'yyyy-MM');

      await base44.entities.Transaction.create({
        amount: parseFloat(amount),
        currency,
        amount_base: parseFloat(amount),
        category: 'Income',
        category_icon: '💰',
        type: 'income',
        date: today,
        notes: 'Auto-logged salary',
        payment_method: 'bank',
        merchant: 'Salary',
      });

      await base44.entities.UserProfile.update(profile.id, {
        salary_last_logged_month: thisMonth,
      });

      toast.success('Salary logged successfully! 💰');
      onLogged?.();
      onClose();
    } catch (error) {
      toast.error('Failed to log salary');
    }
    setLogging(false);
  };

  const handleYes = () => logSalary(salaryAmount);
  const handleCustom = () => logSalary(customAmount);
  const handleNo = async () => {
    // Mark as dismissed for this month so we don't ask again
    const thisMonth = format(new Date(), 'yyyy-MM');
    await base44.entities.UserProfile.update(profile.id, {
      salary_last_logged_month: thisMonth,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white w-[calc(100vw-32px)] max-w-sm mx-auto rounded-2xl p-0 gap-0">
        <DialogTitle className="sr-only">Salary Check</DialogTitle>
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-white text-xl font-bold">Salary Day! 💰</h2>
            <p className="text-slate-400 text-sm mt-1">
              Did you receive your salary?
            </p>
          </div>

          {mode === 'confirm' ? (
            <div className="space-y-4">
              <NeonCard className="p-4 bg-green-500/10 border-green-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Salary amount</span>
                  <span className="text-green-400 font-bold text-lg">
                    {currency} {salaryAmount.toLocaleString()}
                  </span>
                </div>
              </NeonCard>

              <div className="grid grid-cols-3 gap-2">
                <NeonButton
                  onClick={handleYes}
                  loading={logging}
                  className="flex-1 bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Yes
                </NeonButton>
                <NeonButton
                  variant="secondary"
                  onClick={() => setMode('edit')}
                  className="flex-1 flex items-center gap-1"
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </NeonButton>
                <NeonButton
                  variant="ghost"
                  onClick={handleNo}
                  className="flex-1 flex items-center gap-1 text-slate-400"
                >
                  <X className="w-4 h-4" /> No
                </NeonButton>
              </div>

              <p className="text-slate-500 text-xs text-center">
                Tapping "No" will skip logging for this month.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Enter actual amount received</Label>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={`e.g. ${salaryAmount}`}
                  className="bg-slate-800 border-slate-700 text-white mt-1 h-12"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NeonButton variant="secondary" onClick={() => setMode('confirm')}>
                  Back
                </NeonButton>
                <NeonButton
                  onClick={handleCustom}
                  loading={logging}
                  disabled={!customAmount || parseFloat(customAmount) <= 0}
                >
                  Log {currency} {parseFloat(customAmount || 0).toLocaleString()}
                </NeonButton>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}