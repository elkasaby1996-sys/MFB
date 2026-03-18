import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const PremiumContext = createContext(null);

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};

export function PremiumProvider({ children }) {
  const [tier, setTier] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  // Read-only fetch: derives effective tier purely from server-set profile fields.
  // No localStorage cache, no client-side writes to plan_tier.
  const checkPremiumStatus = async () => {
    try {
      const profiles = await base44.entities.UserProfile.list();
      const profile = profiles?.[0];

      const serverTier = profile?.plan_tier ?? 'free';
      const expiresAt = profile?.subscription_expires_at;
      const expiresAtDate = expiresAt ? new Date(expiresAt) : null;

      // Derive effective tier from server-set expiry field only — never write back
      const hasExpired = expiresAtDate && expiresAtDate < new Date();
      const effectiveTier = hasExpired ? 'free' : serverTier;

      setTier(effectiveTier);
      setLastChecked(new Date());
    } catch {
      // On error keep current tier; do not downgrade client-side
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPremiumStatus = () => checkPremiumStatus();

  useEffect(() => {
    checkPremiumStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPremiumStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isPremium    = tier === 'pro' || tier === 'elite';
  const isElite      = tier === 'elite';
  const isPro        = tier === 'pro';
  const isProOrElite = isPremium;

  return (
    <PremiumContext.Provider value={{
      isPremium,
      currentTier: tier,
      isElite,
      isPro,
      isProOrElite,
      isLoading,
      lastChecked,
      refreshPremiumStatus,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}