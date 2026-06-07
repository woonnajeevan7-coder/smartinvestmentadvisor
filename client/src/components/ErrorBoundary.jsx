import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 Error Boundary Caught Exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neu-bg p-4 md:p-8 font-sans">
          <div className="w-full max-w-[600px] bg-neu-bg rounded-[30px] p-8 md:p-12 shadow-[20px_20px_60px_#c8ccd1,-20px_-20px_60px_#ffffff] text-center border border-white/50">
            <div className="w-16 h-16 bg-red-50/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-neu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-black text-neu-primary font-jakarta uppercase tracking-wider mb-4">
              Terminal Exception
            </h1>
            
            <p className="text-neu-muted font-medium text-sm leading-relaxed mb-8">
              A runtime boundary error has occurred. The system logs have recorded this event. Attempt to re-establish the environment session by resetting.
            </p>

            {this.state.error && (
              <pre className="bg-neu-bg shadow-neu-inset text-left text-xs font-mono text-red-400 p-4 rounded-xl overflow-x-auto mb-8 max-h-[150px]">
                {this.state.error.toString()}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="px-8 py-4 bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary font-jakarta text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
            >
              Reset Session
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
