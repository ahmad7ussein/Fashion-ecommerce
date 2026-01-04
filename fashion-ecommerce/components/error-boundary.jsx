"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.resetError = () => {
            this.setState({ hasError: false, error: null });
        };
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError}/>;
            }
            return (<div className="min-h-screen flex items-center justify-center bg-black p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-red-500"/>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
              <p className="text-gray-400">
                {this.state.error?.message || "An unexpected error occurred. Please try again."}
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={this.resetError} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="h-4 w-4 mr-2"/>
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-gray-200">
                Reload Page
              </Button>
            </div>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
