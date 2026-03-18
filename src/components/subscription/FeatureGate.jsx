import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Lock, Crown } from 'lucide-react';
import { usePremium } from '@/components/providers/PremiumProvider';

const TIER_RANK = { free: 0, pro: 1, elite: 2 };

export default function FeatureGate({ 
  children, 
  userPlan, 
  requiredPlan,
  requiredTier = 'pro', // preferred prop name going forward
  featureName = 'This feature',
  showUpgradeInline = false
}) {
  const navigate = useNavigate();
  const { isPremium, currentTier: contextTier, isElite, isPro, isProOrElite } = usePremium();
  
  // Support both requiredTier and legacy requiredPlan prop
  const minTier = requiredTier || requiredPlan || 'pro';
  const currentTier = userPlan || contextTier || 'free';
  const hasAccess = (TIER_RANK[currentTier] ?? 0) >= (TIER_RANK[minTier] ?? 1);

  if (hasAccess) {
    return children;
  }

  if (showUpgradeInline) {
    return (
      <div className="relative">
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-xl">
          <div className="text-center p-6">
            <Crown className="w-10 h-10 text-pink-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-2">{featureName}</p>
            <p className="text-slate-400 text-sm mb-4">Requires Pro or Elite plan</p>
            <button 
              onClick={() => navigate(createPageUrl('Paywall'))}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 text-center">
      <Lock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
      <p className="text-white font-medium mb-1">{featureName}</p>
      <p className="text-slate-400 text-sm mb-4">Available in Pro or Elite plan</p>
      <button 
        onClick={() => navigate(createPageUrl('Paywall'))}
        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold"
      >
        Upgrade Now
      </button>
    </div>
  );
}