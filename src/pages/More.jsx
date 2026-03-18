import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import BottomNav from '@/components/layout/BottomNav';
import ScreenScrollContainer from '@/components/layout/ScreenScrollContainer';
import NeonCard from '@/components/ui/NeonCard';
import { 
  Wallet, TrendingUp, CreditCard, Bell, Sparkles, 
  Briefcase, Heart, Home, Receipt, Globe, Bot, Settings, ChevronRight, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePremium } from '@/components/providers/PremiumProvider';

export default function More() {
  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { currentTier } = usePremium();

  const sections = [
    {
      title: 'Money',
      items: [
        { name: 'Savings', icon: Wallet, color: 'green', page: 'Savings' },
        { name: 'Investments', icon: TrendingUp, color: 'blue', page: 'Investments', tier: 'elite' },
        { name: 'Net Worth', icon: TrendingUp, color: 'purple', page: 'NetWorth', tier: 'elite' },
      ]
    },
    {
      title: 'Debt & Bills',
      items: [
        { name: 'Debt & Credit', icon: CreditCard, color: 'pink', page: 'DebtHub', tier: 'pro' },
        { name: 'Subscriptions', icon: Bell, color: 'purple', page: 'Subscriptions', tier: 'pro' },
      ]
    },
    {
      title: 'Lifestyle',
      items: [
        { name: 'Side Hustle', icon: Briefcase, color: 'cyan', page: 'SideHustle', tier: 'elite' },
        { name: 'Charity & Giving', icon: Heart, color: 'pink', page: 'Charity' },
        { name: 'Home Finance', icon: Home, color: 'teal', page: 'HomeFinance', tier: 'pro' },
      ]
    },
    {
      title: 'Tools',
      items: [
        { name: 'Cash Flow', icon: TrendingUp, color: 'cyan', page: 'CashFlow' },
        { name: 'Receipts', icon: Receipt, color: 'cyan', page: 'Receipts', tier: 'pro' },
        { name: 'Global / Expat Hub', icon: Globe, color: 'blue', page: 'ExpatHub', tier: 'elite' },
        { name: 'Real Cost Mode', icon: Clock, color: 'purple', page: 'RealCostMode', tier: 'pro' },
      ]
    },
    {
      title: 'AI & App',
      items: [
        { name: 'AI Bro', icon: Bot, color: 'cyan', page: 'AIAssistant' },
        { name: 'Settings', icon: Settings, color: 'teal', page: 'Settings' },
      ]
    },
  ];

  const tierRank = { free: 0, pro: 1, elite: 2 };
  const userRank = tierRank[currentTier] ?? 0;

  const TierBadge = ({ tier }) => {
    if (!tier) return null;
    const required = tierRank[tier] ?? 0;
    if (userRank >= required) return null; // already has access, no badge needed
    if (tier === 'elite') {
      return (
        <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wide">
          👑 Elite
        </span>
      );
    }
    return (
      <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[10px] font-bold uppercase tracking-wide">
        ✦ Pro
      </span>
    );
  };

  return (
    <SpaceBackground>
      <ScreenScrollContainer>
        <div className="max-w-lg mx-auto space-y-6 py-6">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">More</h1>
            <p className="text-slate-400">All your features in one place</p>
          </div>

          {sections.map((section, idx) => (
            <div key={section.title}>
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx * section.items.length + itemIdx) * 0.05 }}
                    >
                      <Link to={createPageUrl(item.page)}>
                        <NeonCard 
                          className="p-4 cursor-pointer active:scale-[0.98] transition-all duration-200" 
                          glowColor={item.color}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/20 flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 text-${item.color}-400`} />
                              </div>
                              <div className="flex items-center flex-wrap">
                                <p className="text-white font-semibold">{item.name}</p>
                                <TierBadge tier={item.tier} />
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500" />
                          </div>
                        </NeonCard>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>
      </ScreenScrollContainer>

      <BottomNav currentPage="More" />
    </SpaceBackground>
  );
}