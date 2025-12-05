import type React from "react"
import type { Metadata } from "next"
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
  title: "StyleCraft - Custom Fashion Design Platform",
  description: "Design, create, and wear your vision with our interactive fashion design studio",
  generator: "StyleCraft Platform",
  authors: [{ name: "StyleCraft Team" }],
  creator: "StyleCraft",
  publisher: "StyleCraft",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ErrorBoundaryWrapper>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
