import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Comprehensive logging for intelligence features
export interface IntelligenceLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  action: string;
  data?: any;
  error?: any;
  userId?: string;
  sessionId?: string;
}

class IntelligenceLogger {
  private logs: IntelligenceLog[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  
  constructor() {
    // Set up periodic log upload in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      setInterval(() => this.uploadLogs(), 5 * 60 * 1000); // Every 5 minutes
    }
  }
  
  private formatLog(log: Omit<IntelligenceLog, 'timestamp'>): IntelligenceLog {
    return {
      ...log,
      timestamp: new Date().toISOString(),
      sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('session_id') || undefined : undefined
    };
  }
  
  debug(component: string, action: string, data?: any) {
    const log = this.formatLog({ level: 'debug', component, action, data });
    this.addLog(log);
    console.log(`[${component}] ${action}`, data);
  }
  
  info(component: string, action: string, data?: any) {
    const log = this.formatLog({ level: 'info', component, action, data });
    this.addLog(log);
    console.info(`[${component}] ${action}`, data);
  }
  
  warn(component: string, action: string, data?: any) {
    const log = this.formatLog({ level: 'warn', component, action, data });
    this.addLog(log);
    console.warn(`[${component}] ${action}`, data);
  }
  
  error(component: string, action: string, error: any, data?: any) {
    const log = this.formatLog({ 
      level: 'error', 
      component, 
      action, 
      data,
      error: {
        message: error?.message || String(error),
        stack: error?.stack,
        name: error?.name
      }
    });
    this.addLog(log);
    console.error(`[${component}] ${action}`, error, data);
    
    // Immediately upload errors in production
    if (process.env.NODE_ENV === 'production') {
      this.uploadLogs([log]);
    }
  }
  
  private addLog(log: IntelligenceLog) {
    this.logs.push(log);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Store in localStorage for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      try {
        const storedLogs = JSON.parse(localStorage.getItem('intelligence_logs') || '[]');
        storedLogs.push(log);
        // Keep only last 100 in localStorage
        if (storedLogs.length > 100) {
          storedLogs.splice(0, storedLogs.length - 100);
        }
        localStorage.setItem('intelligence_logs', JSON.stringify(storedLogs));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }
  
  private async uploadLogs(logsToUpload?: IntelligenceLog[]) {
    const logs = logsToUpload || this.logs.filter(log => log.level === 'error' || log.level === 'warn');
    
    if (logs.length === 0) return;
    
    try {
      // In production, send to logging service
      if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs })
        });
      }
      
      // Clear uploaded logs if successful
      if (!logsToUpload) {
        this.logs = this.logs.filter(log => log.level !== 'error' && log.level !== 'warn');
      }
    } catch (error) {
      console.error('Failed to upload logs:', error);
    }
  }
  
  getLogs(level?: IntelligenceLog['level'], component?: string): IntelligenceLog[] {
    return this.logs.filter(log => 
      (!level || log.level === level) &&
      (!component || log.component === component)
    );
  }
  
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('intelligence_logs');
    }
  }
  
  downloadLogs() {
    if (typeof window === 'undefined') return;
    
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelligence-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Singleton logger instance
export const intelligenceLogger = new IntelligenceLogger();

// Hook for components to use logging
export function useIntelligenceLogging(componentName: string) {
  const queryClient = useQueryClient();
  
  // Log component mount/unmount
  useEffect(() => {
    intelligenceLogger.debug(componentName, 'Component mounted');
    
    return () => {
      intelligenceLogger.debug(componentName, 'Component unmounted');
    };
  }, [componentName]);
  
  // Set up query client error logging
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'error' && event.query.queryKey[0]?.toString().includes('intelligence')) {
        intelligenceLogger.error(
          componentName,
          `Query failed: ${event.query.queryKey}`,
          event.query.state.error,
          { queryKey: event.query.queryKey }
        );
      }
    });
    
    return unsubscribe;
  }, [queryClient, componentName]);
  
  return {
    logDebug: (action: string, data?: any) => intelligenceLogger.debug(componentName, action, data),
    logInfo: (action: string, data?: any) => intelligenceLogger.info(componentName, action, data),
    logWarn: (action: string, data?: any) => intelligenceLogger.warn(componentName, action, data),
    logError: (action: string, error: any, data?: any) => intelligenceLogger.error(componentName, action, error, data)
  };
}

// Debug helper for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).intelligenceLogger = intelligenceLogger;
  console.log('Intelligence Logger available at window.intelligenceLogger');
  console.log('Commands: getLogs(), clearLogs(), downloadLogs()');
}