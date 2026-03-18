import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import { formatMoney } from '@/components/utils/formatMoney';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, PiggyBank, Wallet, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import MonthlyReport from '@/components/reports/MonthlyReport';
import YearlyReport from '@/components/reports/YearlyReport';
import ReportExporter from '@/components/reports/ReportExporter';
import { calculateDataPresence } from '@/components/utils/dataPresence';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PaywallGate from '@/components/subscription/PaywallGate';

export default function Reports() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('monthly'); // monthly, yearly
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date());

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
  });

  const currency = profile?.currency || 'USD';

  // Calculate quick stats
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const thisYearTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= yearStart && date <= yearEnd;
  });

  const monthIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const yearIncome = thisYearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const yearExpenses = thisYearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalInvestments = investments.reduce((sum, i) => sum + i.current_value, 0);

  const dataPresence = useMemo(() => {
    return calculateDataPresence(transactions, investments, budgets);
  }, [transactions, investments, budgets]);

  return (
    <SpaceBackground>
      <PaywallGate featureId="financial_reports" requiredTier="pro">
      <main className="pb-24 px-4" style={{ paddingTop: 'max(env(safe-area-inset-top,0px),16px)' }}>
        <div className="max-w-lg mx-auto space-y-4 py-4">
          
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
            </div>
            <p className="text-slate-400 text-sm">Comprehensive financial summaries</p>
          </div>

          {/* No Data State */}
          {dataPresence.state === 'no_data' && (
            <NeonCard className="p-6 bg-slate-800/50" glowColor="cyan">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-xl font-bold text-white mb-2">No Reports Yet</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Start tracking your finances to generate detailed reports
                </p>
                <NeonButton 
                  onClick={() => navigate(createPageUrl('Dashboard'))} 
                  variant="primary" 
                  className="w-full"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </NeonButton>
              </div>
            </NeonCard>
          )}

          {/* Quick Stats */}
          {dataPresence.state !== 'no_data' && (
          <div className="grid grid-cols-2 gap-3">
            <NeonCard className="p-4" glowColor="green">
              <div className="flex items-start justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-[10px] text-slate-400">This Month</span>
              </div>
              <p className="text-green-400 text-xl font-bold">{formatMoney(monthIncome, currency, { decimals: 0 })}</p>
              <p className="text-slate-400 text-xs">Income</p>
              </NeonCard>

              <NeonCard className="p-4" glowColor="pink">
              <div className="flex items-start justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-[10px] text-slate-400">This Month</span>
              </div>
              <p className="text-red-400 text-xl font-bold">{formatMoney(monthExpenses, currency, { decimals: 0 })}</p>
              <p className="text-slate-400 text-xs">Expenses</p>
              </NeonCard>

              <NeonCard className="p-4" glowColor="cyan">
              <div className="flex items-start justify-between mb-2">
                <PiggyBank className="w-5 h-5 text-cyan-400" />
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
              <p className="text-cyan-400 text-xl font-bold">{formatMoney(totalSavings, currency, { decimals: 0 })}</p>
              <p className="text-slate-400 text-xs">Savings</p>
              </NeonCard>

              <NeonCard className="p-4" glowColor="purple">
              <div className="flex items-start justify-between mb-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
              <p className="text-purple-400 text-xl font-bold">{formatMoney(totalInvestments, currency, { decimals: 0 })}</p>
              <p className="text-slate-400 text-xs">Investments</p>
              </NeonCard>
          </div>
          )}

          {/* Report Type Selector */}
          {dataPresence.state !== 'no_data' && (
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('monthly')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                reportType === 'monthly'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Monthly
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                reportType === 'yearly'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Yearly
            </button>
          </div>
          )}

          {/* Report Content */}
          {dataPresence.state !== 'no_data' && (reportType === 'monthly' ? (
            <MonthlyReport
              transactions={transactions}
              budgets={budgets}
              savingsGoals={savingsGoals}
              investments={investments}
              profile={profile}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          ) : (
            <YearlyReport
              transactions={transactions}
              budgets={budgets}
              savingsGoals={savingsGoals}
              investments={investments}
              profile={profile}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          ))}

          {/* Export Options */}
          {dataPresence.state !== 'no_data' && (
          <ReportExporter
            reportType={reportType}
            transactions={transactions}
            budgets={budgets}
            savingsGoals={savingsGoals}
            investments={investments}
            profile={profile}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
          )}
        </div>
      </main>
      </PaywallGate>
      <BottomNav currentPage="Reports" />
    </SpaceBackground>

  );
}