/**
 * SQL Injection Protection Utilities
 * 
 * These utilities provide an extra layer of protection against SQL injection attacks
 * by sanitizing inputs before they reach Supabase queries.
 * 
 * NOTE: Supabase already protects against SQL injection through parameterized queries,
 * but this adds defense-in-depth and helps with compliance requirements.
 */

import { logger } from '@/utils/logger';

// Common SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /(--|#|\/\*|\*\/)/,  // SQL comments
  /(\bOR\b\s+\d+\s*=\s*\d+)/i,  // OR 1=1 pattern
  /(\bAND\b\s+\d+\s*=\s*\d+)/i,  // AND 1=1 pattern
  /(;|'|"|`|\\x00|\\n|\\r|\\x1a)/,  // Special characters
  /(\b(SLEEP|BENCHMARK|WAITFOR)\b)/i,  // Time-based attacks
];

// Pattern for valid UUIDs
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pattern for valid email addresses
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Sanitize a string value for use in database queries
 * Returns the sanitized string or throws an error if dangerous patterns detected
 */
export function sanitizeString(value: string | undefined | null, fieldName: string = 'value'): string {
  if (value === undefined || value === null) {
    return '';
  }

  // Convert to string and trim
  const cleanValue = String(value).trim();

  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(cleanValue)) {
      logger.warn('Potential SQL injection attempt detected', {
        fieldName,
        pattern: pattern.toString(),
        value: cleanValue.substring(0, 50) // Only log first 50 chars
      });
      
      throw new Error(`Invalid characters in ${fieldName}`);
    }
  }

  // Additional length check
  if (cleanValue.length > 1000) {
    throw new Error(`${fieldName} is too long`);
  }

  return cleanValue;
}

/**
 * Sanitize and validate a UUID
 */
export function sanitizeUUID(value: string | undefined | null, fieldName: string = 'id'): string {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }

  const cleanValue = String(value).trim().toLowerCase();

  if (!UUID_PATTERN.test(cleanValue)) {
    logger.warn('Invalid UUID format', { fieldName, value: cleanValue });
    throw new Error(`Invalid ${fieldName} format`);
  }

  return cleanValue;
}

/**
 * Sanitize and validate an email address
 */
export function sanitizeEmail(value: string | undefined | null): string {
  if (!value) {
    throw new Error('Email is required');
  }

  const cleanValue = String(value).trim().toLowerCase();

  if (!EMAIL_PATTERN.test(cleanValue)) {
    throw new Error('Invalid email format');
  }

  // Additional check for SQL injection in email
  try {
    sanitizeString(cleanValue, 'email');
  } catch {
    throw new Error('Invalid email format');
  }

  return cleanValue;
}

/**
 * Sanitize a number value
 */
export function sanitizeNumber(value: any, fieldName: string = 'number', min?: number, max?: number): number {
  const num = Number(value);

  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a number`);
  }

  if (min !== undefined && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`${fieldName} must be at most ${max}`);
  }

  return num;
}

/**
 * Sanitize an array of values
 */
export function sanitizeArray<T>(
  values: T[] | undefined | null,
  sanitizer: (value: T, index: number) => T,
  fieldName: string = 'array'
): T[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value, index) => {
    try {
      return sanitizer(value, index);
    } catch (error) {
      throw new Error(`${fieldName}[${index}]: ${error instanceof Error ? error.message : 'Invalid value'}`);
    }
  });
}

/**
 * Sanitize an enum value
 */
export function sanitizeEnum<T extends string>(
  value: string | undefined | null,
  allowedValues: readonly T[],
  fieldName: string = 'value'
): T {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }

  const cleanValue = String(value).trim();

  if (!allowedValues.includes(cleanValue as T)) {
    throw new Error(`Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`);
  }

  return cleanValue as T;
}

/**
 * Log a potentially suspicious query for monitoring
 */
export function logSuspiciousQuery(
  queryType: string,
  userId: string | undefined,
  params: Record<string, any>
): void {
  logger.warn('Suspicious query pattern detected', {
    queryType,
    userId,
    params: JSON.stringify(params).substring(0, 200), // Limit logged data
    timestamp: new Date().toISOString()
  });
}

/**
 * Middleware to wrap Supabase queries with monitoring
 */
export function monitorQuery<T>(
  queryName: string,
  userId?: string
): (promise: Promise<T>) => Promise<T> {
  return async (promise: Promise<T>) => {
    const startTime = Date.now();
    
    try {
      const result = await promise;
      
      // Log slow queries
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        logger.warn('Slow query detected', {
          queryName,
          userId,
          duration
        });
      }
      
      return result;
    } catch (error) {
      // Log query errors
      logger.error('Query error', {
        queryName,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  };
}

/**
 * Safe query builder for common patterns
 */
export const SafeQuery = {
  /**
   * Build a safe search query
   */
  buildSearchQuery(searchTerm: string | undefined): string {
    if (!searchTerm) return '';
    
    // Sanitize and escape special characters for ILIKE
    const sanitized = sanitizeString(searchTerm, 'search term');
    
    // Escape special characters for PostgreSQL LIKE/ILIKE
    const escaped = sanitized
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    
    return `%${escaped}%`;
  },

  /**
   * Build a safe array contains query
   */
  buildArrayContains<T>(values: T[]): T[] {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Values must be a non-empty array');
    }
    
    return values;
  },

  /**
   * Build a safe date range query
   */
  buildDateRange(startDate?: Date | string, endDate?: Date | string): {
    start: string;
    end: string;
  } {
    const start = startDate ? new Date(startDate).toISOString() : new Date(0).toISOString();
    const end = endDate ? new Date(endDate).toISOString() : new Date().toISOString();
    
    if (new Date(start) > new Date(end)) {
      throw new Error('Start date must be before end date');
    }
    
    return { start, end };
  }
};

// Export types for TypeScript
export type SanitizeFunction<T> = (value: T) => T;