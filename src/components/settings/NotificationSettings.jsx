import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import NeonCard from '@/components/ui/NeonCard';
import { Bell, Home, Wallet, CreditCard, Target } from 'lucide-react';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
  { 
    key: 'notification_bills',
    label: 'Bill Reminders',
    description: 'Get notified about upcoming and overdue bills',
    icon: Home,
  },
  { 
    key: 'notification_budgets',
    label: 'Budget Alerts',
    description: 'Alerts when you reach spending thresholds',
    icon: Wallet,
  },
  { 
    key: 'notification_debts',
    label: 'Debt Reminders',
    description: 'Payment reminders for your debts',
    icon: CreditCard,
  },
  { 
    key: 'notification_goals',
    label: 'Goal Milestones',
    description: 'Celebrate when you reach savings milestones',
    icon: Target,
  },
  { 
    key: 'notification_system',
    label: 'System Updates',
    description: 'Important app updates and features',
    icon: Bell,
  },
];

export default function NotificationSettings({ profile }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Notification preferences updated');
    },
  });

  const handleToggle = (key, value) => {
    updateMutation.mutate({ [key]: value });
  };

  return (
    <div className="space-y-1">
      <p className="text-slate-400 text-sm mb-4">Choose what notifications you want to receive</p>

      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
        {NOTIFICATION_TYPES.map((type, idx) => {
          const Icon = type.icon;
          const isEnabled = profile?.[type.key] ?? true;
          const isLast = idx === NOTIFICATION_TYPES.length - 1;

          return (
            <div
              key={type.key}
              className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-slate-800/70' : ''}`}
            >
              <div className="p-1.5 bg-cyan-500/15 rounded-lg flex-shrink-0">
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight">{type.label}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-tight">{type.description}</p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(value) => handleToggle(type.key, value)}
                disabled={updateMutation.isPending}
                className="scale-75 origin-right"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}