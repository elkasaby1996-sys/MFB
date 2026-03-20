import './App.css'
import React from 'react';
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LazyPageLoader } from '@/lib/LazyPageLoader';
import { syncStatusBarStyle } from '@/lib/native';

Sentry.init({
  dsn: "https://3275d19880d1f166032269188ce027ac@o4511053095108608.ingest.de.sentry.io/4511053102383184", // Safe to expose - Sentry DSNs are public by design
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});



const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];

// Lazy load CashFlow
const CashFlow = LazyPageLoader(() => import('./pages/CashFlow'));

// Use existing pages from pagesConfig
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <></>;
const OnboardingPage = Pages.Onboarding;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return (
        <LayoutWrapper currentPageName="Onboarding">
          <OnboardingPage />
        </LayoutWrapper>
      );
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/CashFlow" element={<LayoutWrapper currentPageName="CashFlow"><CashFlow /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


const SentryFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
      <p className="text-slate-300 font-medium">Application Error</p>
      <p className="text-slate-500 text-sm text-center max-w-xs">
        An unexpected error occurred. Please refresh the page or contact support.
      </p>
    </div>
  </div>
);

function App() {
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateStatusBar = (event) => {
      syncStatusBarStyle(event.matches);
    };

    syncStatusBarStyle(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', updateStatusBar);

    return () => {
      mediaQuery.removeEventListener?.('change', updateStatusBar);
    };
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<SentryFallback />}>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <SonnerToaster richColors closeButton position="top-center" />
          <VisualEditAgent />
        </QueryClientProvider>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App
