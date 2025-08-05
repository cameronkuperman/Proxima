import { z } from 'zod';
import { sanitizeString, sanitizeUUID } from './sql-protection';

/**
 * Common validation schemas used across API endpoints
 * Now with additional SQL injection protection
 */

// UUID validation schema with SQL injection protection
export const uuidSchema = z.string()
  .uuid()
  .transform((val) => sanitizeUUID(val, 'id'));

// Pagination schemas - matching existing behavior
export const paginationSchema = z.object({
  limit: z.string()
    .optional()
    .default('50')
    .transform(val => parseInt(val))
    .pipe(z.number().min(1).max(100)),
  
  offset: z.string()
    .optional()
    .default('0')
    .transform(val => parseInt(val))
    .pipe(z.number().min(0))
});

// Search schema - with SQL injection protection
export const searchSchema = z.object({
  search: z.string()
    .optional()
    .default('')
    .transform(val => val.trim())
    .pipe(z.string().max(200)) // Reasonable limit to prevent DoS
    .transform(val => val ? sanitizeString(val, 'search') : ''),
  
  type: z.string()
    .optional()
    .default('')
    .transform(val => val.trim())
    .pipe(z.string().max(50))
    .transform(val => val ? sanitizeString(val, 'type') : '')
});

// Timeline GET request schema
export const timelineGetSchema = paginationSchema.merge(searchSchema);

// Timeline POST request schema - for validation endpoint
export const timelinePostSchema = z.object({
  interactionId: uuidSchema,
  interactionType: z.enum([
    'quick_scan',
    'deep_dive',
    'photo_analysis',
    'report',
    'oracle_chat',
    'tracking_log'
  ])
});

// Type exports for TypeScript
export type TimelineGetParams = z.infer<typeof timelineGetSchema>;
export type TimelinePostBody = z.infer<typeof timelinePostSchema>;

/**
 * Validation helper that returns clean error messages
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Get the first error in a user-friendly format
  const errors = result.error.format();
  const errorMessage = result.error.issues[0]?.message || 'Invalid request data';
  const errorPath = result.error.issues[0]?.path.join('.') || '';
  
  return { 
    success: false, 
    error: errorPath ? `${errorPath}: ${errorMessage}` : errorMessage
  };
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}