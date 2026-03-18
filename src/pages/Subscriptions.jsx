import React, { useState, useEffect } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import IOSPicker from '@/components/ui/IOSPicker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, RefreshCw, AlertCircle, Calendar, Bell, Filter, X, Lock } from "lucide-react";
import MobileDatePicker from '@/components/ui/MobileDatePicker';
import { usePremium } from '@/components/providers/PremiumProvider';
import PaywallGate from '@/components/subscription/PaywallGate';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, addDays, addMonths, addYears, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from "sonner";

const CATEGORIES = [
  { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'purple' },
  { value: 'utilities', label: 'Utilities', icon: '💡', color: 'blue' },
  { value: 'housing', label: 'Housing', icon: '🏠', color: 'pink' },
  { value: 'transport', label: 'Transport', icon: '🚗', color: 'cyan' },
  { value: 'health', label: 'Health & Fitness', icon: '🏋️', color: 'green' },
  { value: 'food', label: 'Food & Delivery', icon: '🍔', color: 'teal' },
  { value: 'shopping', label: 'Shopping', icon: '🛒', color: 'pink' },
  { value: 'other', label: 'Other', icon: '💼', color: 'blue' },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'green', bgClass: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Paused', color: 'yellow', bgClass: 'bg-yellow-500/20 text-yellow-400' },
  cancelled: { label: 'Cancelled', color: 'gray', bgClass: 'bg-slate-500/20 text-slate-400' },
};

