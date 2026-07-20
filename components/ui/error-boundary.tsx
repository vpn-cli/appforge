"use client";

import React, { ErrorInfo, ReactNode } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught a rendering error in " + (this.props.componentName || "Component") + ":", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-4 bg-destructive/5 border-2 border-dashed border-destructive/30 rounded-xl flex flex-col gap-3 my-2 w-full">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Component rendering failed</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono break-words bg-background p-2 rounded">
            {this.state.error?.message || "Unknown rendering error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-background hover:bg-muted border border-border rounded-lg text-xs font-medium transition-colors mt-2 self-start"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
