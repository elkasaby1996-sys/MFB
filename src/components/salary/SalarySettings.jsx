import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import NeonButton from '@/components/ui/NeonButton';
import NeonCard from '@/components/ui/NeonCard';
import { toast } from 'sonner';
import { DollarSign, Calendar, Info } from 'lucide-react';

export default function SalarySettings({ profile }) {
  const queryClient = useQueryClient();
  const [salaryAmount, setSalaryAmount] = useState(profile?.salary_amount || '');
  const [salaryDay, setSalaryDay] = useState(profile?.salary_day || '');
  const [autoLog, setAutoLog] = useState(profile?.salary_auto_log || false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Salary settings saved!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleSave = () => {
    const day = parseInt(salaryDay);
    if (salaryAmount && (isNaN(day) || day < 1 || day > 31)) {
      toast.error('Please enter a valid day (1–31)');
      return;
    }
    updateMutation.mutate({
      salary_amount: parseFloat(salaryAmount) || null,
      salary_day: day || null,
      salary_auto_log: autoLog,
    });
  };

  return (
    <div className="space-y-5">
      <NeonCard className="p-4 bg-cyan-500/5 border-cyan-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-slate-400 text-xs leading-relaxed">
            Set your salary amount and pay day. On your salary day (and the day before), 
            you'll be asked to confirm whether you received it — and we'll log it automatically.
          </p>
        </div>
      </NeonCard>

      <div className="space-y-4">
        <div>
          <Label className="text-slate-300 text-sm flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            Monthly Salary ({profile?.currency || 'USD'})
          </Label>
          <Input
            type="number"
            value={salaryAmount}
            onChange={(e) => setSalaryAmount(e.target.value)}
            placeholder="e.g. 5000"
            className="bg-slate-800 border-slate-700 text-white h-12"
          />
        </div>

        <div>
          <Label className="text-slate-300 text-sm flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Salary Day (day of month)
          </Label>
          <Input
            type="number"
            value={salaryDay}
            onChange={(e) => setSalaryDay(e.target.value)}
            placeholder="e.g. 1 (first of month) or 25"
            min={1}
            max={31}
            className="bg-slate-800 border-slate-700 text-white h-12"
          />
          <p className="text-slate-500 text-xs mt-1">
            This also defines your financial month start date.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div>
            <p className="text-white text-sm font-medium">Auto-log Salary</p>
            <p className="text-slate-400 text-xs">Confirm & log on salary day</p>
          </div>
          <Switch
            checked={autoLog}
            onCheckedChange={setAutoLog}
          />
        </div>
      </div>

      {profile?.salary_last_logged_month && (
        <p className="text-slate-500 text-xs text-center">
          Last logged: {profile.salary_last_logged_month}
        </p>
      )}

      <NeonButton
        onClick={handleSave}
        loading={updateMutation.isPending}
        className="w-full"
        disabled={!salaryAmount || !salaryDay}
      >
        Save Salary Settings
      </NeonButton>
    </div>
  );
}