const PRO_CARD_LIMIT = 5;

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentTier, isElite, isPremium } = usePremium();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowAddModal(false);
      toast.success('Subscription added');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowAddModal(false);
      setEditingSubscription(null);
      toast.success('Subscription updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Subscription.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription deleted');
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    icon: '🔄',
    category: 'other',
    amount: '',
    billing_frequency: 'monthly',
    custom_interval_days: '',
    next_due_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'card',
    status: 'active',
    reminder_enabled: false,
    reminder_days_before: 3,
    notes: '',
  });

  React.useEffect(() => {
    if (editingSubscription) {
      setFormData({
        name: editingSubscription.name || '',
        icon: editingSubscription.icon || '🔄',
        category: editingSubscription.category || 'other',
        amount: editingSubscription.amount?.toString() || '',
        billing_frequency: editingSubscription.billing_frequency || 'monthly',
        custom_interval_days: editingSubscription.custom_interval_days?.toString() || '',
        next_due_date: editingSubscription.next_due_date || format(new Date(), 'yyyy-MM-dd'),
        payment_method: editingSubscription.payment_method || 'card',
        status: editingSubscription.status || 'active',
        reminder_enabled: editingSubscription.reminder_enabled || false,
        reminder_days_before: editingSubscription.reminder_days_before || 3,
        notes: editingSubscription.notes || '',
      });
      setShowAddModal(true);
    }
  }, [editingSubscription]);

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      icon: formData.icon,
      category: formData.category,
      amount: parseFloat(formData.amount),
      billing_frequency: formData.billing_frequency,
      custom_interval_days: formData.billing_frequency === 'custom' ? parseInt(formData.custom_interval_days) : undefined,
      next_due_date: formData.next_due_date,
      payment_method: formData.payment_method,
      status: formData.status,
      reminder_enabled: formData.reminder_enabled,
      reminder_days_before: parseInt(formData.reminder_days_before),
      notes: formData.notes,
    };

    if (editingSubscription) {
      updateMutation.mutate({ id: editingSubscription.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '🔄',
      category: 'other',
      amount: '',
      billing_frequency: 'monthly',
      custom_interval_days: '',
      next_due_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'card',
      status: 'active',
      reminder_enabled: false,
      reminder_days_before: 3,
      notes: '',
    });
    setEditingSubscription(null);
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

  const calculateMonthlyAmount = (sub) => {
    const amount = sub.amount || 0;
    switch (sub.billing_frequency) {
      case 'weekly': return amount * 4.33;
      case 'yearly': return amount / 12;
      case 'custom':
        if (sub.custom_interval_days) {
          return (amount * 30) / sub.custom_interval_days;
        }
        return amount;
      default: return amount;
    }
  };

  const cardCount = subscriptions.length;
  const isAtProLimit = isPremium && !isElite && cardCount >= PRO_CARD_LIMIT;
  const isAtCardLimit = isAtProLimit;

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalMonthly = activeSubscriptions.reduce((sum, sub) => sum + calculateMonthlyAmount(sub), 0);
  const totalYearly = totalMonthly * 12;

  const getCategoryInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[7];

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { label: 'No date', color: 'slate', urgent: false, overdue: false };
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return { label: 'No date', color: 'slate', urgent: false, overdue: false };
    if (isPast(due) && !isToday(due)) return { label: 'Overdue', color: 'red', urgent: true, overdue: true };
    if (isToday(due)) return { label: 'Due today', color: 'orange', urgent: true, overdue: false };
    if (isTomorrow(due)) return { label: 'Due tomorrow', color: 'yellow', urgent: true, overdue: false };
    const daysUntil = differenceInDays(due, new Date());
    if (daysUntil <= 7) return { label: `Due in ${daysUntil}d`, color: 'cyan', urgent: false, overdue: false };
    return { label: format(due, 'MMM d'), color: 'slate', urgent: false, overdue: false };
  };

  const getReminders = () => {
    const now = new Date();
    return activeSubscriptions
      .filter(sub => {
        if (!sub.reminder_enabled) return false;
        const daysUntilDue = differenceInDays(new Date(sub.next_due_date), now);
        return daysUntilDue <= sub.reminder_days_before && daysUntilDue >= 0;
      })
      .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
  };

  const reminders = getReminders();
  const overdueSubscriptions = activeSubscriptions.filter(sub => {
    const due = new Date(sub.next_due_date);
    return isPast(due) && !isToday(due);
  });

  const upcomingSubscriptions = activeSubscriptions
    .filter(sub => differenceInDays(new Date(sub.next_due_date), new Date()) <= 7)
    .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));

  let filteredSubs = subscriptions.filter(sub => {
    const categoryMatch = filterCategory === 'all' || sub.category === filterCategory;
    const statusMatch = filterStatus === 'all' || sub.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  if (sortBy === 'due_date') {
    filteredSubs = [...filteredSubs].sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
  } else if (sortBy === 'amount') {
    filteredSubs = [...filteredSubs].sort((a, b) => b.amount - a.amount);
  } else if (sortBy === 'recent') {
    filteredSubs = [...filteredSubs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }

  return (
    <SpaceBackground>
      <SubPageHeader title="Subscriptions" />
      <PaywallGate featureId="subscriptions_tracker" requiredTier="pro">
      <main className="pb-24 px-4 sm:px-6">
        <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 py-4">

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <NeonCard className="p-3 sm:p-4 text-center" glowColor="cyan">
              <p className="text-slate-400 text-xs mb-1">Per Month</p>
              <p className="text-white font-bold text-sm sm:text-lg whitespace-nowrap">{formatCurrency(totalMonthly)}</p>
            </NeonCard>
            <NeonCard className="p-3 sm:p-4 text-center" glowColor="purple">
              <p className="text-slate-400 text-xs mb-1">Per Year</p>
              <p className="text-white font-bold text-sm sm:text-lg whitespace-nowrap">{formatCurrency(totalYearly)}</p>
            </NeonCard>
            <NeonCard className="p-3 sm:p-4 text-center" glowColor="green">
              <p className="text-slate-400 text-xs mb-1">Active</p>
              <p className="text-white font-bold text-sm sm:text-lg whitespace-nowrap">{activeSubscriptions.length}</p>
            </NeonCard>
          </div>

          {/* Overdue Bills Alert */}
          {overdueSubscriptions.length > 0 && (
            <NeonCard className="p-5 border-2 border-red-500/50" glowColor="pink">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                <h3 className="text-red-400 font-semibold">⚠️ Overdue Bills</h3>
              </div>
              <div className="space-y-2">
                {overdueSubscriptions.map(sub => {
                  const catInfo = getCategoryInfo(sub.category);
                  const daysOverdue = Math.abs(differenceInDays(new Date(sub.next_due_date), new Date()));
                  return (
                    <div key={sub.id} className="flex items-center justify-between bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub.icon || catInfo.icon}</span>
                        <div>
                          <p className="text-white font-medium">{sub.name}</p>
                          <p className="text-xs text-red-400">Overdue by {daysOverdue} day{daysOverdue > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <p className="text-red-400 font-semibold whitespace-nowrap">{formatCurrency(sub.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </NeonCard>
          )}

          {/* Reminders */}
          {reminders.length > 0 && (
            <NeonCard className="p-5" glowColor="purple">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Active Reminders</h3>
              </div>
              <div className="space-y-2">
                {reminders.map(sub => {
                  const dueStatus = getDueDateStatus(sub.next_due_date);
                  const catInfo = getCategoryInfo(sub.category);
                  const daysUntil = differenceInDays(new Date(sub.next_due_date), new Date());
                  return (
                    <div key={sub.id} className="flex items-center justify-between bg-purple-900/20 border border-purple-500/30 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub.icon || catInfo.icon}</span>
                        <div>
                          <p className="text-white font-medium">{sub.name}</p>
                          <p className="text-xs text-purple-400 flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            {daysUntil === 0 ? 'Due today!' : `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                      <p className="text-purple-400 font-semibold whitespace-nowrap">{formatCurrency(sub.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </NeonCard>
          )}

          {/* Upcoming Charges */}
          {upcomingSubscriptions.length > 0 && overdueSubscriptions.length === 0 && reminders.length === 0 && (
            <NeonCard className="p-5" glowColor="cyan">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-semibold">Upcoming Charges</h3>
              </div>
              <div className="space-y-2">
                {upcomingSubscriptions.slice(0, 3).map(sub => {
                  const dueStatus = getDueDateStatus(sub.next_due_date);
                  const catInfo = getCategoryInfo(sub.category);
                  return (
                    <div key={sub.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub.icon || catInfo.icon}</span>
                        <div>
                          <p className="text-white font-medium">{sub.name}</p>
                          <p className="text-xs text-slate-400">{dueStatus.label}</p>
                        </div>
                      </div>
                      <p className="text-white font-semibold whitespace-nowrap">{formatCurrency(sub.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </NeonCard>
          )}

          {/* Pro tier usage counter */}
          {isPremium && !isElite && (
            <p className="text-slate-400 text-xs text-center">
              {cardCount} / {PRO_CARD_LIMIT} subscriptions — Upgrade to Elite for unlimited
            </p>
          )}

          {/* Add Button or Upgrade card */}
          {isAtCardLimit ? (
            <NeonCard className="p-4 text-center" glowColor="cyan">
              <p className="text-white font-semibold mb-1">🚫 {cardCount}/{PRO_CARD_LIMIT} cards — Pro limit reached!</p>
              <p className="text-slate-400 text-sm mb-3">Upgrade to Elite for unlimited cards</p>
              <NeonButton
                className="w-full"
                onClick={() => navigate(createPageUrl('Paywall'), { state: { featureName: 'Unlimited Cards', requiredTier: 'elite' } })}
              >
                <Lock className="w-4 h-4" />
                Upgrade to Elite
              </NeonButton>
            </NeonCard>
          ) : (
            <NeonButton onClick={() => { resetForm(); setShowAddModal(true); }} className="w-full" variant="purple">
              <Plus className="w-5 h-5" />
              Add Subscription
            </NeonButton>
          )}

          {/* Filters */}
          <div className="grid grid-cols-3 gap-3">
            <IOSPicker
              value={filterCategory}
              onValueChange={setFilterCategory}
              title="All Categories"
              options={[
                { value: 'all', label: 'All Categories' },
                ...CATEGORIES.map(c => ({ value: c.value, label: c.label, icon: c.icon }))
              ]}
            />
            <IOSPicker
              value={filterStatus}
              onValueChange={setFilterStatus}
              title="Status"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <IOSPicker
              value={sortBy}
              onValueChange={setSortBy}
              title="Sort By"
              options={[
                { value: 'due_date', label: 'Due Date' },
                { value: 'amount', label: 'Amount' },
                { value: 'recent', label: 'Recent' },
              ]}
            />
          </div>

          {/* Subscriptions List */}
          <div className="space-y-3">
            {filteredSubs.map((sub, index) => {
              const catInfo = getCategoryInfo(sub.category);
              const statusInfo = STATUS_CONFIG[sub.status];
              const dueStatus = getDueDateStatus(sub.next_due_date);
              const monthlyAmount = calculateMonthlyAmount(sub);

              const isOverdue = dueStatus.overdue;
              const hasActiveReminder = sub.reminder_enabled && 
                differenceInDays(new Date(sub.next_due_date), new Date()) <= sub.reminder_days_before &&
                differenceInDays(new Date(sub.next_due_date), new Date()) >= 0;

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NeonCard 
                    className={`p-4 ${isOverdue ? 'border-2 border-red-500/50' : ''}`}
                    glowColor={isOverdue ? 'pink' : catInfo.color}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                            isOverdue ? 'bg-red-900/30 ring-2 ring-red-500/50' : 'bg-slate-800/50'
                          }`}
                        >
                          {sub.icon || catInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">{sub.name}</p>
                            {isOverdue && (
                              <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-slate-400 text-sm">{catInfo.label}</p>
                          {sub.detected_from_statement && (
                            <span className="text-xs text-cyan-400">📊 Detected</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingSubscription(sub)}
                          className="p-2 text-slate-400 hover:text-cyan-400"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(sub.id)}
                          className="p-2 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                      <div>
                        <p className="text-slate-500 text-xs">Amount</p>
                        <p className="text-white font-medium text-sm sm:text-base whitespace-nowrap">{formatCurrency(sub.amount)}</p>
                        <p className="text-slate-500 text-xs capitalize">{sub.billing_frequency}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Monthly</p>
                        <p className="text-white font-medium text-sm sm:text-base whitespace-nowrap">{formatCurrency(monthlyAmount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Next Due</p>
                        <p className={`font-medium text-sm sm:text-base whitespace-nowrap ${
                          isOverdue ? 'text-red-400' : 
                          dueStatus.urgent ? 'text-orange-400' : 
                          'text-cyan-400'
                        }`}>
                          {dueStatus.label}
                        </p>
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="mb-3 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                        <p className="text-red-400 text-xs font-medium">
                          ⚠️ This bill is overdue! Please pay as soon as possible.
                        </p>
                      </div>
                    )}

                    {hasActiveReminder && !isOverdue && (
                      <div className="mb-3 bg-purple-900/20 border border-purple-500/30 rounded-lg px-3 py-2">
                        <p className="text-purple-400 text-xs font-medium flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          Reminder active - Due in {differenceInDays(new Date(sub.next_due_date), new Date())} day(s)
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-lg ${statusInfo.bgClass}`}>
                          {statusInfo.label}
                        </span>
                        {sub.reminder_enabled && (
                          <Bell className={`w-4 h-4 ${hasActiveReminder ? 'text-purple-400' : 'text-yellow-400'}`} />
                        )}
                      </div>
                      <p className="text-slate-500 text-xs capitalize">{sub.payment_method}</p>
                    </div>
                  </NeonCard>
                </motion.div>
              );
            })}

            {filteredSubs.length === 0 && (
              <NeonCard className="p-8 text-center">
                <p className="text-4xl mb-4">🔄</p>
                <p className="text-white font-medium">No subscriptions tracked yet</p>
                <p className="text-slate-400 text-sm mt-2">
                  Add your recurring payments to track spending
                </p>
              </NeonCard>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
            </DialogTitle>

          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
            <div>
              <Label className="text-slate-300 text-sm">Service Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Netflix, Gym, Rent"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-12"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Icon (Emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🔄"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-12 text-2xl text-center"
                maxLength={2}
              />
            </div>

            <div>
              <Label className="text-slate-300">Category</Label>
              <IOSPicker
                value={formData.category}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                title="Select Category"
                options={CATEGORIES.map(c => ({ value: c.value, label: c.label, icon: c.icon }))}
                triggerClassName="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">Amount</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="99"
                  className="bg-slate-800 border-slate-700 text-white mt-1 h-12"
                />
              </div>
              <div>
                <Label className="text-slate-300">Frequency</Label>
                <IOSPicker
                  value={formData.billing_frequency}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, billing_frequency: v }))}
                  title="Billing Frequency"
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                  triggerClassName="mt-1"
                />
              </div>
            </div>

            {formData.billing_frequency === 'custom' && (
              <div>
                <Label className="text-slate-300">Every X Days</Label>
                <Input
                  type="number"
                  value={formData.custom_interval_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_interval_days: e.target.value }))}
                  placeholder="e.g. 14 for every 2 weeks"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">Next Due Date</Label>
                <MobileDatePicker
                  value={formData.next_due_date}
                  onChange={(v) => setFormData(prev => ({ ...prev, next_due_date: v }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Payment Method</Label>
                <IOSPicker
                  value={formData.payment_method}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}
                  title="Payment Method"
                  options={[
                    { value: 'card', label: 'Card', icon: '💳' },
                    { value: 'cash', label: 'Cash', icon: '💵' },
                    { value: 'bank', label: 'Bank', icon: '🏦' },
                    { value: 'wallet', label: 'Wallet', icon: '👜' },
                  ]}
                  triggerClassName="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Status</Label>
              <IOSPicker
                value={formData.status}
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                title="Status"
                options={[
                  { value: 'active', label: 'Active', icon: '✅' },
                  { value: 'paused', label: 'Paused', icon: '⏸️' },
                  { value: 'cancelled', label: 'Cancelled', icon: '❌' },
                ]}
                triggerClassName="mt-1"
              />
            </div>

            <div className="space-y-3 bg-slate-800/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Send Reminders</Label>
                <Switch 
                  checked={formData.reminder_enabled}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, reminder_enabled: v }))}
                />
              </div>
              
              {formData.reminder_enabled && (
                <div>
                  <Label className="text-slate-300">Remind me</Label>
                  <IOSPicker
                    value={formData.reminder_days_before.toString()}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, reminder_days_before: parseInt(v) }))}
                    title="Reminder"
                    options={[
                      { value: '1', label: '1 day before' },
                      { value: '3', label: '3 days before' },
                      { value: '7', label: '7 days before' },
                    ]}
                    triggerClassName="mt-1"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-slate-300 text-sm">Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes..."
                className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[70px]"
              />
            </div>
          
          {/* Extra spacing */}
          <div className="h-4" />
          </div>
          
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 sm:px-6 py-4 pb-safe">
            <div className="flex gap-3">
              <NeonButton
                type="button"
                variant="secondary"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="hidden sm:flex flex-1 min-h-[52px]"
              >
                Cancel
              </NeonButton>
              <NeonButton 
                onClick={handleSubmit}
                loading={createMutation.isPending || updateMutation.isPending}
                disabled={!formData.name || !formData.amount}
                className="w-full sm:flex-1 min-h-[52px] text-base font-semibold"
                variant="purple"
              >
                {editingSubscription ? 'Update' : 'Add'} Subscription
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </PaywallGate>
      <BottomNav currentPage="Subscriptions" />
      </SpaceBackground>
      );
      }