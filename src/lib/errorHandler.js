import { toast } from 'sonner';

/**
 * Unified error handling across the application
 * - Toast for non-critical API/user errors
 * - Error boundary for critical/unexpected failures
 */

export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    title = 'Error',
    context = 'general',
    isRetryable = false,
  } = options;

  // Log error to Sentry if available
  if (window.Sentry) {
    window.Sentry.captureException(error, { contexts: { context } });
  }

  // Determine error message
  let message = 'Something went wrong';
  
  if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  }

  // Show toast for non-critical errors
  if (showToast) {
    const toastMessage = `${title}: ${message}`;
    if (isRetryable) {
      toast.error(toastMessage, {
        description: 'Try again',
        action: options.onRetry ? {
          label: 'Retry',
          onClick: options.onRetry,
        } : undefined,
      });
    } else {
      toast.error(toastMessage);
    }
  }

  return { message, isRetryable };
};

/**
 * Critical error handler - surfaces to error boundary
 * Throws error to be caught by ErrorBoundary
 */
export const handleCriticalError = (error, context = 'unknown') => {
  if (window.Sentry) {
    window.Sentry.captureException(error, { 
      contexts: { context, critical: true } 
    });
  }
  throw error;
};

/**
 * API error standardizer
 * Converts various API error formats to consistent structure
 */
export const normalizeApiError = (error) => {
  if (error?.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || error.response.statusText,
      data: error.response.data,
    };
  }
  
  if (error?.request) {
    return {
      status: 0,
      message: 'Network error - no response received',
    };
  }

  return {
    status: 500,
    message: error?.message || 'Unknown error',
  };
};