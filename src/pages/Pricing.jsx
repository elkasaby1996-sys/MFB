import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Check, X, ArrowLeft } from 'lucide-react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { TIER_FEATURES } from '@/components/subscription/FEATURE_MAP';
import { BillingProvider } from '@/components/billing/BillingProvider';

export default function PricingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0];
  const currentTier = profile?.plan_tier || 'free';

  const pricing = {
    monthly: { pro: '$9.99', elite: '$14.99' },
    yearly: { pro: '$95.99', elite: '$143.99' },
  };

  const features = [
    'Unlimited expense logging',
    'Savings goals',
    'Budget goals',
    'Charity tracking',
    'AI messages/month',
    'Receipt Scanner',
    'Finance Vault',
    'Advanced analytics',
    'Financial Reports',
    'Spending Calendar',
    'Daily Spending Limit',
    'Debit & Credit cards',
    'Investment Tracking',
    'Net Worth Tracker',
    'Global Expat Tools',
  ];

  const tierAccess = {
    free: [true, true, true, true, '5', false, false, false, false, false, false, false, false, false, false],
    pro: [true, 'Unlimited', 'Unlimited', true, '30', true, true, true, true, true, true, 'Up to 5', false, false, false],
    elite: [true, 'Unlimited', 'Unlimited', true, '50', true, true, true, true, true, true, 'Unlimited', true, true, true],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-400">
            Choose the plan that fits your financial needs
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col items-center justify-center gap-3 mt-8 pt-4">
            <SegmentedControl
              value={billingCycle}
              onValueChange={setBillingCycle}
              ariaLabel="Billing cycle"
              className="w-full max-w-xs"
              fullWidth
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly', badge: 'Save 20%' },
              ]}
            />
            {billingCycle === 'yearly' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                Save ~20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {['free', 'pro', 'elite'].map((tier) => (
            <div
              key={tier}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                tier === 'pro'
                  ? 'ring-2 ring-cyan-400 md:scale-105 shadow-2xl'
                  : tier === 'elite'
                  ? 'ring-2 ring-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                  : 'border border-slate-700 hover:border-slate-600'
              } ${currentTier === tier ? 'bg-slate-800/80' : 'bg-slate-900/80'}`}
            >
              {tier === 'pro' && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold py-1 text-center">
                  MOST POPULAR
                </div>
              )}

              <div className={`p-8 ${tier === 'pro' ? 'pt-16' : ''}`}>
                {/* Tier Name */}
                <h2 className="text-2xl font-bold text-white capitalize mb-2">
                  {tier}
                </h2>

                {/* Current Plan Badge */}
                {currentTier === tier && (
                  <div className="inline-block bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    ✓ Current Plan
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {tier === 'free' ? '$0' : pricing[billingCycle][tier]}
                    </span>
                    {tier !== 'free' && (
                      <span className="text-slate-400">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (currentTier !== tier && tier !== 'free') {
                      const productIds = {
                        pro: 'com.myfinancebro.pro.monthly',
                        elite: 'com.myfinancebro.elite.monthly'
                      };
                      BillingProvider.subscribe(productIds[tier]);
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-semibold mb-8 transition-all ${
                    currentTier === tier
                      ? 'bg-slate-700 text-slate-300 cursor-default'
                      : tier === 'pro'
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:opacity-90'
                      : tier === 'elite'
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:opacity-90'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                  disabled={currentTier === tier}
                >
                  {currentTier === tier ? 'Current Plan' : `Upgrade to ${tier}`}
                </button>

                {/* Features List */}
                <div className="space-y-4">
                  {TIER_FEATURES[tier].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white text-center">
            Detailed Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-white font-semibold">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-slate-400 font-semibold">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 text-slate-400 font-semibold">
                    Pro
                  </th>
                  <th className="text-center py-4 px-4 text-slate-400 font-semibold">
                    Elite
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-slate-300">{feature}</td>
                    <td className="text-center py-4 px-4">
                      {tierAccess.free[idx] === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : tierAccess.free[idx] === false ? (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-sm text-slate-400">
                          {tierAccess.free[idx]}
                        </span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {tierAccess.pro[idx] === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : tierAccess.pro[idx] === false ? (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-sm text-slate-400">
                          {tierAccess.pro[idx]}
                        </span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {tierAccess.elite[idx] === true ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : tierAccess.elite[idx] === false ? (
                        <X className="w-5 h-5 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-sm text-slate-400">
                          {tierAccess.elite[idx]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: 'Can I change my plan anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'What happens to my data if I downgrade?',
                a: 'Your data remains intact, but certain features may be restricted based on your new plan.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! You get one free trial use per locked feature before needing to upgrade.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Subscriptions are managed through the App Store or Google Play. Refund requests are handled by Apple or Google per their respective refund policies.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-2">{item.q}</h3>
                <p className="text-slate-400 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}