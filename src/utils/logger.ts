const isDev = __DEV__;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log('[QF]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[QF]', ...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error('[QF]', ...args);
  },
};
