'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EditorErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 my-12 border-2 border-dashed border-destructive/20 rounded-xl bg-destructive/5 max-w-lg mx-auto text-center space-y-4 animate-fade-in">
          <div className="p-3 bg-destructive/10 rounded-full text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">Editor Crash Detected</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            An unexpected error occurred while rendering the collaborative editor. This can sometimes happen due to network latency or conflicting real-time sync states.
          </p>
          {this.state.error && (
            <div className="w-full text-left text-xs bg-muted p-3 rounded font-mono overflow-auto max-h-32 border border-border">
              {this.state.error.toString()}
            </div>
          )}
          <Button onClick={this.handleReload} variant="outline" className="gap-2 mt-2">
            <RefreshCw className="h-4 w-4" />
            Reload Workspace
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
