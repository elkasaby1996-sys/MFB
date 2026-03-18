import React from 'react';
import { useNetworkStatus } from './NetworkStatusProvider';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RequireOnline({ 
  children, 
  title = "Connect to the internet",
  message = "This screen needs an internet connection to load live data.",
  allowViewCached = false,
  cachedContent = null
}) {
  const { isOnline, retry } = useNetworkStatus();
  const navigate = useNavigate();

  if (isOnline) {
    return <>{children}</>;
  }

  // Offline state
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 flex items-center justify-center">
      <NeonCard className="p-8 max-w-md text-center" glowColor="cyan">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">{title}</h2>
          <p className="text-slate-400 text-sm">{message}</p>
        </div>

        {allowViewCached && cachedContent && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-xs mb-2">Showing cached data:</p>
            {cachedContent}
          </div>
        )}

        <div className="space-y-3">
          <NeonButton
            variant="primary"
            className="w-full"
            onClick={retry}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </NeonButton>
          <NeonButton
            variant="secondary"
            className="w-full"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <Home className="w-4 h-4" />
            Go to Home
          </NeonButton>
        </div>
      </NeonCard>
    </div>
  );
}