import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

import SpaceBackground from '@/components/layout/SpaceBackground';
import NeonButton from '@/components/ui/NeonButton';
import NeonCard from '@/components/ui/NeonCard';
import AlienAvatar, { AVATARS } from '@/components/ui/AlienAvatar';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingService } from '@/components/services/OnboardingService';
import MobileSelect from '@/components/ui/MobileSelect';
import { Slider } from "@/components/ui/slider";
import { ChevronRight, ChevronLeft, Rocket, User, DollarSign, Target, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CURRENCIES } from '@/components/constants/currencies';
import { COUNTRIES } from '@/components/constants/countries';


const GOALS = [
  { value: "control_spending", label: "Control my spending", icon: "📊" },
  { value: "pay_debt", label: "Pay off debt", icon: "💳" },
  { value: "save_more", label: "Save more money", icon: "🏦" },
  { value: "start_investing", label: "Start investing", icon: "📈" },
  { value: "all", label: "All of the above", icon: "🚀" },
];

const STEPS = [
  { id: 1, title: "Profile", icon: User },
  { id: 2, title: "Finance", icon: DollarSign },
  { id: 3, title: "Goals", icon: Target },
  { id: 4, title: "Avatar", icon: Sparkles },
  { id: 5, title: "Upgrade", icon: Rocket },
];

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    currency: "USD",
    age_range: "",
    monthly_income: "",
    financial_goal: "",
    savings_target: "",
    avatar: "green-suit",
  });

  // Check if onboarding is already completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const profiles = await base44.entities.UserProfile.list();
        if (profiles && profiles.length > 0 && profiles[0].onboarding_completed) {
          // Already completed, redirect to dashboard
          navigate(createPageUrl("Dashboard"));
        } else {
          setCheckingOnboarding(false);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
        setCheckingOnboarding(false);
      }
    };
    checkOnboarding();
  }, [navigate]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "country") {
      const country = COUNTRIES.find(c => c.code === value);
      if (country) {
        setFormData(prev => ({ ...prev, country: value, currency: country.currency }));
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await base44.entities.UserProfile.create({
        ...formData,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        savings_target: parseFloat(formData.savings_target) || 0,
        current_xp: 50, // Welcome bonus
        level: 1,
        streak_days: 1,
        onboarding_completed: false,
        plan_tier: "free",
      });
      
      // Show upgrade screen (do NOT set onboarding_completed yet)
      setStep(5);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    setLoading(false);
  };

  const handleUpgradeTier = async (tier, appleTransactionId = null) => {
    // Only used for 'free' (Continue with Free). Pro/Elite are updated ONLY after Apple payment confirmation.
    try {
      const profiles = await base44.entities.UserProfile.list();
      if (profiles && profiles.length > 0) {
        const updateData = { plan_tier: tier, onboarding_completed: true };
        if (appleTransactionId) {
          updateData.apple_original_transaction_id = appleTransactionId;
        }
        await base44.entities.UserProfile.update(profiles[0].id, updateData);
      }
      // Mark onboarding as completed in localStorage
      await OnboardingService.setCompleted(true);
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error updating tier:", error);
      navigate(createPageUrl("Dashboard"));
    }
  };

  // Listen for iOS/Android purchase result — validate server-side before granting tier
  useEffect(() => {
    const handlePurchaseResult = async (event) => {
      const { success, productId, receiptData, transactionId } = event.detail;
      if (success && receiptData) {
        try {
          const res = await base44.functions.invoke('validateAppleReceipt', {
            receipt_data: receiptData,
            product_id: productId,
            transaction_id: transactionId,
          });
          if (res.data?.success) {
            await handleUpgradeTier(res.data.plan_tier, transactionId);
          } else {
            // Validation failed — proceed as free so user isn't stuck
            await handleUpgradeTier('free');
          }
        } catch {
          await handleUpgradeTier('free');
        }
      } else if (success && !receiptData) {
        // Bridge returned success but no receipt — cannot verify server-side.
        // Do NOT grant paid tier without verification. Show message and stay on step 5.
        alert('Purchase recorded but could not be verified yet. Please use "Restore Purchases" to activate your plan, or continue with the free plan.');
      }
      // If !success: stay on step 5, user can retry or continue free
    };
    window.addEventListener('purchaseResult', handlePurchaseResult);
    return () => window.removeEventListener('purchaseResult', handlePurchaseResult);
  }, []);

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name && formData.country && formData.age_range;
      case 2: return formData.monthly_income;
      case 3: return formData.financial_goal;
      case 4: return formData.avatar;
      case 5: return true;
      default: return true;
    }
  };

  // Show loading while checking onboarding status
  if (checkingOnboarding) {
    return (
      <SpaceBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl">👽</span>
            <p className="text-white mt-4">Loading...</p>
          </div>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="min-h-screen flex flex-col px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="text-4xl">👽</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              MyFinanceBro
            </h1>
          </div>
          <p className="text-slate-400">Your AI-powered finance companion</p>
        </div>

        {/* Progress */}
        <div className="max-w-md mx-auto w-full mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = step > s.id;
              
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive ? 'bg-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.5)]' : ''}
                      ${isComplete ? 'bg-green-500' : ''}
                      ${!isActive && !isComplete ? 'bg-slate-800 border border-slate-700' : ''}
                    `}>
                      <Icon className={`w-5 h-5 ${isActive || isComplete ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <span className={`text-xs mt-2 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-green-500' : 'bg-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Steps */}
        <div className="flex-1 max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NeonCard className="p-6">
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Tell Us About You</h2>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-300">Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Your name"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Country</Label>
                      <MobileSelect
                        value={formData.country}
                        onValueChange={(v) => updateField("country", v)}
                        options={COUNTRIES.map(c => ({ value: c.code, label: c.name, icon: c.flag }))}
                        placeholder="Select your country"
                        title="Select Country"
                        searchable
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Age Range</Label>
                      <MobileSelect
                        value={formData.age_range}
                        onValueChange={(v) => updateField("age_range", v)}
                        options={["18-24", "25-34", "35-44", "45-54", "55+"].map(age => ({ value: age, label: age }))}
                        placeholder="Select age range"
                        title="Select Age Range"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Currency</Label>
                      <MobileSelect
                        value={formData.currency}
                        onValueChange={(v) => updateField("currency", v)}
                        options={CURRENCIES.map(curr => ({ value: curr.code, label: `${curr.code} - ${curr.name}` }))}
                        placeholder="Select currency"
                        title="Select Currency"
                        searchable
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Your Financial Snapshot</h2>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-300">Monthly Income ({formData.currency})</Label>
                      <Input
                        type="number"
                        value={formData.monthly_income}
                        onChange={(e) => updateField("monthly_income", e.target.value)}
                        placeholder="e.g. 5000"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Savings Target (optional)</Label>
                      <Input
                        type="number"
                        value={formData.savings_target}
                        onChange={(e) => updateField("savings_target", e.target.value)}
                        placeholder="e.g. 10000"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">What's your main goal?</h2>
                    
                    <div className="space-y-3">
                      {GOALS.map(goal => (
                        <button
                          key={goal.value}
                          onClick={() => updateField("financial_goal", goal.value)}
                          className={`
                            w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3
                            ${formData.financial_goal === goal.value 
                              ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,255,255,0.2)]' 
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}
                          `}
                        >
                          <span className="text-2xl">{goal.icon}</span>
                          <span className="text-white font-medium">{goal.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-2">Choose Your Money Bro</h2>
                    <p className="text-slate-400 text-sm mb-6">Pick your alien avatar companion</p>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {AVATARS.map(avatar => (
                        <button
                          key={avatar.id}
                          onClick={() => updateField("avatar", avatar.id)}
                          className="flex flex-col items-center gap-2"
                        >
                          <AlienAvatar
                            avatarId={avatar.id}
                            size="md"
                            selected={formData.avatar === avatar.id}
                            showGlow={formData.avatar === avatar.id}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="text-center pt-6">
                      <AlienAvatar avatarId={formData.avatar} size="xl" />
                      <p className="text-cyan-400 font-semibold mt-4">Your Money Bro is ready!</p>
                    </div>
                  </div>
                )}

                {step === 5 && (
                   <div className="space-y-6">
                     <div className="text-center mb-6">
                       <span className="text-5xl">🚀</span>
                       <h2 className="text-2xl font-bold text-white mt-4 mb-2">Ready to Level Up?</h2>
                       <p className="text-slate-400">Choose your plan</p>
                     </div>

                     {/* Free Plan */}
                     <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                       <div className="flex items-start justify-between mb-3">
                         <div>
                           <h3 className="text-white font-bold">Free</h3>
                           <p className="text-cyan-400 text-sm font-semibold">Forever Free</p>
                         </div>
                       </div>
                       <ul className="space-y-1.5 text-slate-300 text-xs">
                         <li>✓ 5 AI messages/month</li>
                         <li>✓ Basic budgeting</li>
                         <li>✓ Transaction tracking</li>
                         <li>✓ Spending insights</li>
                       </ul>
                     </div>

                     {/* Pro Plan */}
                     <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 rounded-xl p-4 relative">
                       <div className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                         RECOMMENDED
                       </div>
                       <div className="flex items-start justify-between mb-3">
                         <div>
                           <h3 className="text-white font-bold">Pro</h3>
                           <p className="text-purple-400 text-sm font-semibold">$9.99/month</p>
                         </div>
                       </div>
                       <ul className="space-y-1.5 text-slate-300 text-xs">
                         <li>✓ 30 AI messages/month</li>
                         <li>✓ Receipt Scanner</li>
                         <li>✓ Finance Vault</li>
                         <li>✓ Advanced analytics</li>
                         <li>✓ Multi-currency tracking</li>
                         <li>✓ Debit & Credit cards (up to 5)</li>
                       </ul>
                     </div>

                     {/* Elite Plan */}
                     <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/50 rounded-xl p-4">
                       <div className="flex items-start justify-between mb-3">
                         <div>
                           <h3 className="text-white font-bold">Elite</h3>
                           <p className="text-blue-400 text-sm font-semibold">$14.99/month</p>
                         </div>
                       </div>
                       <ul className="space-y-1.5 text-slate-300 text-xs">
                         <li>✓ 50 AI messages/month</li>
                         <li>✓ All Pro features</li>
                         <li>✓ Unlimited Debit & Credit cards</li>
                         <li>✓ Investment tracking</li>
                         <li>✓ Net worth tracker</li>
                         <li>✓ Global expat tools</li>
                       </ul>
                     </div>

                     {/* Action Buttons */}
                     <div className="space-y-3 pt-2">
                       <NeonButton
                         variant="purple"
                         className="w-full"
                         onClick={() => {
                           window.webkit?.messageHandlers?.iap?.postMessage({
                             action: 'subscribe',
                             productId: 'com.myfinancebro.pro.monthly'
                           });
                           if (window.Android?.purchaseSubscription) {
                             window.Android.purchaseSubscription('com.myfinancebro.pro.monthly');
                           }
                         }}
                       >
                         Upgrade to Pro — $9.99/month
                       </NeonButton>
                       <NeonButton
                         variant="primary"
                         className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                         onClick={() => {
                           window.webkit?.messageHandlers?.iap?.postMessage({
                             action: 'subscribe',
                             productId: 'com.myfinancebro.elite.monthly'
                           });
                           if (window.Android?.purchaseSubscription) {
                             window.Android.purchaseSubscription('com.myfinancebro.elite.monthly');
                           }
                         }}
                       >
                         Upgrade to Elite — $14.99/month
                       </NeonButton>
                       <NeonButton
                         variant="ghost"
                         className="w-full text-slate-400"
                         onClick={() => {
                           window.webkit?.messageHandlers?.iap?.postMessage({ action: 'restore' });
                           if (window.Android?.restorePurchases) {
                             window.Android.restorePurchases();
                           }
                         }}
                       >
                         Restore Purchases
                       </NeonButton>
                       <NeonButton
                         variant="ghost"
                         className="w-full"
                         onClick={() => handleUpgradeTier('free')}
                       >
                         Continue with Free
                       </NeonButton>
                     </div>

                     {/* Required Apple subscription legal disclosure */}
                     <div className="pt-2 text-center text-xs text-slate-500 space-y-1 px-1">
                       <p>Subscriptions auto-renew monthly unless canceled at least 24 hours before the end of the current period. Payment is charged to your App Store account at confirmation of purchase.</p>
                       <p>Manage or cancel in your App Store account settings.</p>
                       <div className="flex justify-center gap-4 pt-1">
                         <button onClick={() => navigate(createPageUrl('PrivacyPolicy'))} className="underline text-slate-400">Privacy Policy</button>
                         <button onClick={() => navigate(createPageUrl('TermsOfService'))} className="underline text-slate-400">Terms</button>
                       </div>
                     </div>
                   </div>
                 )}
              </NeonCard>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="max-w-md mx-auto w-full mt-6 flex gap-4">
            {step > 1 && (
              <NeonButton
                variant="secondary"
                onClick={() => setStep(s => s - 1)}
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </NeonButton>
            )}
            
            {step < 4 ? (
              <NeonButton
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </NeonButton>
            ) : step === 4 ? (
              <NeonButton
                onClick={handleSubmit}
                loading={loading}
                disabled={!canProceed()}
                className="flex-1"
              >
                <Rocket className="w-5 h-5" />
                Let's Get Started
              </NeonButton>
            ) : null}
          </div>
        )}
      </div>
    </SpaceBackground>
  );
}