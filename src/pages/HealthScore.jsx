import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import NeonProgress from '@/components/ui/NeonProgress';
import { ArrowLeft, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateFinancialHealthScore, getScoreLabel, getImprovementSuggestions } from '@/components/health/calculateHealthScore';
import { usePremium } from '@/components/providers/PremiumProvider';
import PaywallGate from '@/components/subscription/PaywallGate';
import { calculateDataPresence, getHealthScoreLabel } from '@/components/utils/dataPresence';
import LifestyleTagCard from '@/components/lifestyle/LifestyleTagCard';
import { calculateAllLifestyleScores, getLifestyleLevel } from '@/components/lifestyle/calculateLifestyleScores';
import { LIFESTYLE_TAGS } from '@/components/lifestyle/lifestyleTagDefinitions';

export default function HealthScore() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(90);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 500),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
  });

  const { data: userMissions = [] } = useQuery({
    queryKey: ['userMissions'],
    queryFn: () => base44.entities.UserMission.list(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list(),
  });

  const { data: sideHustleTransactions = [] } = useQuery({
    queryKey: ['sideHustleTransactions'],
    queryFn: () => base44.entities.SideHustleTransaction.list('-date', 300),
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
  });

  const healthData = useMemo(() => {
    return calculateFinancialHealthScore({
      transactions,
      budgets,
      savingsGoals,
      debts,
      profile,
      userMissions,
      investments,
      subscriptions,
    });
  }, [transactions, budgets, savingsGoals, debts, profile, userMissions, investments, subscriptions]);

  const dataPresence = useMemo(() => {
    return calculateDataPresence(transactions, investments, budgets);
  }, [transactions, investments, budgets]);

  const { label, subtitle, color } = useMemo(() => {
    return getHealthScoreLabel(healthData.total || 0, dataPresence.state);
  }, [healthData.total, dataPresence.state]);

  const suggestions = getImprovementSuggestions(healthData.breakdown, { debts, transactions, savingsGoals, subscriptions });

  const currency = profile?.currency || 'USD';
  const monthlyIncome = profile?.monthly_income || 0;

  // Calculate lifestyle scores
  const lifestyleScores = useMemo(() => {
    return calculateAllLifestyleScores({
      transactions,
      subscriptions,
      sideHustleTransactions,
      investments,
      savingsGoals,
      monthlyIncome,
      daysBack: timeRange,
    });
  }, [transactions, subscriptions, sideHustleTransactions, investments, savingsGoals, monthlyIncome, timeRange]);

  // Build lifestyle tag data
  const lifestyleTagData = useMemo(() => {
    const tags = [];

    Object.keys(LIFESTYLE_TAGS).forEach(key => {
      const tag = LIFESTYLE_TAGS[key];
      const score = lifestyleScores[key];
      const levelInfo = getLifestyleLevel(score);

      let details = [];
      if (key === 'deliveryBro' || key === 'homeCook' || key === 'impulseBro' || key === 'travelBro') {
        details = tag.getDetails(transactions, timeRange, currency);
      } else if (key === 'subscriptionZombie') {
        details = tag.getDetails(subscriptions, monthlyIncome, currency);
      } else if (key === 'hustleBro') {
        details = tag.getDetails(sideHustleTransactions, monthlyIncome, timeRange, currency);
      } else if (key === 'saverBro') {
        details = tag.getDetails(transactions, savingsGoals, timeRange, currency);
      } else if (key === 'investorBro') {
        details = tag.getDetails(investments, currency);
      }

      tags.push({
        key,
        tag,
        score,
        levelInfo,
        shortDesc: tag.shortDesc(levelInfo.level),
        details,
        improvements: tag.improvements[levelInfo.level] || [],
      });
    });

    return tags.sort((a, b) => b.score - a.score);
  }, [lifestyleScores, transactions, subscriptions, sideHustleTransactions, investments, savingsGoals, monthlyIncome, currency, timeRange]);

  const topLifestyleTags = lifestyleTagData.filter(t => t.score >= 4).slice(0, 5);

  const colors = {
    red: { text: 'text-red-400', bg: 'bg-red-500/20' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    lightgreen: { text: 'text-green-400', bg: 'bg-green-500/20' },
    green: { text: 'text-green-300', bg: 'bg-green-400/20' },
  };

  const colorConfig = colors[color] || colors.yellow;

  const breakdownItems = [
    { key: 'spending', label: 'Spending vs Income', icon: '💰', description: 'Managing cash flow effectively' },
    { key: 'savings', label: 'Savings Behavior', icon: '🎯', description: 'Building savings over time' },
    { key: 'debt', label: 'Debt Management', icon: '📉', description: 'Keeping debt under control' },
    { key: 'subscriptions', label: 'Subscriptions', icon: '📺', description: 'Subscription costs relative to income' },
    { key: 'budget', label: 'Budget Adherence', icon: '📊', description: 'Staying within planned limits' },
    { key: 'investing', label: 'Investing Consistency', icon: '📈', description: 'Regular investment activity' },
    { key: 'consistency', label: 'Tracking Habits', icon: '🔄', description: 'Consistent financial tracking' },
  ];

  const { isPremium, currentTier, isElite, isPro, isProOrElite } = usePremium();

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Safe area top spacer */}
      <div style={{ height: 'var(--safe-area-top, 0px)' }} className="bg-slate-900" />
      
      {/* Compact App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(createPageUrl('Dashboard'))} 
              className="p-2 text-slate-400 hover:text-white active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-lg font-semibold text-white truncate">Financial Health Score</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <SpaceBackground>
          <div className="px-4 sm:px-6 pb-24 sm:pb-32">
            <div className="max-w-lg mx-auto space-y-3 sm:space-y-4 py-3 sm:py-4">
              <PaywallGate featureId="health_score" requiredTier="pro">

          {/* Overall Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {dataPresence.state === 'no_data' ? (
              <NeonCard className="p-6 bg-slate-800/50" glowColor="cyan">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-xl font-bold text-white mb-2">Your Financial Health Score</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Your score will appear once you start tracking your finances
                  </p>
                  <div className="flex flex-col gap-3">
                    <NeonButton 
                      onClick={() => navigate(createPageUrl('Dashboard'))} 
                      variant="primary" 
                      className="w-full"
                    >
                      Add Transaction
                    </NeonButton>
                    <NeonButton 
                      onClick={() => navigate(createPageUrl('Investments'))} 
                      variant="secondary" 
                      className="w-full"
                    >
                      Add Investment
                    </NeonButton>
                  </div>
                </div>
              </NeonCard>
            ) : (
              <NeonCard className={`p-6 ${colorConfig.bg}`} glowColor={color}>
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-slate-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray="352"
                        strokeDashoffset={352 - (healthData.total / 100) * 352}
                        className={`${colorConfig.text} transition-all duration-1000`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-bold text-white">{healthData.total}</p>
                      <p className="text-slate-400 text-sm">/ 100</p>
                    </div>
                  </div>
                  
                  {dataPresence.state === 'early' && (
                    <div className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-2">
                      <p className="text-yellow-400 text-xs font-medium">Early estimate</p>
                    </div>
                  )}
                  
                  <h2 className={`text-xl font-bold ${colorConfig.text} mb-2`}>{label}</h2>
                  
                  {subtitle ? (
                    <p className="text-slate-400 text-xs mb-3">{subtitle}</p>
                  ) : (
                    <p className="text-slate-300 text-sm mb-3">Your financial health is looking {label.toLowerCase()}</p>
                  )}

                  {/* Score Change */}
                  {healthData.scoreChange !== null && !isNaN(healthData.scoreChange) && dataPresence.state === 'sufficient' && (
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      healthData.scoreChange > 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : healthData.scoreChange < 0 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {healthData.scoreChange > 0 ? '▲' : healthData.scoreChange < 0 ? '▼' : '●'}
                      <span className="font-semibold">
                        {healthData.scoreChange > 0 ? '+' : ''}{healthData.scoreChange} points
                      </span>
                      <span className="text-xs opacity-75">since last month</span>
                    </div>
                  )}
                  
                  {healthData.scoreChange === null && dataPresence.state === 'sufficient' && (
                    <p className="text-slate-500 text-xs">No historical data yet for comparison</p>
                  )}

                  {/* Disclaimer */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-slate-500 text-xs">
                      This score is informational and based on your tracked activity
                    </p>
                  </div>
                </div>
              </NeonCard>
            )}
          </motion.div>

          {/* Breakdown */}
          {dataPresence.state !== 'no_data' && healthData.breakdown && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <NeonCard className="p-4" glowColor="cyan">
                <h3 className="text-white font-semibold mb-4 text-base">Score Breakdown</h3>
                <div className="space-y-4">
                  {breakdownItems.map((item, index) => {
                    const score = healthData.breakdown[item.key];
                    const itemColor = score !== null && score >= 70 ? 'green' : score !== null && score >= 40 ? 'yellow' : 'red';
                    
                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xl flex-shrink-0">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{item.label}</p>
                              <p className="text-slate-500 text-xs truncate">
                                {score === null ? 'Not enough data yet' : item.description}
                              </p>
                            </div>
                          </div>
                          <p className="text-white font-bold text-sm whitespace-nowrap flex-shrink-0">
                            {score === null ? '—' : `${score}/100`}
                          </p>
                        </div>
                        {score !== null && (
                          <NeonProgress value={score} max={100} color={itemColor} showLabel={false} />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </NeonCard>
            </motion.div>
          )}

          {/* Lifestyle Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
            <NeonCard className="p-5" glowColor="purple">
              <h3 className="text-white font-semibold mb-3 text-base">Your Money Lifestyle</h3>
              
              {/* Time Range Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <NeonButton
                  variant={timeRange === 90 ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(90)}
                  className="flex-1"
                >
                  Last 3 Months
                </NeonButton>
                <NeonButton
                  variant={timeRange === 180 ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(180)}
                  className="flex-1"
                >
                  Last 6 Months
                </NeonButton>
              </div>

              {/* Top Personas */}
              {topLifestyleTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {topLifestyleTags.map((t) => (
                    <div
                      key={t.key}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm",
                        t.levelInfo.bgColor,
                        t.levelInfo.borderColor
                      )}
                    >
                      <span>{t.tag.emoji}</span>
                      <span className="text-white font-medium">{t.tag.name}</span>
                      <span className={cn("text-xs font-semibold", t.levelInfo.textColor)}>
                        {t.levelInfo.level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </NeonCard>
          </motion.div>

          {/* All Lifestyle Tags */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-base px-1">All Lifestyle Tags</h3>
              {lifestyleTagData.map((t) => (
                <LifestyleTagCard
                  key={t.key}
                  tag={t.tag}
                  score={t.score}
                  shortDesc={t.shortDesc}
                  details={t.details}
                  improvements={t.improvements}
                />
              ))}
            </div>
          </motion.div>

          {/* Improvement Suggestions */}
          {dataPresence.state !== 'no_data' && suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <NeonCard className="p-4" glowColor="purple">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h3 className="text-white font-semibold flex items-center gap-2 text-base truncate">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="truncate">How to Improve Your Score</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="bg-slate-800/50 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl flex-shrink-0">{suggestion.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold mb-1 text-sm">{suggestion.title}</p>
                          <p className="text-slate-400 text-xs">{suggestion.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {isPro && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <NeonButton 
                    variant="purple" 
                    className="w-full h-12"
                    onClick={() => navigate(createPageUrl('AIAssistant') + '?topic=health_score')}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Ask AI How to Improve</span>
                  </NeonButton>
                </div>
              )}

              {!isPro && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <p className="text-purple-400 text-xs text-center">
                      🚀 Upgrade to Pro for AI-powered personalized coaching
                    </p>
                  </div>
                </div>
              )}
              </NeonCard>
            </motion.div>
          )}
              </PaywallGate>
            </div>
          </div>
        </SpaceBackground>

      </main>

      <BottomNav currentPage="Dashboard" />
      
      {/* Safe area bottom spacer */}
      <div style={{ height: 'var(--safe-area-bottom, 0px)' }} className="bg-slate-900" />
    </div>
  );
}