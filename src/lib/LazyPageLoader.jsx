import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Wrapper for lazy-loaded page components
 * Provides consistent loading state across all pages
 */
const PageLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

export const LazyPageLoader = (importFn) => {
  const LazyComponent = React.lazy(importFn);
  
  return (props) => (
    <Suspense fallback={<PageLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Batch lazy load multiple pages
 * Usage: const pages = lazyLoadPages({ Dashboard: () => import('./pages/Dashboard'), ... })
 */
export const lazyLoadPages = (pageImports) => {
  return Object.entries(pageImports).reduce((acc, [name, importFn]) => {
    acc[name] = LazyPageLoader(importFn);
    return acc;
  }, {});
};