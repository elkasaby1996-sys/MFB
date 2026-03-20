import React from 'react';
import NeonButton from '@/components/ui/NeonButton';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Log to console in development (no sensitive data)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Only log to analytics if user has consented (check localStorage)
    const analyticsEnabled = localStorage.getItem('analytics_enabled') === 'true';
    if (analyticsEnabled) {
      // Log error without sensitive data - no financial amounts, no user info
      try {
        const errorData = {
          message: error?.message?.replace(/\d+/g, '[NUM]') || 'Unknown error', // Strip numbers
          stack: error?.stack?.substring(0, 300), // Limit stack size
          componentStack: errorInfo?.componentStack?.substring(0, 300),
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
        };
        // Only log sanitized error
        console.log('Error logged (sanitized):', errorData);
      } catch {
        // Fail silently - analytics should never crash the app
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h1>
              <p className="text-slate-300 mb-6">
                The app encountered an unexpected error. Don't worry, your data is safe.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-slate-800 rounded-lg text-left">
                  <p className="text-red-400 text-sm font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <NeonButton 
                onClick={this.handleReset}
                className="w-full"
              >
                <RefreshCcw className="w-5 h-5 mr-2" />
                Restart App
              </NeonButton>

              <p className="text-slate-500 text-xs mt-4">
                If this problem persists, contact support
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
