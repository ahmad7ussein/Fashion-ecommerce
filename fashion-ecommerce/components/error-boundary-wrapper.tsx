"use client"

import dynamic from "next/dynamic"
import { ReactNode } from "react"

// Dynamically import ErrorBoundary to avoid chunk loading issues
const ErrorBoundary = dynamic(
  () => import("@/components/error-boundary").then((mod) => mod.default),
  { ssr: false }
)

interface ErrorBoundaryWrapperProps {
  children: ReactNode
}

export default function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

