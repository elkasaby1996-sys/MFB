import { useCallback } from 'react';
import { handleError, normalizeApiError } from '@/lib/errorHandler';

/**
 * Hook for standardized error handling in components
 * Automatically converts API errors to toasts
 */
export const useErrorHandler = () => {
  const handleApiError = useCallback((error, options = {}) => {
    const normalized = normalizeApiError(error);
    return handleError(
      normalized,
      {
        title: options.title || 'Error',
        context: options.context || 'api',
        ...options,
      }
    );
  }, []);

  const handleUserError = useCallback((message, options = {}) => {
    return handleError(
      new Error(message),
      {
        title: options.title || 'Oops',
        context: options.context || 'user-action',
        showToast: true,
        ...options,
      }
    );
  }, []);

  return { handleApiError, handleUserError };
};