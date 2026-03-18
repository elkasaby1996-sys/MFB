/**
 * Production-safe logger utility
 * - Redacts sensitive data (amounts, receipt text, tokens)
 * - Only logs errors in production
 * - Full logging in development
 */

const IS_PRODUCTION = import.meta.env.MODE === 'production';

const SENSITIVE_KEYS = [
  'amount', 'total', 'balance', 'price', 'value', 'salary', 'income',
  'text', 'raw_text', 'ocr', 'token', 'password', 'apiKey', 'secret',
  'email', 'phone', 'address', 'ssn', 'card', 'account'
];

function redactSensitive(data) {
  if (!data || typeof data !== 'object') return data;
  
  const redacted = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitive(redacted[key]);
    }
  }
  
  return redacted;
}

export const logger = {
  debug: (...args) => {
    if (!IS_PRODUCTION) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args) => {
    if (!IS_PRODUCTION) {
      console.log('[INFO]', ...args);
    }
  },
  
  warn: (...args) => {
    if (!IS_PRODUCTION) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (message, error) => {
    // Always log errors, but redact in production
    const errorData = {
      message,
      error: error?.message || String(error),
      stack: IS_PRODUCTION ? '[REDACTED]' : error?.stack
    };
    
    console.error('[ERROR]', redactSensitive(errorData));
  }
};