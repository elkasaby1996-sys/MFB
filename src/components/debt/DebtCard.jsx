import React from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { CreditCard, Car, ShoppingBag, GraduationCap, DollarSign } from "lucide-react";
import { format, isPast, isToday } from 'date-fns';

const DEBT_TYPES = {
  credit_card: { label: 'Credit Card', icon: CreditCard, color: 'purple' },
  personal_loan: { label: 'Personal Loan', icon: DollarSign, color: 'pink' },
  car_loan: { label: 'Car Loan', icon: Car, color: 'cyan' },
  bnpl: { label: 'Buy Now Pay Later', icon: ShoppingBag, color: 'teal' },
  student_loan: { label: 'Student Loan', icon: GraduationCap, color: 'blue' },
  other: { label: 'Other', icon: DollarSign, color: 'blue' },
};

const STATUS_CONFIG = {
  active: { label: 'Active', bgClass: 'bg-green-500/20 text-green-400' },
  paid_off: { label: 'Paid Off', bgClass: 'bg-slate-500/20 text-slate-400' },
  delinquent: { label: 'Overdue', bgClass: 'bg-red-500/20 text-red-400' },
};

export default function DebtCard({ debt, onClick, currency = 'USD' }) {
  const typeInfo = DEBT_TYPES[debt.type] || DEBT_TYPES.other;
  const statusInfo = STATUS_CONFIG[debt.status];
  const Icon = typeInfo.icon;

  const paidPercentage = debt.original_amount 
    ? ((debt.original_amount - debt.current_balance) / debt.original_amount) * 100
    : 0;

  const isDueToday = isToday(new Date(debt.next_due_date));
  const isOverdue = isPast(new Date(debt.next_due_date)) && !isDueToday;

  return (
    <NeonCard 
      className={`p-4 cursor-pointer ${isOverdue && debt.status === 'active' ? 'border-2 border-red-500/50' : ''}`}
      glowColor={typeInfo.color}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${typeInfo.color}-500/20`}>
            <Icon className={`w-6 h-6 text-${typeInfo.color}-400`} />
          </div>
          <div>
            <p className="text-white font-semibold">{debt.name}</p>
            <p className="text-slate-400 text-sm">{typeInfo.label}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-lg ${statusInfo.bgClass}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-slate-500 text-xs">Balance</p>
          <p className="text-white font-bold text-lg">{formatMoney(debt.current_balance, currency)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs">Planned Payment</p>
          <p className="text-white font-medium">
            {debt.preferred_payment 
              ? formatMoney(debt.preferred_payment, currency) 
              : debt.minimum_payment 
              ? formatMoney(debt.minimum_payment, currency)
              : '—'}
          </p>
        </div>
      </div>

      {/* Only show progress if original amount exists */}
      {debt.original_amount && debt.original_amount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-cyan-400">{paidPercentage.toFixed(0)}% paid</span>
          </div>
          <NeonProgress 
            value={debt.original_amount - debt.current_balance}
            max={debt.original_amount}
            color="cyan"
            size="sm"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-slate-500 text-xs">APR</p>
          <p className="text-orange-400 font-medium">
            {debt.interest_rate !== null && debt.interest_rate !== undefined 
              ? `${debt.interest_rate}%` 
              : <span className="text-slate-500">Not set</span>}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs">Next Due</p>
          <p className={`font-medium ${isOverdue ? 'text-red-400' : isDueToday ? 'text-orange-400' : 'text-slate-300'}`}>
            {format(new Date(debt.next_due_date), 'MMM d')}
          </p>
        </div>
      </div>

      {isOverdue && debt.status === 'active' && (
        <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
          <p className="text-red-400 text-xs font-medium">⚠️ Payment overdue!</p>
        </div>
      )}
    </NeonCard>
  );
}