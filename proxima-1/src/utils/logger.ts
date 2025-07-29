// Environment-aware logger utility
// Only logs in development mode, silent in production

const isDevelopment = process.env.NODE_ENV === 'development';

interface LoggerOptions {
  force?: boolean; // Force logging even in production
}

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    // Always log errors, but with more detail in development
    if (isDevelopment) {
      console.error(message, ...args);
    } else {
      // In production, log minimal error info
      console.error(message);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(message, ...args);
    }
  },

  // For critical logs that should always appear
  critical: (message: string, ...args: any[]) => {
    console.error(`[CRITICAL] ${message}`, ...args);
  }
};

// Helper to sanitize sensitive data from logs
export const sanitizeForLog = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  });
  
  return sanitized;
};