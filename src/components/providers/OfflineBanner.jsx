import React from 'react';
import { useNetworkStatus } from './NetworkStatusProvider';
import NeonButton from '@/components/ui/NeonButton';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const { isOnline, showBanner, setShowBanner, retry } = useNetworkStatus();

  if (!showBanner || isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 pt-safe"
      >
        <div className="bg-orange-500/90 backdrop-blur-sm border-b border-orange-400/50 px-4 py-3">
          <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-white" />
              <p className="text-white text-sm font-medium">
                You're offline. Some features will be unavailable.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NeonButton
                size="sm"
                variant="ghost"
                onClick={retry}
                className="text-white border-white/30"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </NeonButton>
              <button
                onClick={() => setShowBanner(false)}
                className="text-white hover:text-orange-100 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}