"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Logo } from "@/components/logo"
import logger from "@/lib/logger"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
})

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { login, register, user, isLoading } = useAuth()
  
  // Redirect if already logged in (only once)
  const hasRedirected = useRef(false)
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    if (isLoading) return
    
    logger.log("🔍 Login page - Auth check:", { isLoading, user: user?.email, role: user?.role })
    
    if (user) {
      hasRedirected.current = true
      logger.log("👤 User already logged in:", user)
      logger.log("👤 User role:", user.role)
      
      const role = String(user.role || "").toLowerCase().trim()
      
      if (role === "admin") {
        logger.log("🔄 Already logged in as admin, redirecting to /admin")
        router.replace("/admin")
      } else if (role === "employee") {
        logger.log("🔄 Already logged in as employee, redirecting to /employee")
        router.replace("/employee")
      } else {
        logger.log("🔄 Already logged in as customer, redirecting to /")
        router.replace("/")
      }
    }
  }, [user, isLoading, router])

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    identifier: "", // Email only
    password: "",
    rememberMe: false,
  })

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateSignUp = () => {
    const newErrors: Record<string, string> = {}

    if (!signUpData.firstName.trim()) newErrors.firstName = "First name is required"
    else if (signUpData.firstName.length < 2) newErrors.firstName = "First name must be at least 2 characters"

    if (!signUpData.lastName.trim()) newErrors.lastName = "Last name is required"
    else if (signUpData.lastName.length < 2) newErrors.lastName = "Last name must be at least 2 characters"

    if (!signUpData.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpData.email)) newErrors.email = "Please enter a valid email"

    if (!signUpData.password) newErrors.password = "Password is required"
    else if (signUpData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    else if (!/[A-Z]/.test(signUpData.password)) newErrors.password = "Password must contain uppercase letter"
    else if (!/[a-z]/.test(signUpData.password)) newErrors.password = "Password must contain lowercase letter"
    else if (!/[0-9]/.test(signUpData.password)) newErrors.password = "Password must contain a number"

    if (!signUpData.confirmPassword) newErrors.confirmPassword = "Please confirm your password"
    else if (signUpData.password !== signUpData.confirmPassword) newErrors.confirmPassword = "Passwords don't match"

    if (!signUpData.acceptTerms) newErrors.acceptTerms = "You must accept the terms and conditions"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateSignIn = () => {
    const newErrors: Record<string, string> = {}

    if (!signInData.identifier.trim()) {
      newErrors.identifier = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInData.identifier)) {
      newErrors.identifier = "Please enter a valid email"
    }

    if (!signInData.password) newErrors.password = "Password is required"
    else if (signInData.password.length < 6) newErrors.password = "Password must be at least 6 characters"

    setErrors(newErrors)
    
    return Object.keys(newErrors).length === 0
  }

  const handleGoogleLogin = async (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent multiple simultaneous requests
    if (isGoogleLoading) {
      return;
    }

    // Check for Google Client ID first (before doing anything else)
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.trim() === '' || googleClientId.includes('your-google-client-id') || googleClientId.includes('placeholder')) {
      toast({
        title: "خطأ في الإعدادات",
        description: "Google Client ID غير موجود أو غير صحيح. يرجى إضافة Client ID حقيقي من Google Cloud Console في ملف .env.local",
        variant: "destructive",
        duration: 8000,
      });
      console.error("❌ Google Client ID missing or invalid:", googleClientId);
      return;
    }

    // Check current origin for debugging
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      const fullUrl = window.location.href;
      
      console.log("=".repeat(60));
      console.log("🔍 Google Sign-In Debug Info:");
      console.log("=".repeat(60));
      console.log("📍 Current Origin:", currentOrigin);
      console.log("🌐 Full URL:", fullUrl);
      console.log("🔑 Google Client ID:", googleClientId);
      console.log("=".repeat(60));
      console.log("⚠️ IMPORTANT: Add this EXACT origin to Google Cloud Console:");
      console.log(`   ${currentOrigin}`);
      console.log("=".repeat(60));
      
      logger.log("🔍 Current Origin:", currentOrigin);
      logger.log("🔑 Google Client ID:", googleClientId);
      
      // Always show toast with current origin
      toast({
        title: "معلومات Origin",
        description: `Origin الحالي: ${currentOrigin}. تأكد من إضافة هذا بالضبط في Google Cloud Console → Authorized JavaScript origins`,
        variant: "default",
        duration: 8000,
      });
    }

    setIsGoogleLoading(true);

    try {
      // Wait for Google Identity Services to load
      if (typeof window === 'undefined') {
        setIsGoogleLoading(false);
        return;
      }
      
      // Load Google Identity Services script dynamically only when needed
      if (!(window as any).google) {
        // Create and load script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        // Wait for script to load (max 10 seconds)
        let attempts = 0;
        while (!(window as any).google && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        if (!(window as any).google) {
          throw new Error('Google Identity Services failed to load. Please refresh the page and try again.');
        }
      }

      // Google login callback handler
      const handleGoogleCallback = async (response: any) => {
        try {
          setIsGoogleLoading(false); // Reset loading state
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
          
          // Show loading toast
          toast({
            title: "جاري تسجيل الدخول...",
            description: "يرجى الانتظار",
          });
          
          const backendResponse = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              idToken: response.credential,
            }),
          });

          const data = await backendResponse.json();

          if (!backendResponse.ok || !data.success) {
            throw new Error(data.message || 'Google login failed');
          }

          // Save token
          if (data.data.token) {
            localStorage.setItem('auth_token', data.data.token);
          }

          // Show success message
          toast({
            title: "تم تسجيل الدخول بنجاح! 🎉",
            description: `مرحباً ${data.data.user.firstName}!`,
          });

          // Redirect based on role
          const role = String(data.data.user.role || "").toLowerCase().trim();
          const redirectUrl = role === "admin" 
            ? "/admin" 
            : role === "employee" 
            ? "/employee" 
            : "/";
          
          // Small delay for better UX
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 500);
        } catch (error: any) {
          setIsGoogleLoading(false); // Reset loading state on error
          logger.error("❌ Google login error:", error);
          toast({
            title: "فشل تسجيل الدخول",
            description: error.message || "حدث خطأ أثناء تسجيل الدخول باستخدام Google",
            variant: "destructive",
          });
        }
      };

      // Check if already initialized to prevent multiple initializations
      if (!(window as any).google.accounts?.id?._clientId) {
        // Initialize Google Identity Services with better UX
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
      }

      // Use One Tap for better UX (more elegant than prompt)
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            // If One Tap is not displayed, fallback to button click
            logger.log("One Tap not displayed, using button");
          } else if (notification.isSkippedMoment()) {
            logger.log("One Tap skipped");
          } else if (notification.isDismissedMoment()) {
            logger.log("One Tap dismissed");
          }
        });
      } catch (promptError: any) {
        logger.warn("Google One Tap error:", promptError);
        // Fallback: just show the button is ready
      }
    } catch (error: any) {
      logger.error("❌ Google login initialization error:", error);
      toast({
        title: "خطأ في التهيئة",
        description: error.message || "حدث خطأ أثناء تهيئة تسجيل الدخول باستخدام Google. تأكد من إعداد Google Client ID.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  }

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    logger.log("🔵 Form submitted! onLoginSubmit called")
    logger.log("📋 Form data:", { identifier: signInData.identifier, hasPassword: !!signInData.password })
    
    if (!validateSignIn()) {
      logger.error("❌ Validation failed!")
      logger.error("❌ Errors:", errors)
      return
    }
    
    logger.log("✅ Validation passed, proceeding with login...")

    try {
      logger.log("🚀 Starting login process...")
      logger.log("📧 Email/Identifier:", signInData.identifier)
      
      const loggedInUser = await login(signInData.identifier, signInData.password)
      
      logger.log("✅ Login successful, full user data:", JSON.stringify(loggedInUser, null, 2))
      logger.log("✅ User role:", loggedInUser?.role)
      logger.log("✅ User role type:", typeof loggedInUser?.role)
      
      if (!loggedInUser) {
        logger.error("❌ No user data returned from login!")
        toast({
          title: "Login Error",
          description: "No user data received",
          variant: "destructive",
        })
        return
      }
      
      if (!loggedInUser.role) {
        logger.error("❌ No role in user data!", loggedInUser)
        toast({
          title: "Login Error",
          description: "User role not found",
          variant: "destructive",
        })
        return
      }
      
      // Get role and redirect IMMEDIATELY (before toast)
      const userRole = String(loggedInUser.role || "").toLowerCase().trim()
      logger.log("🔍 Final role check:", userRole)
      logger.log("🔍 Role comparison:", {
        userRole,
        originalRole: loggedInUser.role,
        isAdmin: userRole === "admin",
        isEmployee: userRole === "employee",
      })
      
      // Show toast (non-blocking)
      toast({
        title: "Welcome back! 🎉",
        description: "You have successfully logged in.",
      })
      
      // Force redirect immediately - use absolute URL
      const redirectUrl = userRole === "admin" 
        ? "/admin" 
        : userRole === "employee" 
        ? "/employee" 
        : "/"
      
      logger.log("🔄 REDIRECTING TO", redirectUrl, "NOW!")
      logger.log("📍 Current location:", window.location.href)
      logger.log("📍 User role confirmed:", userRole)
      
      // Use router for faster navigation
      router.replace(redirectUrl)
      
      return // Exit early
    } catch (error: any) {
      logger.error("❌ Login error caught:", error)
      let errorMessage = error?.message || "Invalid email or password"
      let errorTitle = "Login failed"
      let errorDetails = ""
      
      // Determine error type and provide detailed messages
      if (errorMessage.includes("Cannot connect to the server") || 
          errorMessage.includes("Failed to fetch") || 
          errorMessage.includes("Network Error") ||
          errorMessage.includes("Backend may be offline") ||
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("ERR_CONNECTION_REFUSED") ||
          errorMessage.includes("ERR_NETWORK")) {
        errorTitle = "🔌 Connection Error"
        errorMessage = "Cannot connect to the server"
        errorDetails = "The backend server is not running or not accessible. Please:\n• Make sure the backend server is running on http://localhost:5000\n• Check if the server is started correctly\n• Verify your internet connection"
      } else if (errorMessage.includes("Invalid email or password") || errorMessage.includes("Invalid credentials") || errorMessage.includes("401")) {
        errorTitle = "Authentication Failed"
        errorMessage = "Invalid email or password"
        errorDetails = "Please check your credentials and try again. Make sure your email and password are correct."
      } else if (errorMessage.includes("500") || errorMessage.includes("Server error")) {
        errorTitle = "Server Error"
        errorMessage = "Server error occurred"
        errorDetails = "The server encountered an error. Please try again later or contact support if the problem persists."
      } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        errorTitle = "Service Not Found"
        errorMessage = "Login endpoint not found"
        errorDetails = "The login service is not available. Please check the server configuration."
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorTitle = "Request Timeout"
        errorMessage = "The request took too long"
        errorDetails = "The server is taking too long to respond. Please check your internet connection and try again."
      } else if (errorMessage.includes("buffering timed out") || errorMessage.includes("database")) {
        errorTitle = "Database Connection Error"
        errorMessage = "Database connection timeout"
        errorDetails = "The database is not responding. Please make sure MongoDB is running and the backend server has connected to it."
      } else {
        // For other errors, show the actual error message
        errorDetails = "An unexpected error occurred. Please try again."
      }
      
      // Show detailed error toast
      toast({
        title: errorTitle,
        description: (
          <div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>
            {errorDetails && (
              typeof errorDetails === 'string' 
                ? <p className="text-sm opacity-90">{errorDetails}</p>
                : <div className="text-sm opacity-90">{errorDetails}</div>
            )}
            {process.env.NODE_ENV === 'development' && error?.message && (
              <p className="text-xs opacity-75 mt-2 pt-2 border-t border-destructive/20">
                Technical: {error.message}
              </p>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      })
    }
  }

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    logger.log("🔵 Form submitted!")
    logger.log("📝 Sign Up Data:", signUpData)

    if (!validateSignUp()) {
      logger.error("❌ Validation failed!")
      logger.error("🚫 Errors:", errors)
      return
    }

    logger.log("✅ Validation passed!")

    try {
      logger.log("🚀 Calling register API...")
      await register({
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        email: signUpData.email,
        password: signUpData.password,
      })
      logger.log("✅ Registration successful!")
      toast({
        title: "Account created! ✨",
        description: `Welcome, ${signUpData.firstName}! Your account has been created successfully.`,
      })
      setTimeout(() => {
        router.push("/profile")
      }, 1000)
    } catch (error: any) {
      logger.error("❌ Registration error:", error)
      
      // Extract error message properly
      let errorMessage = "Registration failed. Please try again."
      
      // Try to extract from different error structures
      if (error?.message) {
        // Check if message is a JSON string
        if (typeof error.message === 'string' && error.message.startsWith('{')) {
          try {
            const parsed = JSON.parse(error.message)
            errorMessage = parsed.message || parsed.error || errorMessage
          } catch {
            errorMessage = error.message
          }
        } else {
          errorMessage = error.message
        }
      }
      
      // Try to extract from responseBody if available
      if (error?.responseBody) {
        try {
          const parsed = typeof error.responseBody === 'string' 
            ? JSON.parse(error.responseBody) 
            : error.responseBody
          if (parsed?.message) {
            errorMessage = parsed.message
          }
        } catch {
          // Ignore parse errors
        }
      }
      
      // Check for specific error messages
      if (errorMessage.includes("User already exists") || 
          errorMessage.includes("already exists with this email") ||
          errorMessage.includes("email already")) {
        errorMessage = "This email is already registered. Please use a different email or try logging in."
      }
      
      let errorTitle = "Registration Failed"
      let errorDetails: string | React.ReactNode = ""
      
      // Determine error type and provide detailed messages
      if (errorMessage.includes("Cannot connect to the server") || 
          errorMessage.includes("Failed to fetch") || 
          errorMessage.includes("Network Error") ||
          errorMessage.includes("Backend may be offline") ||
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("ERR_CONNECTION_REFUSED") ||
          errorMessage.includes("ERR_NETWORK")) {
        errorTitle = "🔌 Connection Error"
        errorMessage = "Cannot connect to the server"
        errorDetails = (
          <div className="space-y-1">
            <p>The backend server is not running or not accessible.</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
              <li>Make sure the backend server is running on http://localhost:5000</li>
              <li>Check if the server is started correctly</li>
              <li>Verify your internet connection</li>
            </ul>
          </div>
        )
      } else if (errorMessage.includes("User already exists") || 
                 errorMessage.includes("already exists with this email") ||
                 errorMessage.includes("already exists") || 
                 errorMessage.includes("duplicate") || 
                 errorMessage.includes("409")) {
        errorTitle = "Email Already Registered"
        errorMessage = "This email is already registered. Please use a different email or try logging in."
        errorDetails = (
          <div className="space-y-1">
            <p>An account with this email already exists. You can:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
              <li>Try logging in with this email</li>
              <li>Use a different email address</li>
              <li>Reset your password if you forgot it</li>
            </ul>
          </div>
        )
      } else if (errorMessage.includes("validation") || errorMessage.includes("400")) {
        errorTitle = "Invalid Information"
        errorMessage = "Please check your information"
        errorDetails = "Some of the information you provided is invalid. Please review and correct the errors."
      } else if (errorMessage.includes("500") || errorMessage.includes("Server error")) {
        errorTitle = "Server Error"
        errorMessage = "Server error occurred"
        errorDetails = "The server encountered an error. Please try again later or contact support if the problem persists."
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorTitle = "Request Timeout"
        errorMessage = "The request took too long"
        errorDetails = "The server is taking too long to respond. Please check your internet connection and try again."
      } else {
        errorDetails = "An unexpected error occurred. Please try again."
      }
      
      // Show detailed error toast
      toast({
        title: errorTitle,
        description: (
          <div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>
            {errorDetails && (
              typeof errorDetails === 'string' 
                ? <p className="text-sm opacity-90">{errorDetails}</p>
                : <div className="text-sm opacity-90">{errorDetails}</div>
            )}
            {process.env.NODE_ENV === 'development' && error?.message && (
              <p className="text-xs opacity-75 mt-2 pt-2 border-t border-destructive/20">
                Technical: {error.message}
              </p>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <Link href="/" className="inline-block mb-3 sm:mb-4 transition-transform hover:scale-105">
            <Logo className="mx-auto scale-90 sm:scale-100" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              {isSignUp
                ? "Join us today and start designing your custom apparel"
                : "Sign in to continue to your account"}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl">{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {isSignUp ? "Enter your information to create an account" : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {isSignUp ? (
              <form onSubmit={onRegisterSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <Input
                          id="firstName"
                          type="text"
                          className="pl-9"
                          placeholder="John"
                          autoComplete="given-name"
                          value={signUpData.firstName}
                          onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        />
                      </div>
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <Input
                          id="lastName"
                          type="text"
                          className="pl-9"
                          placeholder="Doe"
                          autoComplete="family-name"
                          value={signUpData.lastName}
                          onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        />
                      </div>
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        id="email"
                        type="text"
                        className="pl-9"
                        placeholder="you@example.com"
                        autoComplete="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="pl-9 pr-9"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="pl-9 pr-9"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  {/* Terms */}
                  <div className="space-y-2">
                    <div className="flex flex-row items-start space-x-3">
                      <Checkbox
                        id="acceptTerms"
                        checked={signUpData.acceptTerms}
                        onCheckedChange={(checked) => setSignUpData({ ...signUpData, acceptTerms: checked as boolean })}
                      />
                      <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer leading-none pt-0.5">
                        I accept the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms and Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                    {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full h-11 text-base font-semibold">
                    Create Account
                  </Button>
                </form>
            ) : (
              <form onSubmit={onLoginSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="loginIdentifier">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="loginIdentifier"
                      type="email"
                      className="pl-9"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={signInData.identifier}
                      onChange={(e) => setSignInData({ ...signInData, identifier: e.target.value })}
                    />
                  </div>
                  {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      id="loginPassword"
                      type={showPassword ? "text" : "password"}
                      className="pl-9 pr-9"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {/* Remember Me */}
                <div className="flex flex-row items-center space-x-3">
                  <Checkbox
                    id="rememberMe"
                    checked={signInData.rememberMe}
                    onCheckedChange={(checked) => setSignInData({ ...signInData, rememberMe: checked as boolean })}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold">
                  Sign In
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <Button 
              variant="outline" 
              type="button" 
              className="w-full h-12 sm:h-14 text-base font-semibold relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
              onClick={(e) => handleGoogleLogin(e)}
              onMouseDown={(e) => e.preventDefault()}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading && (
                <div className="absolute inset-0 bg-primary/10 animate-pulse" />
              )}
              <div className="relative flex items-center justify-center gap-3">
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-6 w-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="font-medium">تسجيل الدخول باستخدام Google</span>
                  </>
                )}
              </div>
            </Button>

            {/* Toggle Sign Up/In */}
            <div className="text-center text-xs sm:text-sm pt-4 border-t">
              <span className="text-muted-foreground">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setErrors({})
                  setShowPassword(false)
                  setShowConfirmPassword(false)
                }}
                className="text-primary hover:underline font-semibold transition-colors"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
