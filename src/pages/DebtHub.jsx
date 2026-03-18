import React, { useState } from 'react';
import { usePremium } from '@/components/providers/PremiumProvider';
import PaywallGate from '@/components/subscription/PaywallGate';
import SubPageHeader from '@/components/layout/SubPageHeader';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatMoney } from '@/components/utils/formatMoney';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import StatCard from '@/components/ui/StatCard';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from '@/components/ui/MobileSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DebtCard from '@/components/debt/DebtCard';
import DebtDetailModal from '@/components/debt/DebtDetailModal';
import PayoffStrategy from '@/components/debt/PayoffStrategy';
import AIDebtAdvisor from '@/components/debt/AIDebtAdvisor';
import DebtPaymentTracker from '@/components/debt/DebtPaymentTracker';
import DebtCalculators from '@/components/debt/DebtCalculators';
import { Plus, CreditCard, TrendingDown, Calendar, Percent, Sparkles, X, ChevronRight, Zap, Lock } from "lucide-react";
import { format, addMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import confetti from 'canvas-confetti';

const FREE_DEBT_LIMIT = 5;

export default function DebtHub() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isPremium, isElite } = usePremium();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list('-created_date'),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Debt.create(data),
    onMutate: async (newDebt) => {
      await queryClient.cancelQueries(['debts']);
      const previous = queryClient.getQueryData(['debts']);
      queryClient.setQueryData(['debts'], (old = []) => [
        { ...newDebt, id: `temp-${Date.now()}` },
        ...old,
      ]);
      setShowAddModal(false);
      resetForm();
      toast.success('Debt added');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['debts'], context.previous);
      setShowAddModal(true);
      toast.error('Failed to add debt');
    },
    onSettled: () => queryClient.invalidateQueries(['debts']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Debt.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['debts']);
      const previous = queryClient.getQueryData(['debts']);
      queryClient.setQueryData(['debts'], (old = []) =>
        old.map(d => d.id === id ? { ...d, ...data } : d)
      );
      toast.success('Debt updated');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['debts'], context.previous);
      toast.error('Failed to update debt');
    },
    onSettled: () => queryClient.invalidateQueries(['debts']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Debt.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['debts']);
      const previous = queryClient.getQueryData(['debts']);
      queryClient.setQueryData(['debts'], (old = []) => old.filter(d => d.id !== id));
      setShowDetailModal(false);
      setSelectedDebt(null);
      toast.success('Debt deleted');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['debts'], context.previous);
      toast.error('Failed to delete debt');
    },
    onSettled: () => queryClient.invalidateQueries(['debts']),
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onMutate: async (newTx) => {
      await queryClient.cancelQueries(['transactions']);
      const previous = queryClient.getQueryData(['transactions']);
      queryClient.setQueryData(['transactions'], (old = []) => [
        { ...newTx, id: `temp-tx-${Date.now()}` },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['transactions'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries(['transactions']),
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card',
    original_amount: '',
    current_balance: '',
    interest_rate: '',
    minimum_payment: '',
    preferred_payment: '',
    billing_cycle: 'monthly',
    next_due_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    payment_method: 'bank',
    status: 'active',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'credit_card',
      original_amount: '',
      current_balance: '',
      interest_rate: '',
      minimum_payment: '',
      preferred_payment: '',
      billing_cycle: 'monthly',
      next_due_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      payment_method: 'bank',
      status: 'active',
      notes: '',
    });
  };

  const handleSubmit = () => {
    // Validation with data integrity (prevent NaN downstream)
    const originalAmount = formData.original_amount ? parseFloat(formData.original_amount) : null;
    const currentBalance = parseFloat(formData.current_balance);
    const interestRate = formData.interest_rate ? parseFloat(formData.interest_rate) : null;
    const minimumPayment = parseFloat(formData.minimum_payment);
    const preferredPayment = formData.preferred_payment ? parseFloat(formData.preferred_payment) : null;

    // Validate numeric fields
    if (isNaN(currentBalance) || currentBalance < 0) {
      toast.error('Invalid current balance');
      return;
    }
    if (isNaN(minimumPayment) || minimumPayment <= 0) {
      toast.error('Minimum payment must be greater than 0');
      return;
    }
    if (interestRate !== null && (isNaN(interestRate) || interestRate < 0 || interestRate > 100)) {
      toast.error('APR must be between 0 and 100');
      return;
    }
    if (preferredPayment !== null && (isNaN(preferredPayment) || preferredPayment <= 0)) {
      toast.error('Planned payment must be greater than 0');
      return;
    }

    const data = {
      name: formData.name,
      type: formData.type,
      original_amount: originalAmount,
      current_balance: currentBalance,
      interest_rate: interestRate, // null if empty, not 0
      minimum_payment: minimumPayment,
      preferred_payment: preferredPayment,
      billing_cycle: formData.billing_cycle,
      next_due_date: formData.next_due_date,
      payment_method: formData.payment_method,
      status: formData.status,
      notes: formData.notes,
    };

    createMutation.mutate(data);
  };

  const handleRecordPayment = (debt, amount) => {
    // Create transaction
    createTransactionMutation.mutate({
      amount: amount,
      category: 'Debt Payment',
      category_icon: '💳',
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: `Payment for ${debt.name}`,
      merchant: debt.name,
    });

    // Update debt balance
    const newBalance = Math.max(0, debt.current_balance - amount);
    const newStatus = newBalance === 0 ? 'paid_off' : debt.status;

    updateMutation.mutate({
      id: debt.id,
      data: { 
        current_balance: newBalance,
        status: newStatus,
      },
    });

    // Celebration if paid off
    if (newBalance === 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success('🎉 Debt paid off! You\'re a Debt Slayer!');
    } else {
      toast.success('Payment recorded');
    }
  };

  const currency = profile?.currency || 'USD';

  const debtCount = debts.length;
  const isAtFreeLimit = !isPremium && debtCount >= FREE_DEBT_LIMIT;
  const isAtProLimit = isPremium && !isElite && debtCount >= FREE_DEBT_LIMIT;

  // Calculations with strict data gating to prevent NaN/Infinity
  const activeDebts = debts.filter(d => d.status === 'active');
  const totalDebt = activeDebts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
  const totalMonthlyPayment = activeDebts.reduce((sum, d) => sum + (d.preferred_payment || d.minimum_payment || 0), 0);
  
  // Avg Interest: Only calculate if at least one debt has APR set (including 0%)
  const debtsWithAPR = activeDebts.filter(d => d.interest_rate !== null && d.interest_rate !== undefined);
  const avgInterest = debtsWithAPR.length > 0 && totalDebt > 0
    ? debtsWithAPR.reduce((sum, d) => sum + ((d.interest_rate || 0) * d.current_balance), 0) / totalDebt
    : null;
  
  // Check if all debts have 0% APR (promo scenario)
  const isPromoRate = avgInterest !== null && avgInterest === 0 && debtsWithAPR.length === activeDebts.length;

  // Simple debt-free calculation - requires balance > 0 and payment > 0
  const calculateDebtFreeDate = () => {
    if (totalDebt === 0 || totalMonthlyPayment === 0) return null;
    
    // Use average interest if available, otherwise assume 0%
    const avgRate = avgInterest !== null ? (avgInterest / 100) / 12 : 0;
    
    let remainingDebt = totalDebt;
    let months = 0;

    while (remainingDebt > 0.01 && months < 600) {
      const interest = remainingDebt * avgRate;
      remainingDebt = remainingDebt + interest - totalMonthlyPayment;
      months++;
      
      // If payment doesn't cover interest, can't pay off
      if (avgRate > 0 && totalMonthlyPayment <= (totalDebt * avgRate * 1.01)) return null;
    }

    return months > 0 ? months : null;
  };

  const debtFreeMonths = calculateDebtFreeDate();
  
  // CRITICAL: AI tips require ALL of these conditions
  const totalMinimumPayment = activeDebts.reduce((sum, d) => sum + (d.minimum_payment || 0), 0);
  const hasSufficientDataForTips = totalDebt > 0 
    && totalMonthlyPayment > 0 
    && totalMonthlyPayment > totalMinimumPayment // Must be paying MORE than minimum
    && (avgInterest !== null || debtFreeMonths); // Must have APR OR valid payoff calc

  return (
    <SpaceBackground>
      <SubPageHeader title="Debt & Credit Hub" />
      <PaywallGate featureId="debt_credit" requiredTier="pro">
      <main className="pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-6 py-4">

          {/* Section 1: Snapshot (compact KPI cards) */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Debt"
              value={formatMoney(totalDebt, currency, { decimals: 0 })}
              icon={CreditCard}
              color="pink"
              trend={activeDebts.length > 0 ? `${activeDebts.length} active` : 'None'}
            />
            <StatCard
              label="Monthly Payment"
              value={totalMonthlyPayment > 0 ? formatMoney(totalMonthlyPayment, currency, { decimals: 0 }) : '—'}
              icon={Calendar}
              color="purple"
              trend={totalMonthlyPayment === 0 && totalDebt > 0 ? 'Not set' : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Debt-Free In"
              value={debtFreeMonths ? `${debtFreeMonths}mo` : '—'}
              icon={TrendingDown}
              color="cyan"
              trend={!debtFreeMonths && totalDebt > 0 ? (totalMonthlyPayment === 0 ? 'Set payment' : avgInterest === null ? 'Add APR' : undefined) : undefined}
            />
            <StatCard
              label="Avg Interest"
              value={
                avgInterest !== null 
                  ? (isPromoRate ? '0% (promo)' : `${avgInterest.toFixed(1)}%`)
                  : '—'
              }
              icon={Percent}
              color="blue"
              trend={avgInterest === null && activeDebts.length > 0 ? 'Add APR' : undefined}
            />
          </div>

          {/* Section 2: Primary CTA */}
          {isAtFreeLimit || isAtProLimit ? (
            <NeonCard className="p-4 text-center" glowColor="cyan">
              <p className="text-white font-semibold mb-1">
                {isAtProLimit ? `🔒 ${debtCount}/${FREE_DEBT_LIMIT} debts — Pro limit reached!` : `🔒 ${debtCount}/${FREE_DEBT_LIMIT} debts — Free limit reached!`}
              </p>
              <p className="text-slate-400 text-sm mb-3">
                {isAtProLimit ? 'Upgrade to Elite for unlimited debts' : 'Upgrade to Pro for unlimited debts'}
              </p>
              <NeonButton
                className="w-full"
                onClick={() => navigate(createPageUrl('Paywall'), { state: { featureName: 'Unlimited Debts', requiredTier: isAtProLimit ? 'elite' : 'pro' } })}
              >
                <Lock className="w-4 h-4" />
                {isAtProLimit ? 'Upgrade to Elite' : 'Upgrade to Pro'}
              </NeonButton>
            </NeonCard>
          ) : (
            <NeonButton onClick={() => setShowAddModal(true)} className="w-full" variant="purple">
              <Plus className="w-5 h-5" />
              Add Debt
            </NeonButton>
          )}

          {/* Section 3: "What's next" contextual card */}
          {debts.length === 0 && (
            <NeonCard className="p-4 bg-slate-800/50" glowColor="cyan">
              <div className="flex items-start gap-3">
                <div className="text-3xl">⛓️‍💥</div>
                <div>
                  <p className="text-white font-medium text-sm mb-1">Ready to break free?</p>
                  <p className="text-slate-400 text-sm">
                    Add your first debt to see payoff estimates and personalized strategies.
                  </p>
                </div>
              </div>
            </NeonCard>
          )}

          {debts.length > 0 && totalMonthlyPayment === 0 && (
            <NeonCard className="p-4 bg-yellow-500/10 border border-yellow-500/30" glowColor="teal">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">Add your monthly payment</p>
                  <p className="text-slate-300 text-sm">
                    Set planned payments to calculate your Debt-Free date and get AI tips.
                  </p>
                </div>
              </div>
            </NeonCard>
          )}

          {debts.length > 0 && totalMonthlyPayment > 0 && totalMonthlyPayment <= totalMinimumPayment && (
            <NeonCard className="p-4 bg-orange-500/10 border border-orange-500/30" glowColor="teal">
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">Increase your payment</p>
                  <p className="text-slate-300 text-sm">
                    Pay more than the minimum to reduce debt faster and unlock payoff tips.
                  </p>
                </div>
              </div>
            </NeonCard>
          )}

          {debts.length > 0 && totalMonthlyPayment > totalMinimumPayment && avgInterest === null && (
            <NeonCard className="p-4 bg-blue-500/10 border border-blue-500/30" glowColor="teal">
              <div className="flex items-start gap-3">
                <Percent className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">Add interest rates</p>
                  <p className="text-slate-300 text-sm">
                    Enter APR to estimate total interest and get personalized debt payoff tips.
                  </p>
                </div>
              </div>
            </NeonCard>
          )}

          {hasSufficientDataForTips && debtFreeMonths && debtFreeMonths > 3 && avgInterest !== null && (
            <NeonCard className="p-4" glowColor="teal">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">AI Tip</p>
                  <p className="text-slate-300 text-sm">
                    Adding $100/month to your payment could make you debt-free {Math.max(1, Math.floor(debtFreeMonths * 0.15))} months earlier! 🚀
                  </p>
                </div>
              </div>
            </NeonCard>
          )}

          {/* Section 4: Debt List (moved up - most important) */}
          {debts.length > 0 && (
            <div>
              <h2 className="text-white font-semibold text-base mb-3 px-1">Your Debts</h2>
              <div className="space-y-3">
            {debts.map((debt, index) => (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DebtCard
                  debt={debt}
                  currency={currency}
                  onClick={() => {
                    setSelectedDebt(debt);
                    setShowDetailModal(true);
                  }}
                />
              </motion.div>
            ))}
              </div>
            </div>
          )}

          {/* Section 5: Tools & Calculators (collapsible) */}
          {debts.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <NeonCard className="p-4" glowColor="purple">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h3 className="text-white font-semibold">Tools & Calculators</h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-90" />
                  </div>
                </NeonCard>
              </summary>
              
              <div className="mt-4 space-y-4">
                {/* Payment Tracker */}
                {transactions.filter(t => t.category === 'Debt Payment').length > 0 ? (
                  <DebtPaymentTracker 
                    transactions={transactions}
                    currency={currency}
                  />
                ) : (
                  <NeonCard className="p-6 text-center bg-slate-800/50">
                    <p className="text-slate-400 text-sm">No debt payments logged yet</p>
                  </NeonCard>
                )}

                {/* Payoff Strategy */}
                {activeDebts.length > 1 && (
                  <PayoffStrategy debts={debts} currency={currency} />
                )}

                {/* Calculators */}
                <DebtCalculators currency={currency} />

                {/* AI Debt Advisor */}
                {hasSufficientDataForTips && (
                  <AIDebtAdvisor 
                    debts={debts} 
                    profile={profile}
                    transactions={transactions}
                  />
                )}
              </div>
            </details>
          )}
        </div>
      </main>

      {/* Add Debt Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white w-full h-full sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0 flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Add Debt</DialogTitle>
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="sm:hidden p-2 -mr-2 text-slate-400 active:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Group: Debt Details */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm">Debt Details</h3>
              
              <div>
                <Label className="text-slate-300 text-sm">Debt Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Visa Card, Car Loan"
                  className="bg-slate-800 border-slate-700 text-white mt-1.5 h-12"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Type *</Label>
                <MobileSelect
                  value={formData.type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                  options={[
                    { value: 'credit_card', label: 'Credit Card', icon: '💳' },
                    { value: 'personal_loan', label: 'Personal Loan', icon: '🏦' },
                    { value: 'car_loan', label: 'Car Loan', icon: '🚗' },
                    { value: 'bnpl', label: 'Buy Now Pay Later', icon: '🛍️' },
                    { value: 'student_loan', label: 'Student Loan', icon: '🎓' },
                    { value: 'other', label: 'Other', icon: '📋' },
                  ]}
                  title="Debt Type"
                  triggerClassName="mt-1.5"
                />
              </div>
            </div>

            {/* Group: Balance & Interest */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h3 className="text-white font-semibold text-sm">Balance & Interest</h3>
              
              <div>
                <Label className="text-slate-300 text-sm">Current Balance *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.current_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_balance: e.target.value }))}
                  placeholder="8500"
                  className="bg-slate-800 border-slate-700 text-white mt-1.5 h-12"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Interest Rate (APR %)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: e.target.value }))}
                  placeholder="18.5"
                  className="bg-slate-800 border-slate-700 text-white mt-1.5 h-12"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-slate-500 text-xs mt-1.5">Leave empty if unknown. Enter 0 for 0% promo rates.</p>
              </div>

              <details className="group/advanced">
                <summary className="cursor-pointer text-cyan-400 text-sm font-medium list-none flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 transition-transform group-open/advanced:rotate-90" />
                  Advanced
                </summary>
                <div className="mt-3">
                  <Label className="text-slate-300 text-sm">Original Amount</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={formData.original_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_amount: e.target.value }))}
                    placeholder="10000"
                    className="bg-slate-800 border-slate-700 text-white mt-1.5 h-12"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-slate-500 text-xs mt-1.5">For progress tracking (optional)</p>
                </div>
              </details>
            </div>

            {/* Group: Payments */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h3 className="text-white font-semibold text-sm">Payments</h3>
              
              <div>
                <Label className="text-slate-300 text-sm">Minimum Payment *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.minimum_payment}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_payment: e.target.value }))}
                  placeholder="200"
                  className="bg-slate-800 border-slate-700 text-white mt-1.5 h-12"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Your Planned Payment</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={formData.preferred_payment}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_payment: e.target.value }))}
                  placeholder="300"
                  className="bg-slate-800 border-slate-700 text-white mt-1.5 h-12"
                  min="0"
                  step="0.01"
                />
                <p className="text-slate-500 text-xs mt-1.5">What you actually plan to pay monthly</p>
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Next Due Date</Label>
                <Input
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_due_date: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white mt-1.5 h-12"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Payment Method</Label>
                <MobileSelect
                  value={formData.payment_method}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}
                  options={[
                    { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
                    { value: 'card', label: 'Card', icon: '💳' },
                    { value: 'cash', label: 'Cash', icon: '💵' },
                    { value: 'other', label: 'Other', icon: '💰' },
                  ]}
                  title="Payment Method"
                  triggerClassName="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. 0% promo until June 2026"
                  className="bg-slate-800 border-slate-700 text-white mt-1.5 min-h-[80px]"
                />
              </div>
            </div>
          
          {/* Extra spacing */}
          <div className="h-4" />
          </div>
          
          {/* Sticky Bottom CTA - mobile optimized */}
          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
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
                loading={createMutation.isPending}
                disabled={!formData.name || !formData.current_balance || !formData.minimum_payment}
                className="w-full sm:flex-1 min-h-[52px] text-base font-semibold"
                variant="purple"
              >
                Add Debt
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debt Detail Modal */}
      {selectedDebt && (
        <DebtDetailModal
          debt={selectedDebt}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDebt(null);
          }}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          onDelete={deleteMutation.mutate}
          onRecordPayment={handleRecordPayment}
          currency={currency}
        />
      )}

      </PaywallGate>
      <BottomNav currentPage="DebtHub" />
    </SpaceBackground>
  );
}