import React from 'react';
import { formatMoney } from '@/components/utils/formatMoney';
import NeonCard from '@/components/ui/NeonCard';
import { DollarSign, Calendar, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function DebtPaymentTracker({ transactions, currency = 'USD' }) {
  // Filter debt payment transactions
  const debtPayments = transactions.filter(
    t => t.type === 'expense' && 
    (t.category === 'Debt Payment' || 
     t.notes?.toLowerCase().includes('payment') ||
     t.category?.toLowerCase().includes('debt'))
  );

  // Calculate this month's payments
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const thisMonthPayments = debtPayments.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const thisMonthTotal = thisMonthPayments.reduce((sum, t) => sum + t.amount, 0);

  // Calculate last 6 months data
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const monthPayments = debtPayments.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
    
    monthlyData.push({
      month: format(date, 'MMM'),
      amount: monthPayments.reduce((sum, t) => sum + t.amount, 0),
    });
  }

  const totalPaid = debtPayments.reduce((sum, t) => sum + t.amount, 0);
  const avgMonthly = monthlyData.reduce((sum, m) => sum + m.amount, 0) / monthlyData.length;

  return (
    <NeonCard className="p-5" glowColor="green">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-green-400" />
        <h3 className="text-white font-semibold">Payment Tracker</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">This Month</p>
          <p className="text-green-400 font-bold text-lg">{formatMoney(thisMonthTotal, currency)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Total Paid</p>
          <p className="text-cyan-400 font-bold text-lg">{formatMoney(totalPaid, currency)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Avg/Month</p>
          <p className="text-purple-400 font-bold text-lg">{formatMoney(avgMonthly, currency)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value) => formatMoney(value, currency)}
              cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
            />
            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Payments */}
      {thisMonthPayments.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-slate-400 text-xs font-medium mb-2">Recent Payments</p>
          {thisMonthPayments.slice(0, 3).map(payment => (
            <div key={payment.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-slate-300 text-sm">{payment.merchant || 'Debt Payment'}</span>
              </div>
              <span className="text-white font-medium text-sm">{formatMoney(payment.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </NeonCard>
  );
}