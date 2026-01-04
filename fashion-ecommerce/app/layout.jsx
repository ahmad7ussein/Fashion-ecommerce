import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/language";
import { RegionProvider } from "@/lib/region";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalHeader } from "@/components/conditional-header";
import ErrorBoundaryWrapper from "@/components/error-boundary-wrapper";
import { WelcomeScreen } from "@/components/welcome-screen";
import "./globals.css";
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
export const metadata = {
    title: "FashionHub - Premium Fashion & Clothing Store",
    description: "Discover the latest fashion trends. Shop premium clothing for men, women, and kids. Quality fashion at your fingertips.",
    generator: "FashionHub Platform",
    authors: [{ name: "FashionHub Team" }],
    creator: "FashionHub",
    publisher: "FashionHub",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
};
export default function RootLayout({ children, }) {
    return (<html lang="en" dir="ltr" suppressHydrationWarning>
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
    </html>);
}
