import React, { useState, useEffect } from 'react';
import SubPageHeader from '@/components/layout/SubPageHeader';
import PaywallGate from '@/components/subscription/PaywallGate';
import { base44 } from '@/api/base44Client';
import { formatMoney } from '@/components/utils/formatMoney';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NetWorthHero from '@/components/networth/NetWorthHero';
import NetWorthChart from '@/components/networth/NetWorthChart';
import AssetsLiabilitiesBreakdown from '@/components/networth/AssetsLiabilitiesBreakdown';
import NetWorthGoal from '@/components/networth/NetWorthGoal';
import { Sparkles } from "lucide-react";
import { subMonths, subDays, format, startOfDay, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import QueryWrapper from '@/components/ui/QueryWrapper';
import { usePremium } from '@/components/providers/PremiumProvider';

export default function NetWorth() {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('3M');
  const { isElite } = usePremium();

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: savingsGoals = [], isLoading: savingsLoading } = useQuery({
    queryKey: ['savingsGoals'],
    enabled: isElite,
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const { data: investments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments'],
    enabled: isElite,
    queryFn: () => base44.entities.Investment.list(),
  });

  const { data: debts = [], isLoading: debtsLoading } = useQuery({
    queryKey: ['debts'],
    enabled: isElite,
    queryFn: () => base44.entities.Debt.list(),
  });

  const { data: history = [], isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['netWorthHistory'],
    enabled: isElite,
    queryFn: () => base44.entities.NetWorthHistory.list('-date', 1000),
  });

  const isLoading = savingsLoading || investmentsLoading || debtsLoading || historyLoading;

  const createHistoryMutation = useMutation({
    mutationFn: (data) => base44.entities.NetWorthHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['netWorthHistory']);
    },
  });

  const currency = profile?.currency || 'USD';

  // Calculate current net worth
  const totalSavings = savingsGoals.reduce((sum, g) => sum + (parseFloat(g.current_amount) || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (parseFloat(i.current_value) || 0), 0);
  const totalAssets = totalSavings + totalInvestments;

  const activeDebts = debts.filter(d => d.status === 'active');
  const totalLiabilities = activeDebts.reduce((sum, d) => sum + (parseFloat(d.current_balance) || 0), 0);

  const currentNetWorth = totalAssets - totalLiabilities;

  // Record snapshot if none exists for today
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySnapshot = history.find(h => h.date === today);

    if (!todaySnapshot && profile) {
      createHistoryMutation.mutate({
        date: today,
        net_worth: currentNetWorth,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        cash_savings: totalSavings,
        investments_value: totalInvestments,
      });
    }
  }, [profile, currentNetWorth, history]);

  // Filter history by time range
  const getFilteredHistory = () => {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '1M':
        startDate = subMonths(now, 1);
        break;
      case '3M':
        startDate = subMonths(now, 3);
        break;
      case '6M':
        startDate = subMonths(now, 6);
        break;
      case '1Y':
        startDate = subMonths(now, 12);
        break;
      case 'ALL':
        return history;
      default:
        startDate = subMonths(now, 3);
    }

    return history.filter(h => new Date(h.date) >= startDate);
  };

  const filteredHistory = getFilteredHistory();

  // Calculate change
  const calculateChange = () => {
    if (filteredHistory.length < 2) return { change: 0, changePercent: 0 };

    const oldest = filteredHistory[filteredHistory.length - 1];
    const change = currentNetWorth - (oldest?.net_worth || 0);
    const changePercent = oldest?.net_worth !== 0 
      ? (change / Math.abs(oldest.net_worth)) * 100 
      : 0;

    return { change, changePercent };
  };

  const { change, changePercent } = calculateChange();

  // Assets breakdown
  const assets = [
    { name: 'Cash & Savings', value: totalSavings },
    { name: 'Investments', value: totalInvestments },
  ].filter(a => a.value > 0);

  // Liabilities breakdown
  const liabilities = activeDebts.map(d => ({
    name: d.name,
    value: parseFloat(d.current_balance) || 0,
  }));

  // AI Insight
  const generateAIInsight = () => {
    if (currentNetWorth >= 0) {
      if (change > 0) {
        return `Great job, Bro! Your net worth increased by ${Math.abs(change).toFixed(0)} this period. ${
          totalLiabilities > 0 
            ? `Focus on paying down your ${liabilities[0]?.name} to boost it even faster!` 
            : 'Keep building your wealth! 🚀'
        }`;
      } else if (change < 0) {
        return `Your net worth dropped by ${Math.abs(change).toFixed(0)} recently. ${
          totalLiabilities > totalAssets * 0.5
            ? 'Your debts are weighing you down. Focus on debt reduction to turn this around!'
            : 'Review your recent spending to get back on track.'
        }`;
      } else {
        return 'Your net worth is stable. Time to level up! Add more to savings or investments.';
      }
    } else {
      return `You're currently ${Math.abs(currentNetWorth).toFixed(0)} in the negative. Focus on paying down your highest-interest debts first to flip this into the positive zone!`;
    }
  };

  return (
    <SpaceBackground>
      <SubPageHeader title="Net Worth" />
      <PaywallGate featureId="net_worth" requiredTier="elite" fullScreen>
      <main className="pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 py-4">
          
          <QueryWrapper
            isLoading={isLoading}
            data={profile ? [profile] : null}
          >
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <NetWorthHero
              netWorth={currentNetWorth}
              change={change}
              changePercent={changePercent}
              currency={currency}
            />
          </motion.div>

          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NeonCard className="p-4 sm:p-5" glowColor="teal">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm sm:text-base mb-1">Future Bro's Insight</p>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    {generateAIInsight()}
                  </p>
                </div>
              </div>
            </NeonCard>
          </motion.div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <NetWorthChart
              data={filteredHistory}
              currency={currency}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </motion.div>

          {/* Assets & Liabilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AssetsLiabilitiesBreakdown
              assets={assets}
              liabilities={liabilities}
              currency={currency}
            />
          </motion.div>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <NetWorthGoal
              currentNetWorth={currentNetWorth}
              currency={currency}
            />
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NeonCard className="p-4 sm:p-5" glowColor="cyan">
              <h3 className="text-white font-semibold mb-3 text-center text-base sm:text-lg">Quick Summary</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Assets</p>
                  <p className="text-cyan-400 font-bold text-sm sm:text-base whitespace-nowrap">{formatMoney(totalAssets, currency, { decimals: 0 })}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Liabilities</p>
                  <p className="text-red-400 font-bold text-sm sm:text-base whitespace-nowrap">{formatMoney(totalLiabilities, currency, { decimals: 0 })}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Net Worth</p>
                  <p className={`font-bold text-sm sm:text-base whitespace-nowrap ${currentNetWorth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatMoney(currentNetWorth, currency, { decimals: 0 })}
                  </p>
                </div>
              </div>
            </NeonCard>
          </motion.div>
          </QueryWrapper>
        </div>
      </main>

      </PaywallGate>
      <BottomNav currentPage="NetWorth" />
    </SpaceBackground>
  );
}