import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// React Error Boundary — catches rendering errors and shows a friendly fallback UI.
// Uses class component as required by React's error boundary API.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-32 text-center bg-secondary">
          {/* Error Icon */}
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-8">
            <AlertTriangle size={40} className="text-red-500" />
          </div>

          <h1 className="text-3xl md:text-4xl font-serif tracking-tighter text-black mb-4">
            Something Went Wrong
          </h1>

          <p className="text-sm text-black/60 max-w-md mx-auto mb-2">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-lg text-left">
              <p className="text-xs font-mono text-red-600 break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-8 py-3 border border-border-tan text-black text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:border-primary hover:text-primary transition-all"
            >
              <RefreshCw size={14} />
              Refresh Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition-all"
            >
              <Home size={14} />
              Go Home
            </button>
          </div>

          {/* Contact support */}
          <p className="mt-12 text-xs text-black/40">
            If the problem persists, please{' '}
            <a href="/contact" className="text-primary hover:underline">contact support</a>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
