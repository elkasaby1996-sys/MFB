/**
 * Development-only logger
 * Production builds will not include these logs
 */
export const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
};

export default logger;