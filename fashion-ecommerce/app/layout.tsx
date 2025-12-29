import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/lib/cart"
import { AuthProvider } from "@/lib/auth"
import { LanguageProvider } from "@/lib/language"
import { RegionProvider } from "@/lib/region"
import { ThemeProvider } from "@/components/theme-provider"
import { ConditionalHeader } from "@/components/conditional-header"
import ErrorBoundaryWrapper from "@/components/error-boundary-wrapper"
import { WelcomeScreen } from "@/components/welcome-screen"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FashionHub - Premium Fashion & Clothing Store",
  description: "Discover the latest fashion trends. Shop premium clothing for men, women, and kids. Quality fashion at your fingertips.",
  generator: "FashionHub Platform",
  authors: [{ name: "FashionHub Team" }],
  creator: "FashionHub",
  publisher: "FashionHub",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`font-sans antialiased student-ui`} dir="ltr" suppressHydrationWarning>
        <ErrorBoundaryWrapper>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
            <LanguageProvider>
              <RegionProvider>
                <AuthProvider>
                  <CartProvider>
                    <WelcomeScreen />
                    <ConditionalHeader />
                    {children}
                  </CartProvider>
                </AuthProvider>
              </RegionProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundaryWrapper>
        <Toaster />
      </body>
    </html>
  )
}
