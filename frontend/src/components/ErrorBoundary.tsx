import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught exception in React tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-obsidian-900 border border-rose-500/30 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-white">Cryptographic Node Boundary</h2>
            <p className="text-xs text-editorial-subtle leading-relaxed">
              An unexpected client boundary exception occurred. Your cryptographic keys and sessions remain safely sealed in local storage.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gold-500 text-obsidian-950 shadow-gold-glow cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Sanctuary</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
