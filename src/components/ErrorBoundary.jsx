import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-red-500 text-lg mb-4">⚠️</div>
            <h1 className="text-lg font-bold text-white mb-4">Something went wrong</h1>
            
            {import.meta.env.DEV ? (
              <div className="text-left">
                <p className="text-gray-400 text-sm mb-4">Development Error Details:</p>
                <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 text-xs text-red-400 overflow-auto max-h-40">
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-6">
                An unexpected error occurred. Please refresh the page or try again later.
              </p>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;