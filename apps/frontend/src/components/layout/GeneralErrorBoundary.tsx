import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GeneralErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.fallback) return this.fallback;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-[32px] p-10 shadow-apple text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/5">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">System Interrupted</h1>
              <p className="text-muted-foreground font-medium italic">
                A critical runtime error occurred. Our agents are investigating the breach.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-muted/50 rounded-2xl border border-border text-left overflow-auto max-h-40">
                <code className="text-[10px] text-red-400 font-mono break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                onClick={this.handleReset}
                className="w-full rounded-full bg-primary text-white hover:bg-[#0077ED] font-black uppercase tracking-widest h-12"
              >
                <RefreshCcw size={18} className="mr-2" /> Reboot Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full rounded-full border-border text-foreground font-black uppercase tracking-widest h-12"
              >
                <Home size={18} className="mr-2" /> Return to Base
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GeneralErrorBoundary;
