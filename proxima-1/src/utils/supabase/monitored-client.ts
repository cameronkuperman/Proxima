/**
 * Monitored Supabase Client
 * 
 * This wraps the Supabase client to add query monitoring and logging
 * for SQL injection detection and performance monitoring.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { monitorQuery } from '@/utils/sql-protection';

// Track query patterns for anomaly detection
const queryPatterns = new Map<string, number>();

/**
 * Create a monitored Supabase client
 */
export function createMonitoredClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: any
) {
  const client = createSupabaseClient(supabaseUrl, supabaseKey, options);
  
  // Wrap the `from` method to monitor queries
  const originalFrom = client.from.bind(client);
  
  client.from = (table: string) => {
    const query = originalFrom(table);
    const queryId = `${table}_${Date.now()}`;
    
    // Log query start
    logger.info('Supabase query started', {
      queryId,
      table,
      timestamp: new Date().toISOString()
    });
    
    // Track query patterns
    const pattern = `from_${table}`;
    queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
    
    // Check for anomalous patterns
    const queryCount = queryPatterns.get(pattern) || 0;
    if (queryCount > 100) {
      logger.warn('High query frequency detected', {
        table,
        count: queryCount,
        pattern
      });
    }
    
    // Wrap query methods
    const wrapMethod = (methodName: string, originalMethod: Function) => {
      return (...args: any[]) => {
        const startTime = Date.now();
        
        // Log query details (without sensitive data)
        logger.debug(`Query ${methodName}`, {
          queryId,
          table,
          method: methodName,
          // Don't log actual values to avoid logging sensitive data
          argCount: args.length
        });
        
        // Execute the query
        const result = originalMethod.apply(query, args);
        
        // Monitor async operations
        if (result && typeof result.then === 'function') {
          return result
            .then((response: any) => {
              const duration = Date.now() - startTime;
              
              // Log slow queries
              if (duration > 1000) {
                logger.warn('Slow query detected', {
                  queryId,
                  table,
                  method: methodName,
                  duration
                });
              }
              
              return response;
            })
            .catch((error: any) => {
              logger.error('Query error', {
                queryId,
                table,
                method: methodName,
                error: error.message
              });
              
              throw error;
            });
        }
        
        return result;
      };
    };
    
    // Wrap common query methods
    const methods = ['select', 'insert', 'update', 'delete', 'upsert'] as const;
    methods.forEach(method => {
      if ((query as any)[method]) {
        (query as any)[method] = wrapMethod(method, (query as any)[method]);
      }
    });
    
    return query;
  };
  
  return client;
}

/**
 * Reset query pattern tracking (for testing)
 */
export function resetQueryPatterns() {
  queryPatterns.clear();
}

/**
 * Get query pattern statistics
 */
export function getQueryStats() {
  return Object.fromEntries(queryPatterns);
}