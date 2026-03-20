const FALLBACK_BASE44_APP_URL = 'https://my-finance-bro-c7438db0.base44.app';

const normalizeUrl = (value) => {
  if (!value) return null;
  return value.replace(/\/+$/, '');
};

const envBase44Url =
  import.meta.env.VITE_BASE44_APP_BASE_URL ||
  import.meta.env.VITE_BASE44_BACKEND_URL ||
  FALLBACK_BASE44_APP_URL;

export const BASE44_APP_URL = normalizeUrl(envBase44Url);
export const BASE44_APP_ID = import.meta.env.VITE_BASE44_APP_ID || null;
export const BASE44_RUNTIME = typeof window !== 'undefined' && window?.Capacitor ? 'capacitor' : 'web';

export const logBase44Debug = (message, details = {}) => {
  if (!import.meta.env.DEV && localStorage.getItem('debug_base44') !== 'true') return;
  console.info(`[Base44] ${message}`, details);
};

export const logBase44Error = (message, error, details = {}) => {
  console.error(`[Base44] ${message}`, {
    ...details,
    errorMessage: error?.message,
    status: error?.status || error?.response?.status,
    responseData: error?.data || error?.response?.data,
  });
};
