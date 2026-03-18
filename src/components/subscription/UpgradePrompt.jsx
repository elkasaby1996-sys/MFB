import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';

export default function UpgradePrompt({ 
  feature, 
  requiredPlan = 'pro',
  showIcon = true,
  compact = false 
}) {
  const planNames = {
    free: 'Free',
    pro: 'Pro',
    elite: 'Elite'
  };

  const planIcons = {
    free: Sparkles,
    pro: Sparkles,
    elite: Crown
  };

  const Icon = planIcons[requiredPlan];

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {showIcon && <Icon className="w-5 h-5 text-purple-400 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">{feature}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Requires {planNames[requiredPlan]} plan
            </p>
          </div>
          <Link to={createPageUrl('Pricing')}>
            <NeonButton variant="purple" size="sm">
              Upgrade
            </NeonButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <NeonCard glowColor="purple" className="p-6">
      <div className="text-center">
        {showIcon && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 mb-4">
            <Icon className="w-8 h-8 text-purple-400" />
          </div>
        )}
        <h3 className="text-xl font-bold text-white mb-2">{feature}</h3>
        <p className="text-slate-400 mb-6">
          Upgrade to {planNames[requiredPlan]} to unlock this feature
        </p>
        <Link to={createPageUrl('Pricing')}>
          <NeonButton variant="purple" className="gap-2">
            View Plans <ArrowRight className="w-4 h-4" />
          </NeonButton>
        </Link>
      </div>
    </NeonCard>
  );
}