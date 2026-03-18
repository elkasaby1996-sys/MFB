import { useState } from 'react';
import { usePaywall } from './usePaywall';
import PaywallModal from './PaywallModal';
import { FEATURE_MAP } from './FEATURE_MAP';

export default function PaywallGate({ featureId, children, requiredTier, fullScreen = false }) {
  const { canAccess, canUseTrial, trialUsed, consumeTrial } = usePaywall(featureId);
  const [showModal, setShowModal] = useState(false);
  const feature = FEATURE_MAP[featureId];

  if (canAccess) {
    return <>{children}</>;
  }

  const handleTrialGranted = () => {
    setShowModal(false);
  };

  // Show full page blurred with centered overlay
  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Full page blurred content */}
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }} className="inset-0 overflow-auto">
        {children}
      </div>
      {/* Centered overlay - starts below header */}
      <div className="fixed left-0 right-0 top-[calc(env(safe-area-inset-top,0px)+56px)] bottom-0 flex flex-col items-center justify-center bg-slate-900/80 z-50">
        <div className="text-center">
          <span className='text-5xl mb-4 block'>🔒</span>
          <p className='text-white font-bold text-xl mb-2'>{feature?.name}</p>
          <p className='text-slate-400 text-sm mb-6'>7-day free trial</p>
          <button
            onClick={() => setShowModal(true)}
            className='bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-8 py-3 rounded-xl transition-colors'
          >
            Start 7-Day Free Trial
          </button>
        </div>
      </div>
      <PaywallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        canUseTrial={canUseTrial}
        onUseTrial={() => consumeTrial(featureId)}
        onTrialGranted={handleTrialGranted}
      />
    </div>
  );
}