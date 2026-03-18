import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FEATURE_MAP } from './FEATURE_MAP';

export function usePaywall(featureId) {
  const queryClient = useQueryClient();

  // Get user profile with subscription tier
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0];

  // Get subscription
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: () => base44.entities.Subscription.list(),
    enabled: !!profile,
  });

  // Get feature trials
  const { data: trials = [] } = useQuery({
    queryKey: ['featureTrials'],
    queryFn: () => base44.entities.FeatureTrial.list(),
    enabled: !!profile,
  });

  const feature = FEATURE_MAP[featureId];
  const currentTier = profile?.plan_tier || 'free';
  const subscription = subscriptions.find(s => s.status === 'active');
  const trial = trials.find(t => t.feature_name === featureId);
  const trialUsed = trial?.trial_used || false;

  // Check if trial is within 24 hours
  const isTrialActive = () => {
    if (!trial?.trial_used || !trial?.used_at) return false;
    const usedAt = new Date(trial.used_at);
    const now = new Date();
    const hoursSinceUsed = (now - usedAt) / (1000 * 60 * 60);
    return hoursSinceUsed < 24;
  };

  // Check if user can access feature
  const canAccess = () => {
    const tierHierarchy = { free: 0, pro: 1, elite: 2 };
    const userLevel = tierHierarchy[currentTier];
    const requiredLevel = tierHierarchy[feature?.minTier || 'free'];
    const hasTierAccess = userLevel >= requiredLevel;
    return hasTierAccess || isTrialActive();
  };

  // Trial is available only if never used before
  const canUseTrial = () => {
    return !canAccess() && !trialUsed;
  };

  // Get upgrade tier (next tier that unlocks this feature)
  const getUpgradeTier = () => {
    return feature?.minTier || 'pro';
  };

  const consumeTrial = async (featureId) => {
    try {
      const existing = trials?.find(t => t.feature_name === featureId);

      if (existing) {
        await base44.entities.FeatureTrial.update(existing.id, {
          trial_used: true,
          used_at: new Date().toISOString(),
        });
      } else {
        await base44.entities.FeatureTrial.create({
          feature_name: featureId,
          trial_used: true,
          used_at: new Date().toISOString(),
        });
      }

      queryClient.invalidateQueries(['featureTrials']);
      return true;
    } catch (err) {
      console.error('consumeTrial failed:', err);
      return false;
    }
  };

  return {
    feature,
    currentTier,
    subscription,
    trial,
    canAccess: canAccess(),
    canUseTrial: canUseTrial(),
    trialUsed,
    upgradeTier: getUpgradeTier(),
    isLoading: !profile,
    consumeTrial,
  };
}