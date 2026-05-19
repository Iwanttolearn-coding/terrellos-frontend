import { Component } from 'react';

/**
 * Global React Error Boundary
 * Catches runtime crashes and shows a friendly recovery UI
 * instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || 'Unknown error';
    const isApiError = msg.includes('404') || msg.includes('invoke') || msg.includes('API') || msg.includes('fetch');

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          {isApiError ? (
            <p className="text-sm text-zinc-400">
              The backend is temporarily unavailable or a request failed.
              Your app and data are safe — this is a connection issue.
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              An unexpected error occurred. Try refreshing the page.
            </p>
          )}
          <p className="text-xs font-mono text-zinc-600 bg-zinc-800 rounded p-2 text-left break-all">
            {msg.slice(0, 200)}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
