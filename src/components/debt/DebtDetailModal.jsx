import React, { useState } from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NeonButton from '@/components/ui/NeonButton';
import { Trash2, DollarSign, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DebtDetailModal({ debt, isOpen, onClose, onUpdate, onDelete, onRecordPayment, currency = 'USD' }) {
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const calculatePayoffData = () => {
    const scenarios = [];
    // CRITICAL: Use 0 if APR is null (assume 0% for missing APR)
    const monthlyRate = debt.interest_rate !== null && debt.interest_rate !== undefined 
      ? (debt.interest_rate / 100) / 12 
      : 0;

    // Scenario 1: Minimum payment only
    const minMonths = calculatePayoffMonths(debt.current_balance, debt.minimum_payment, monthlyRate);
    scenarios.push({
      name: 'Minimum Only',
      months: minMonths.months,
      totalInterest: minMonths.totalInterest,
      monthlyPayment: debt.minimum_payment,
      color: '#ef4444'
    });

    // Scenario 2: Preferred payment
    if (debt.preferred_payment && debt.preferred_payment > debt.minimum_payment) {
      const prefMonths = calculatePayoffMonths(debt.current_balance, debt.preferred_payment, monthlyRate);
      scenarios.push({
        name: 'Your Plan',
        months: prefMonths.months,
        totalInterest: prefMonths.totalInterest,
        monthlyPayment: debt.preferred_payment,
        color: '#10b981'
      });
    }

    // Scenario 3: Extra $100
    const extra100 = calculatePayoffMonths(debt.current_balance, debt.minimum_payment + 100, monthlyRate);
    scenarios.push({
      name: '+$100/month',
      months: extra100.months,
      totalInterest: extra100.totalInterest,
      monthlyPayment: debt.minimum_payment + 100,
      color: '#06b6d4'
    });

    return scenarios;
  };

  const calculatePayoffMonths = (balance, monthlyPayment, monthlyRate) => {
    // Safety checks to prevent NaN/Infinity
    if (!balance || balance <= 0 || !monthlyPayment || monthlyPayment <= 0) {
      return { months: 0, totalInterest: 0 };
    }

    let remaining = balance;
    let months = 0;
    let totalInterest = 0;
    const maxMonths = 600; // Safety limit

    while (remaining > 0.01 && months < maxMonths) {
      const interest = remaining * monthlyRate;
      totalInterest += interest;
      remaining = remaining + interest - monthlyPayment;
      months++;

      // If payment doesn't cover interest, can't pay off
      if (monthlyRate > 0 && monthlyPayment <= interest * 1.01) {
        return { months: Infinity, totalInterest: Infinity };
      }
    }

    return { months, totalInterest };
  };

  const generateChartData = () => {
    // CRITICAL: Use 0 if APR is null
    const monthlyRate = debt.interest_rate !== null && debt.interest_rate !== undefined
      ? (debt.interest_rate / 100) / 12
      : 0;
    const data = [];
    let minBalance = debt.current_balance || 0;
    let prefBalance = debt.current_balance || 0;

    for (let month = 0; month <= 36; month++) {
      const dataPoint = { month };

      if (minBalance > 0.01 && debt.minimum_payment) {
        const minInterest = minBalance * monthlyRate;
        minBalance = minBalance + minInterest - debt.minimum_payment;
        dataPoint.minimum = Math.max(0, minBalance);
      } else {
        dataPoint.minimum = 0;
      }

      if (debt.preferred_payment && debt.preferred_payment > 0 && prefBalance > 0.01) {
        const prefInterest = prefBalance * monthlyRate;
        prefBalance = prefBalance + prefInterest - debt.preferred_payment;
        dataPoint.preferred = Math.max(0, prefBalance);
      }

      data.push(dataPoint);
      if (minBalance <= 0 && prefBalance <= 0) break;
    }

    return data;
  };

  const scenarios = calculatePayoffData();
  const chartData = generateChartData();

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Debt.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['debts']);
      const previousDebts = queryClient.getQueryData(['debts']);
      
      queryClient.setQueryData(['debts'], (old = []) =>
        old.map(debt => debt.id === id ? { ...debt, ...data } : debt)
      );
      
      return { previousDebts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['debts'], context.previousDebts);
      toast.error('Failed to update debt');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['debts']);
      toast.success('Payment recorded');
    },
  });

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0) {
      const newBalance = Math.max(0, (debt.current_balance || 0) - amount);
      const updatedData = { current_balance: newBalance };
      
      if (newBalance === 0) {
        updatedData.status = 'paid_off';
      }
      
      updateDebtMutation.mutate({ id: debt.id, data: updatedData });
      setPaymentAmount('');
      setShowPaymentForm(false);
      
      // Also call the parent callback for transaction creation
      if (onRecordPayment) {
        onRecordPayment(debt, amount);
      }
    }
  };

  const handleMarkPaidOff = () => {
    updateDebtMutation.mutate({ 
      id: debt.id, 
      data: { status: 'paid_off', current_balance: 0 } 
    });
    
    // Also call the parent callback
    if (onUpdate) {
      onUpdate(debt.id, { status: 'paid_off', current_balance: 0 });
    }
  };

  if (!debt) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>
        
        <div className="px-5 pb-4">
          <h3 className="text-white text-lg font-semibold">{debt.name}</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-6 pb-6">
          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Current Balance</p>
              <p className="text-white font-bold text-xl">{formatMoney(debt.current_balance, currency)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Interest Rate</p>
              <p className="text-orange-400 font-bold text-xl">
                {debt.interest_rate !== null && debt.interest_rate !== undefined
                  ? (debt.interest_rate === 0 ? '0% (promo)' : `${debt.interest_rate}%`)
                  : <span className="text-slate-500 text-base">Not set</span>}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Next Due</p>
              <p className="text-cyan-400 font-bold text-lg">{format(new Date(debt.next_due_date), 'MMM d')}</p>
            </div>
          </div>

          {/* Payoff Scenarios */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-cyan-400" />
              Payoff Scenarios
            </h3>
            <div className="space-y-3">
              {scenarios.map((scenario, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{scenario.name}</p>
                    <p className="text-slate-400 text-sm">{formatMoney(scenario.monthlyPayment, currency)}/mo</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Debt-free in: <span className="text-cyan-400 font-medium">
                        {scenario.months === Infinity ? 'Never (payment too low)' : `${scenario.months} months`}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Interest: <span className="text-orange-400 font-medium">
                        {scenario.totalInterest === Infinity ? '—' : formatMoney(scenario.totalInterest, currency)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projection Chart */}
          <div>
            <h3 className="text-white font-semibold mb-3">Balance Over Time</h3>
            <div className="bg-slate-800/30 rounded-xl p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8"
                    label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value) => formatMoney(value, currency)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minimum" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Minimum Payment"
                    dot={false}
                  />
                  {debt.preferred_payment && (
                    <Line 
                      type="monotone" 
                      dataKey="preferred" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Your Plan"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        
        </div>
        
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-4 sm:px-6 py-4 space-y-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            {!showPaymentForm ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NeonButton
                  onClick={() => setShowPaymentForm(true)}
                  variant="primary"
                  className="w-full min-h-[48px]"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </NeonButton>
                <NeonButton
                  onClick={handleMarkPaidOff}
                  variant="secondary"
                  className="w-full min-h-[48px]"
                  disabled={debt.status === 'paid_off'}
                >
                  Mark Paid Off
                </NeonButton>
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
                <Label className="text-slate-300 text-sm">Payment Amount</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-slate-800 border-slate-700 text-white h-12"
                  autoFocus
                />
                <div className="flex gap-2">
                  <NeonButton onClick={handleRecordPayment} className="flex-1 min-h-[48px]">
                    Confirm Payment
                  </NeonButton>
                  <NeonButton 
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentAmount('');
                    }}
                    variant="ghost"
                    className="min-h-[48px]"
                  >
                    Cancel
                  </NeonButton>
                </div>
              </div>
            )}

            <NeonButton
              onClick={() => onDelete(debt.id)}
              variant="danger"
              className="w-full min-h-[48px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete Debt
            </NeonButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}