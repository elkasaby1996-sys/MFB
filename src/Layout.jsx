import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './globals.css';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import { PremiumProvider } from '@/components/providers/PremiumProvider';
import { OfflineProvider } from '@/components/providers/OfflineProvider';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { NetworkStatusProvider } from '@/components/providers/NetworkStatusProvider';
import { NavigationProvider } from '@/components/providers/NavigationProvider';
import OfflineBanner from '@/components/providers/OfflineBanner';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import QuickAddSheet from '@/components/ui/QuickAddSheet';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';


function useIOSPWASetup() {
  useEffect(() => {
    // Inject iOS PWA meta tags if not already present
    const tags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Finflow' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#0a0f1e' },
      { name: 'format-detection', content: 'telephone=no' },
    ];
    tags.forEach(({ name, content }) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });
    // viewport-fit=cover for notch support
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp && !vp.content.includes('viewport-fit')) {
      vp.content += ', viewport-fit=cover';
    }
    // Prevent bounce/overscroll on iOS
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
  }, []);
}

export default function Layout({ children, currentPageName }) {
  useIOSPWASetup();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');
  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  // Hide FAB during onboarding and upgrade screen
  const showFAB = currentPageName !== 'Onboarding' 
    && currentPageName !== 'Paywall'
    && currentPageName !== 'AIAssistant'
    && profile?.onboarding_completed;

  // Listen for quickAddClick event from BottomNav
  useEffect(() => {
    const handleQuickAdd = () => setShowQuickAdd(true);
    window.addEventListener('quickAddClick', handleQuickAdd);
    return () => window.removeEventListener('quickAddClick', handleQuickAdd);
  }, []);

  return (
    <ErrorBoundary>
      <NetworkStatusProvider>
        <OfflineProvider>
          <PremiumProvider>
            <NavigationProvider>
              <LanguageProvider>
                <OfflineBanner />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPageName}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
                {/* FAB moved to BottomNav */}
                <QuickAddSheet 
                  isOpen={showQuickAdd} 
                  onClose={() => setShowQuickAdd(false)}
                  onSelectType={(type) => {
                    setTransactionType(type);
                    setShowAddModal(true);
                  }}
                />
                <AddTransactionModal 
                  isOpen={showAddModal}
                  onClose={() => setShowAddModal(false)}
                  profile={profile}
                  initialType={transactionType}
                />
              </LanguageProvider>
            </NavigationProvider>
          </PremiumProvider>
        </OfflineProvider>
      </NetworkStatusProvider>
    </ErrorBoundary>
  );
}