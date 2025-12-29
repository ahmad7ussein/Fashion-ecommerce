"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ShoppingBag, LogIn, UserPlus, ArrowRight } from "lucide-react"

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ""
  const ua = userAgent.toLowerCase()
  
  const mobileDevices = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|kindle|silk|playbook/i
  const isMobileUA = mobileDevices.test(ua)
  const isEmulator = /emulator|simulator|genymotion|bluestacks/i.test(ua)
  const desktopOS = /windows nt|macintosh|linux|ubuntu|fedora|debian/i
  const isDesktopOS = desktopOS.test(ua) && !isMobileUA && !isEmulator
  
  if (isDesktopOS) return false
  
  const width = window.innerWidth
  const height = window.innerHeight
  const isSmallScreen = width < 768
  const isTabletSize = width >= 768 && width < 1024 && height < 1366
  const hasTouch = "ontouchstart" in window || 
                   navigator.maxTouchPoints > 0 || 
                   (navigator as any).msMaxTouchPoints > 0
  const hasMouse = window.matchMedia("(pointer: fine)").matches
  
  if (isEmulator) {
    return isSmallScreen || isTabletSize
  }
  
  return isMobileUA || 
         (isSmallScreen && hasTouch && !hasMouse) ||
         (isTabletSize && hasTouch && !hasMouse && isMobileUA)
}

export function WelcomeScreen() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [isMobileDeviceState, setIsMobileDeviceState] = useState<boolean | null>(null) // null = checking
  const router = useRouter()

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = isMobileDevice()
      setIsMobileDeviceState(isMobile)
      const seen = localStorage.getItem("welcomeScreenSeen")
      
      if (isMobile && !seen) {
        setTimeout(() => {
          setShowWelcome(true)
        }, 100)
      }
    }
    
    checkDevice()
    
    const handleResize = () => {
      checkDevice()
    }
    
    window.addEventListener('resize', handleResize)
    
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'W') {
          localStorage.removeItem("welcomeScreenSeen")
          setShowWelcome(false)
          setTimeout(() => {
            checkDevice()
          }, 100)
          console.log("✅ Welcome screen reset! Reload the page to see it again.")
        }
      }
      window.addEventListener('keydown', handleKeyPress)
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('keydown', handleKeyPress)
      }
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleGetStarted = () => {
    localStorage.setItem("welcomeScreenSeen", "true")
    setShowWelcome(false)
  }

  const handleSignIn = () => {
    handleGetStarted()
    router.push("/login")
  }

  const handleSignUp = () => {
    handleGetStarted()
    router.push("/signup")
  }

  const handleBrowse = () => {
    handleGetStarted()
    router.push("/products")
  }

  if (isMobileDeviceState === null || !isMobileDeviceState || !showWelcome) {
    return null
  }

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -50, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            <div className="absolute inset-0 opacity-[0.03]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "50px 50px",
                }}
              />
            </div>
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-12"
            >
              <div className="flex justify-center mb-8">
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-cyan-500/50 rounded-full blur-2xl scale-150 animate-pulse" />
                  <div className="relative">
                    <Logo className="scale-[1.8]" />
                  </div>
                </motion.div>
              </div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-6xl font-bold text-center mb-4 text-white leading-tight"
              >
                Welcome to
                <br />
                <motion.span
                  animate={{
                    backgroundPosition: ["0%", "100%", "0%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto]"
                >
                  FashionHub
                </motion.span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-center text-gray-300 text-xl max-w-sm mx-auto font-light"
              >
                Design. Create. Wear Your Vision
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="w-full max-w-sm space-y-4 px-4"
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={handleSignIn}
                  size="lg"
                  className="w-full bg-white text-black hover:bg-gray-100 h-16 text-lg font-semibold rounded-full shadow-2xl transition-all duration-300 group relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center">
                    <LogIn className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={handleSignUp}
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 h-16 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300 group relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center">
                    <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Sign Up
                  </span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button
                  onClick={handleBrowse}
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 h-16 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300 group relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center">
                    <ShoppingBag className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    Browse Products
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-gray-500 text-sm"
            >
              <span>Start Your Fashion Journey</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

