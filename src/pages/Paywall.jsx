import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpaceBackground from '@/components/layout/SpaceBackground';
import NeonButton from '@/components/ui/NeonButton';
import { Crown, Check, X, Zap, RefreshCcw, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { BillingProvider } from '@/components/billing/BillingProvider';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { TIER_FEATURES, TIER_PRICING } from '@/components/subscription/FEATURE_MAP';

const PRODUCT_IDS = {
  pro: 'com.myfinancebro.pro.monthly',
  elite: 'com.myfinancebro.elite.monthly',
};

export default function Paywall() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // featureName and requiredTier can be passed via location.state
  const featureName = location.state?.featureName || null;
  const requiredTier = location.state?.requiredTier || null; // 'pro' | 'elite'

  const [subscribing, setSubscribing] = useState(null); // 'pro' | 'elite' | null
  const [restoring, setRestoring] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0];
  const currentTier = profile?.plan_tier || 'free';

  const updatePremiumMutation = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.UserProfile.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['userProfile']),
  });

  // Listen for iOS/Android purchase result — always validate via server before granting tier
  useEffect(() => {
    const handlePurchaseResult = async (event) => {
      const { success, productId, receiptData, transactionId } = event.detail;
      setSubscribing(null);
      if (success && receiptData) {
        try {
          toast.info('Validating purchase...');
          const res = await base44.functions.invoke('validateAppleReceipt', {
            receipt_data: receiptData,
            product_id: productId,
            transaction_id: transactionId,
          });
          if (res.data?.success) {
            toast.success(`Welcome to ${res.data.plan_tier.charAt(0).toUpperCase() + res.data.plan_tier.slice(1)}! 🎉`);
            queryClient.invalidateQueries(['userProfile']);
            navigate(-1);
          } else {
            toast.error('Purchase could not be verified. Please restore purchases or contact support.');
          }
        } catch {
          toast.error('Validation failed. Please try Restore Purchases.');
        }
      } else if (success && !receiptData) {
        // Bridge success but no receipt — cannot verify. Do not grant tier.
        toast.error('Purchase recorded but could not be verified. Please tap "Restore Purchases" to activate your subscription.');
      } else {
        toast.error('Purchase failed or was cancelled');
      }
    };
    window.addEventListener('purchaseResult', handlePurchaseResult);
    return () => window.removeEventListener('purchaseResult', handlePurchaseResult);
  }, []);

  const handleSubscribe = (tier) => {
    setSubscribing(tier);
    BillingProvider.subscribe(PRODUCT_IDS[tier]);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      toast.info('Checking for previous purchases...');
      const result = await BillingProvider.restore();
      if (result.success && result.subscriptions?.length > 0) {
        const latestSub = result.subscriptions[0];
        const receiptData = latestSub.receiptData || latestSub.receipt_data;
        const productId   = latestSub.productId   || latestSub.product_id || '';
        const transactionId = latestSub.transactionId || latestSub.transaction_id;

        if (receiptData) {
          // Validate server-side before granting tier
          toast.info('Validating restored purchase...');
          const res = await base44.functions.invoke('validateAppleReceipt', {
            receipt_data: receiptData,
            product_id: productId,
            transaction_id: transactionId,
          });
          if (res.data?.success) {
            toast.success(`${res.data.plan_tier.charAt(0).toUpperCase() + res.data.plan_tier.slice(1)} plan restored!`);
            queryClient.invalidateQueries(['userProfile']);
            navigate(-1);
          } else {
            toast.error('Could not verify restored purchase. Contact support if you believe this is an error.');
          }
        } else {
          // No receipt available from bridge — cannot verify
          toast.error('Restore could not be verified. If you have an active subscription, contact support at support@myfinancebro.app.');
        }
      } else {
        toast.info('No previous purchases found');
      }
    } catch (error) {
      toast.error('Failed to restore purchases');
    } finally {
      setRestoring(false);
    }
  };

  const tiers = ['free', 'pro', 'elite'];
  const tierColors = {
    free: 'border-slate-700',
    pro: 'border-cyan-400 ring-2 ring-cyan-400',
    elite: 'border-purple-500 ring-2 ring-purple-500',
  };
  const tierGradients = {
    free: '',
    pro: 'from-cyan-400 to-blue-500',
    elite: 'from-purple-500 to-pink-500',
  };

  return (
    <SpaceBackground>
      <div className="min-h-screen flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <button onClick={() => BillingProvider.manageSubscription()} className="text-sm text-slate-400 hover:text-white transition-colors">
            Manage
          </button>
        </div>

        <div className="flex-1 px-4 pb-32 overflow-y-auto">
          <div className="max-w-2xl mx-auto">

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {featureName ? <Lock className="w-8 h-8 text-white" /> : <Crown className="w-8 h-8 text-white" />}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {featureName ? `Unlock ${featureName}` : 'Upgrade Your Plan'}
              </h1>
              <p className="text-slate-400 text-sm mb-3">
                {featureName
                  ? 'This feature requires a paid plan. Start your free trial below.'
                  : 'Try free for 7 days, then choose the plan that fits you'}
              </p>
              {/* Free Trial Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-full px-4 py-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 text-sm font-semibold">7-Day Free Trial — No charge until Day 8</span>
              </div>
            </motion.div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {tiers.map((tier, i) => {
                const isRequired = requiredTier === tier;
                const isCurrent = currentTier === tier;
                const isPaid = tier !== 'free';

                return (
                  <motion.div
                    key={tier}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`relative rounded-2xl border p-5 bg-slate-900/80 transition-all ${
                      isRequired ? tierColors[tier] : 'border-slate-700'
                    }`}
                  >
                    {tier === 'pro' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    {isRequired && (
                      <div className={`absolute -top-3 right-4 bg-gradient-to-r ${tierGradients[tier]} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        ✨ Unlocks this feature
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h2 className="text-white font-bold text-lg capitalize">{tier}</h2>
                        <div className="flex items-baseline gap-1">
                          {isPaid && (
                            <span className="text-green-400 text-sm font-semibold">Free for 7 days, then </span>
                          )}
                          <span className={`text-2xl font-bold ${tier === 'pro' ? 'text-cyan-400' : tier === 'elite' ? 'text-purple-400' : 'text-slate-300'}`}>
                            {isPaid ? `$${TIER_PRICING[tier].price}` : 'Free'}
                          </span>
                          {isPaid && <span className="text-slate-400 text-sm">/month</span>}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                          ✓ Current
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {TIER_FEATURES[tier].map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-slate-300 text-sm">{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    {isPaid && !isCurrent && (
                      <NeonButton
                        onClick={() => handleSubscribe(tier)}
                        loading={subscribing === tier}
                        variant={tier === 'elite' ? 'purple' : 'primary'}
                        className="w-full"
                      >
                        <Zap className="w-4 h-4" />
                        Try {tier.charAt(0).toUpperCase() + tier.slice(1)} Free for 7 Days
                      </NeonButton>
                    )}
                    {isCurrent && (
                      <div className="w-full py-2 text-center text-slate-400 text-sm">You're on this plan</div>
                    )}
                    {tier === 'free' && !isCurrent && (
                      <div className="w-full py-2 text-center text-slate-500 text-sm">Your current base</div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Restore Purchases */}
            <NeonButton onClick={handleRestore} loading={restoring} variant="ghost" className="w-full mb-6">
              <RefreshCcw className="w-4 h-4" />
              Restore Purchases
            </NeonButton>

            {/* Apple Legal Disclosure */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs text-slate-500 space-y-2 px-2"
            >
              <p>
                Free trial lasts 7 days. After the trial period, your subscription automatically renews at the selected price unless canceled at least 24 hours before the end of the trial period.
              </p>
              <p>
                Payment will be charged to your App Store account upon confirmation of purchase after the free trial ends. You can manage or cancel your subscription anytime in your App Store account settings.
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <button onClick={() => navigate(createPageUrl('PrivacyPolicy'))} className="underline hover:text-slate-400">
                  Privacy Policy
                </button>
                <button onClick={() => navigate(createPageUrl('TermsOfService'))} className="underline hover:text-slate-400">
                  Terms of Service
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </SpaceBackground>
  );
}