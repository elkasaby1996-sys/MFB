import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Check } from 'lucide-react';
import { TIER_PRICING } from './FEATURE_MAP';
import { BillingProvider } from '@/components/billing/BillingProvider';

export default function PaywallModal({
  isOpen,
  onClose,
  feature,
  currentTier,
  upgradeTier,
  canUseTrial,
  onUseTrial,
  onTrialGranted,
}) {
  const [selectedTier, setSelectedTier] = useState(upgradeTier || 'pro');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const PRODUCT_IDS = {
    pro: 'com.myfinancebro.pro.monthly',
    elite: 'com.myfinancebro.elite.monthly',
  };

  const handleUseTrial = async () => {
    setLoading(true);
    // Grant access immediately for instant UX, then persist in background
    onTrialGranted?.();
    onUseTrial?.(); // fire-and-forget persist
    setLoading(false);
  };

  const handleUpgrade = (tier) => {
    onClose();
    if (window.webkit?.messageHandlers?.iap) {
      BillingProvider.subscribe(PRODUCT_IDS[tier]);
    } else {
      navigate(createPageUrl('Paywall'), {
        state: {
          featureName: feature?.name,
          requiredTier: tier,
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-amber-400" />
            Unlock {feature?.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {feature?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Upgrade Options */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm">Start your 7-day free trial</h3>
            <div className="grid grid-cols-2 gap-3">
              {['pro', 'elite'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTier === tier
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-white font-semibold capitalize mb-1">
                      {tier}
                    </div>
                    <div className="text-green-400 text-xs font-semibold">
                      7 days free
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature List */}
          {selectedTier === 'pro' && (
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <h4 className="text-white font-semibold text-sm mb-3">
                Unlock with Pro
              </h4>
              {['Receipt Scanner', 'Financial Reports', 'Spending Calendar'].map(
                (f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-500" />
                    {f}
                  </div>
                )
              )}
            </div>
          )}

          {selectedTier === 'elite' && (
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              <h4 className="text-white font-semibold text-sm mb-3">
                Unlock with Elite
              </h4>
              {[
                'Everything in Pro',
                'Investment Tracking',
                'Net Worth Tracker',
                'Global Expat Tools',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-green-500" />
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleUpgrade(selectedTier)}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold hover:opacity-90 transition-opacity"
          >
            Try {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Free — 7 Days
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}