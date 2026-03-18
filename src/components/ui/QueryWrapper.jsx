import React from 'react';
import { DashboardSkeleton } from './SkeletonLoader';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

/**
 * QueryWrapper - Handles loading, error, and empty states consistently
 * 
 * Usage:
 * <QueryWrapper isLoading={isLoading} error={error} data={data}>
 *   <YourComponent data={data} />
 * </QueryWrapper>
 */
export const QueryWrapper = ({ 
  isLoading, 
  error, 
  data, 
  children,
  loadingComponent,
  emptyComponent,
  emptyMessage = 'No data available',
  onRetry 
}) => {
  // Show loading state
  if (isLoading) {
    return loadingComponent || <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200 mb-2">
          Something went wrong
        </h3>
        <p className="text-slate-400 mb-6 max-w-md">
          {error?.response?.data?.message || error?.message || 'Failed to load data. Please try again.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Show empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    if (emptyComponent) {
      return emptyComponent;
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  // Render children with data
  return children;
};

export default QueryWrapper;