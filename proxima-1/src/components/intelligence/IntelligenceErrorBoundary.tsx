'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; reset: () => void }>;
}

export class IntelligenceErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    console.error('[IntelligenceErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[IntelligenceErrorBoundary] Error details:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Track error in analytics if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Intelligence Error', {
        error: error.toString(),
        stack: error.stack,
        component: 'IntelligenceErrorBoundary'
      });
    }

    this.setState({ errorInfo });
  }

  reset = () => {
    console.log('[IntelligenceErrorBoundary] Resetting error boundary');
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-400 mb-4">
                We encountered an error while loading your health intelligence. 
                This has been logged and we'll look into it.
              </p>
              
              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 p-2 bg-black/50 rounded text-xs text-red-400 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for specific intelligence features
export function withIntelligenceErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    const fallback = ({ error, reset }: { error: Error | null; reset: () => void }) => (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">
              Failed to load {componentName || 'component'}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={reset}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <IntelligenceErrorBoundary fallback={fallback}>
        <Component {...(props as P)} />
      </IntelligenceErrorBoundary>
    );
  });
}

// Export wrapped versions of intelligence components
export { IntelligenceErrorBoundary as default };