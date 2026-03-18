import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Bell, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DueSubscriptionsAlert({ profile }) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState([]);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list(),
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      toast.success('Payment logged successfully!');
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
    },
  });

  // Check for due subscriptions (due today or overdue)
  const today = new Date().toISOString().split('T')[0];
  const dueSubscriptions = subscriptions.filter(sub => {
    if (sub.status !== 'active') return false;
    if (dismissed.includes(sub.id)) return false;
    
    const nextBilling = sub.next_due_date;
    if (!nextBilling) return false;
    
    // Due if today or past
    return nextBilling <= today;
  });

  if (dueSubscriptions.length === 0) return null;

  const handlePaymentConfirm = async (subscription) => {
    // Log expense
    const transactionData = {
      type: 'expense',
      amount: subscription.amount,
      category: 'Subscriptions',
      category_icon: '📱',
      date: today,
      notes: `${subscription.name} subscription payment`,
      merchant: subscription.name,
      currency: subscription.currency || profile?.currency || 'USD',
    };

    await createTransactionMutation.mutateAsync(transactionData);

    // Update next billing date based on billing cycle
    const nextDate = new Date(subscription.next_due_date);
    switch (subscription.billing_frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'custom':
        nextDate.setDate(nextDate.getDate() + (subscription.custom_interval_days || 30));
        break;
    }

    await updateSubscriptionMutation.mutateAsync({
      id: subscription.id,
      data: { next_due_date: nextDate.toISOString().split('T')[0] },
    });

    setDismissed(prev => [...prev, subscription.id]);
  };

  const handleDismiss = (subscriptionId) => {
    setDismissed(prev => [...prev, subscriptionId]);
  };

  return (
    <div className="space-y-3">
      {dueSubscriptions.map(sub => (
        <NeonCard key={sub.id} className="p-4" glowColor="purple">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white">{sub.name} Payment Due</h4>
              <p className="text-sm text-slate-400 mt-1">
                {profile?.currency || 'USD'} {sub.amount?.toFixed(2)} • {sub.billing_frequency}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Did you pay this subscription?
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <NeonButton
              size="sm"
              variant="purple"
              onClick={() => handlePaymentConfirm(sub)}
              loading={createTransactionMutation.isPending || updateSubscriptionMutation.isPending}
              className="flex-1"
            >
              <Check className="w-4 h-4" />
              Yes, Log Payment
            </NeonButton>
            <NeonButton
              size="sm"
              variant="ghost"
              onClick={() => handleDismiss(sub.id)}
              className="flex-1"
            >
              <X className="w-4 h-4" />
              Not Yet
            </NeonButton>
          </div>
        </NeonCard>
      ))}
    </div>
  );
}