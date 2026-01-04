"use client";
import ErrorBoundary from "@/components/error-boundary";
export default function ErrorBoundaryWrapper({ children }) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
}
