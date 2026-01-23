"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import logger from "@/lib/logger";
import { API_BASE_URL, getApiUrl } from "@/lib/api";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters").min(1, "Password is required"),
    rememberMe: z.boolean().default(false),
});
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
});
export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { login, register, user, isLoading } = useAuth();
    const hasRedirected = useRef(false);
    const googleButtonRef = useRef(null);
    const googleInitRef = useRef(false);
    useEffect(() => {
        if (hasRedirected.current)
            return;
        if (isLoading)
            return;
        logger.log("🔍 Login page - Auth check:", { isLoading, user: user?.email, role: user?.role });
        if (user) {
            hasRedirected.current = true;
            logger.log("👤 User already logged in:", user);
            logger.log("👤 User role:", user.role);
            const role = String(user.role || "").toLowerCase().trim();
            if (role === "admin") {
                logger.log("🔄 Already logged in as admin, redirecting to /admin");
                router.replace("/admin");
            }
            else if (role === "employee") {
                logger.log("🔄 Already logged in as employee, redirecting to /employee");
                router.replace("/employee");
            }
            else {
                logger.log("🔄 Already logged in as customer, redirecting to /");
                router.replace("/");
            }
        }
    }, [user, isLoading, router]);
    const [signUpData, setSignUpData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
    });
    const [signInData, setSignInData] = useState({
        identifier: "",
        password: "",
        rememberMe: false,
    });
    const [errors, setErrors] = useState({});
    const validateSignUp = () => {
        const newErrors = {};
        if (!signUpData.firstName.trim())
            newErrors.firstName = "First name is required";
        else if (signUpData.firstName.length < 2)
            newErrors.firstName = "First name must be at least 2 characters";
        if (!signUpData.lastName.trim())
            newErrors.lastName = "Last name is required";
        else if (signUpData.lastName.length < 2)
            newErrors.lastName = "Last name must be at least 2 characters";
        if (!signUpData.email.trim())
            newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpData.email))
            newErrors.email = "Please enter a valid email";
        if (!signUpData.password)
            newErrors.password = "Password is required";
        else if (signUpData.password.length < 8)
            newErrors.password = "Password must be at least 8 characters";
        else if (!/[A-Z]/.test(signUpData.password))
            newErrors.password = "Password must contain uppercase letter";
        else if (!/[a-z]/.test(signUpData.password))
            newErrors.password = "Password must contain lowercase letter";
        else if (!/[0-9]/.test(signUpData.password))
            newErrors.password = "Password must contain a number";
        if (!signUpData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (signUpData.password !== signUpData.confirmPassword)
            newErrors.confirmPassword = "Passwords don't match";
        if (!signUpData.acceptTerms)
            newErrors.acceptTerms = "You must accept the terms and conditions";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateSignIn = () => {
        const newErrors = {};
        if (!signInData.identifier.trim()) {
            newErrors.identifier = "Email is required";
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInData.identifier)) {
            newErrors.identifier = "Please enter a valid email";
        }
        if (!signInData.password)
            newErrors.password = "Password is required";
        else if (signInData.password.length < 6)
            newErrors.password = "Password must be at least 6 characters";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const exchangeGoogleToken = useCallback(async (idToken) => {
        if (!idToken) {
            toast({
                title: "Google login failed",
                description: "No credential returned by Google.",
                variant: "destructive",
            });
            return;
        }
        setIsGoogleLoading(true);
        try {
            const backendResponse = await fetch(getApiUrl("/auth/google"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    idToken,
                }),
            });
            const data = await backendResponse.json();
            if (!backendResponse.ok || !data.success) {
                throw new Error(data.message || "Google login failed");
            }
            if (data.data.token) {
                localStorage.setItem("auth_token", data.data.token);
            }
            const role = String(data.data.user.role || "").toLowerCase().trim();
            const redirectUrl = role === "admin"
                ? "/admin"
                : role === "employee"
                    ? "/employee"
                    : "/";
            toast({
                title: "Login successful",
                description: `Welcome, ${data.data.user.firstName || "user"}!`,
            });
            window.location.href = redirectUrl;
        }
        catch (error) {
            logger.error("Google login error:", error);
            toast({
                title: "Google login failed",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsGoogleLoading(false);
        }
    }, [toast]);
    const handleGoogleCredentialResponse = useCallback(async (response) => {
        await exchangeGoogleToken(response?.credential);
    }, [exchangeGoogleToken]);
    const handleNativeGoogleLogin = useCallback(async () => {
        try {
            const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            if (clientId) {
                await GoogleAuth.initialize({ clientId });
            }
            const result = await GoogleAuth.signIn();
            const idToken = result?.authentication?.idToken || result?.idToken;
            await exchangeGoogleToken(idToken);
        }
        catch (error) {
            logger.error("Google native login error:", error);
            toast({
                title: "Google login failed",
                description: error?.message || "Please try again.",
                variant: "destructive",
            });
        }
    }, [exchangeGoogleToken, toast]);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;
        return () => {
            delete window.handleGoogleCredentialResponse;
        };
    }, [handleGoogleCredentialResponse]);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        if (window?.Capacitor?.isNativePlatform?.()) {
            return;
        }
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            logger.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
            return;
        }
        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 50;
        const initGoogle = () => {
            if (cancelled)
                return;
            const google = window.google;
            if (!google?.accounts?.id) {
                if (attempts++ < maxAttempts) {
                    setTimeout(initGoogle, 100);
                }
                else {
                    logger.error("Google Identity Services failed to load");
                }
                return;
            }
            if (googleInitRef.current)
                return;
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse,
                ux_mode: "popup",
                auto_select: false,
            });
            if (googleButtonRef.current) {
                google.accounts.id.renderButton(googleButtonRef.current, {
                    type: "standard",
                    size: "large",
                    theme: "outline",
                    text: "signin_with",
                    shape: "rectangular",
                    logo_alignment: "left",
                });
            }
            googleInitRef.current = true;
        };
        initGoogle();
        return () => {
            cancelled = true;
        };
    }, [handleGoogleCredentialResponse]);
    const onLoginSubmit = async (e) => {
        e.preventDefault();
        logger.log("🔵 Form submitted! onLoginSubmit called");
        logger.log("📋 Form data:", { identifier: signInData.identifier, hasPassword: !!signInData.password });
        if (!validateSignIn()) {
            logger.error("❌ Validation failed!");
            logger.error("❌ Errors:", errors);
            return;
        }
        logger.log("✅ Validation passed, proceeding with login...");
        try {
            logger.log("🚀 Starting login process...");
            logger.log("📧 Email/Identifier:", signInData.identifier);
            const loggedInUser = await login(signInData.identifier, signInData.password);
            logger.log("✅ Login successful, full user data:", JSON.stringify(loggedInUser, null, 2));
            logger.log("✅ User role:", loggedInUser?.role);
            logger.log("✅ User role type:", typeof loggedInUser?.role);
            if (!loggedInUser) {
                logger.error("❌ No user data returned from login!");
                toast({
                    title: "Login Error",
                    description: "No user data received",
                    variant: "destructive",
                });
                return;
            }
            if (!loggedInUser.role) {
                logger.error("❌ No role in user data!", loggedInUser);
                toast({
                    title: "Login Error",
                    description: "User role not found",
                    variant: "destructive",
                });
                return;
            }
            const userRole = String(loggedInUser.role || "").toLowerCase().trim();
            logger.log("🔍 Final role check:", userRole);
            logger.log("🔍 Role comparison:", {
                userRole,
                originalRole: loggedInUser.role,
                isAdmin: userRole === "admin",
                isEmployee: userRole === "employee",
            });
            toast({
                title: "Welcome back! 🎉",
                description: "You have successfully logged in.",
            });
            const redirectUrl = userRole === "admin"
                ? "/admin"
                : userRole === "employee"
                    ? "/employee"
                    : "/";
            logger.log("🔄 REDIRECTING TO", redirectUrl, "NOW!");
            logger.log("📍 Current location:", window.location.href);
            logger.log("📍 User role confirmed:", userRole);
            router.replace(redirectUrl);
            return;
        }
        catch (error) {
            logger.error("❌ Login error caught:", error);
            let errorMessage = error?.message || "Invalid email or password";
            let errorTitle = "Login failed";
            let errorDetails = "";
            if (errorMessage.includes("Cannot connect to the server") ||
                errorMessage.includes("Failed to fetch") ||
                errorMessage.includes("Network Error") ||
                errorMessage.includes("Backend may be offline") ||
                errorMessage.includes("fetch failed") ||
                errorMessage.includes("ERR_CONNECTION_REFUSED") ||
                errorMessage.includes("ERR_NETWORK")) {
                errorTitle = "🔌 Connection Error";
                errorMessage = "Cannot connect to the server";
                errorDetails = `The backend server is not running or not accessible. Please:\n• Make sure the backend server is running on ${API_BASE_URL().replace("/api", "")}\n• Check if the server is started correctly\n• Verify your internet connection`;
            }
            else if (errorMessage.includes("Invalid email or password") || errorMessage.includes("Invalid credentials") || errorMessage.includes("401")) {
                errorTitle = "Authentication Failed";
                errorMessage = "Invalid email or password";
                errorDetails = "Please check your credentials and try again. Make sure your email and password are correct.";
            }
            else if (errorMessage.includes("500") || errorMessage.includes("Server error")) {
                errorTitle = "Server Error";
                errorMessage = "Server error occurred";
                errorDetails = "The server encountered an error. Please try again later or contact support if the problem persists.";
            }
            else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
                errorTitle = "Service Not Found";
                errorMessage = "Login endpoint not found";
                errorDetails = "The login service is not available. Please check the server configuration.";
            }
            else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
                errorTitle = "Request Timeout";
                errorMessage = "The request took too long";
                errorDetails = "The server is taking too long to respond. Please check your internet connection and try again.";
            }
            else if (errorMessage.includes("buffering timed out") || errorMessage.includes("database")) {
                errorTitle = "Database Connection Error";
                errorMessage = "Database connection timeout";
                errorDetails = "The database is not responding. Please make sure MongoDB is running and the backend server has connected to it.";
            }
            else {
                errorDetails = "An unexpected error occurred. Please try again.";
            }
            toast({
                title: errorTitle,
                description: (<div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>
            {errorDetails && (typeof errorDetails === 'string'
                        ? <p className="text-sm opacity-90">{errorDetails}</p>
                        : <div className="text-sm opacity-90">{errorDetails}</div>)}
            {process.env.NODE_ENV === 'development' && error?.message && (<p className="text-xs opacity-75 mt-2 pt-2 border-t border-destructive/20">
                Technical: {error.message}
              </p>)}
          </div>),
                variant: "destructive",
                duration: 10000,
            });
        }
    };
    const onRegisterSubmit = async (e) => {
        e.preventDefault();
        logger.log("🔵 Form submitted!");
        logger.log("📝 Sign Up Data:", signUpData);
        if (!validateSignUp()) {
            logger.error("❌ Validation failed!");
            logger.error("🚫 Errors:", errors);
            return;
        }
        logger.log("✅ Validation passed!");
        try {
            logger.log("🚀 Calling register API...");
            await register({
                firstName: signUpData.firstName,
                lastName: signUpData.lastName,
                email: signUpData.email,
                password: signUpData.password,
            });
            logger.log("✅ Registration successful!");
            toast({
                title: "Account created! ✨",
                description: `Welcome, ${signUpData.firstName}! Your account has been created successfully.`,
            });
            setTimeout(() => {
                router.push("/profile");
            }, 1000);
        }
        catch (error) {
            logger.error("❌ Registration error:", error);
            let errorMessage = "Registration failed. Please try again.";
            if (error?.message) {
                if (typeof error.message === 'string' && error.message.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(error.message);
                        errorMessage = parsed.message || parsed.error || errorMessage;
                    }
                    catch {
                        errorMessage = error.message;
                    }
                }
                else {
                    errorMessage = error.message;
                }
            }
            if (error?.responseBody) {
                try {
                    const parsed = typeof error.responseBody === 'string'
                        ? JSON.parse(error.responseBody)
                        : error.responseBody;
                    if (parsed?.message) {
                        errorMessage = parsed.message;
                    }
                }
                catch {
                }
            }
            if (errorMessage.includes("User already exists") ||
                errorMessage.includes("already exists with this email") ||
                errorMessage.includes("email already")) {
                errorMessage = "This email is already registered. Please use a different email or try logging in.";
            }
            let errorTitle = "Registration Failed";
            let errorDetails = "";
            if (errorMessage.includes("Cannot connect to the server") ||
                errorMessage.includes("Failed to fetch") ||
                errorMessage.includes("Network Error") ||
                errorMessage.includes("Backend may be offline") ||
                errorMessage.includes("fetch failed") ||
                errorMessage.includes("ERR_CONNECTION_REFUSED") ||
                errorMessage.includes("ERR_NETWORK")) {
                errorTitle = "🔌 Connection Error";
                errorMessage = "Cannot connect to the server";
                errorDetails = (<div className="space-y-1">
            <p>The backend server is not running or not accessible.</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
              <li>Make sure the backend server is running on {API_BASE_URL().replace("/api", "")}</li>
              <li>Check if the server is started correctly</li>
              <li>Verify your internet connection</li>
            </ul>
          </div>);
            }
            else if (errorMessage.includes("User already exists") ||
                errorMessage.includes("already exists with this email") ||
                errorMessage.includes("already exists") ||
                errorMessage.includes("duplicate") ||
                errorMessage.includes("409")) {
                errorTitle = "Email Already Registered";
                errorMessage = "This email is already registered. Please use a different email or try logging in.";
                errorDetails = (<div className="space-y-1">
            <p>An account with this email already exists. You can:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
              <li>Try logging in with this email</li>
              <li>Use a different email address</li>
              <li>Reset your password if you forgot it</li>
            </ul>
          </div>);
            }
            else if (errorMessage.includes("validation") || errorMessage.includes("400")) {
                errorTitle = "Invalid Information";
                errorMessage = "Please check your information";
                errorDetails = "Some of the information you provided is invalid. Please review and correct the errors.";
            }
            else if (errorMessage.includes("500") || errorMessage.includes("Server error")) {
                errorTitle = "Server Error";
                errorMessage = "Server error occurred";
                errorDetails = "The server encountered an error. Please try again later or contact support if the problem persists.";
            }
            else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
                errorTitle = "Request Timeout";
                errorMessage = "The request took too long";
                errorDetails = "The server is taking too long to respond. Please check your internet connection and try again.";
            }
            else {
                errorDetails = "An unexpected error occurred. Please try again.";
            }
            toast({
                title: errorTitle,
                description: (<div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>
            {errorDetails && (typeof errorDetails === 'string'
                        ? <p className="text-sm opacity-90">{errorDetails}</p>
                        : <div className="text-sm opacity-90">{errorDetails}</div>)}
            {process.env.NODE_ENV === 'development' && error?.message && (<p className="text-xs opacity-75 mt-2 pt-2 border-t border-destructive/20">
                Technical: {error.message}
              </p>)}
          </div>),
                variant: "destructive",
                duration: 10000,
            });
        }
    };
    return (<div className="min-h-[100svh] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-6 sm:mb-8 space-y-4 sm:space-y-5">
          <Link href="/" className="inline-flex items-center justify-center mb-3 sm:mb-4 transition-transform hover:scale-105">
            <span className="inline-flex items-center justify-center rounded-full bg-white/85 ring-1 ring-rose-200/70 px-5 py-3 shadow-lg">
              <Logo className="h-16 w-auto sm:h-20 md:h-24"/>
            </span>
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

        
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl">{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {isSignUp ? "Enter your information to create an account" : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {isSignUp ? (<form onSubmit={onRegisterSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                        <Input id="firstName" type="text" className="pl-9" placeholder="John" autoComplete="given-name" value={signUpData.firstName} onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}/>
                      </div>
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                        <Input id="lastName" type="text" className="pl-9" placeholder="Doe" autoComplete="family-name" value={signUpData.lastName} onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}/>
                      </div>
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                      <Input id="email" type="text" className="pl-9" placeholder="you@example.com" autoComplete="email" value={signUpData.email} onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}/>
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                      <Input id="password" type={showPassword ? "text" : "password"} className="pl-9 pr-9" placeholder="••••••••" autoComplete="new-password" value={signUpData.password} onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}/>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10">
                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="pl-9 pr-9" placeholder="••••••••" autoComplete="new-password" value={signUpData.confirmPassword} onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}/>
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  
                  <div className="space-y-2">
                    <div className="flex flex-row items-start space-x-3">
                      <Checkbox id="acceptTerms" checked={signUpData.acceptTerms} onCheckedChange={(checked) => setSignUpData({ ...signUpData, acceptTerms: checked })}/>
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

                  
                  <Button type="submit" className="w-full h-11 text-base font-semibold">
                    Create Account
                  </Button>
                </form>) : (<form onSubmit={onLoginSubmit} className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="loginIdentifier">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                    <Input id="loginIdentifier" type="email" className="pl-9" placeholder="you@example.com" autoComplete="email" value={signInData.identifier} onChange={(e) => setSignInData({ ...signInData, identifier: e.target.value })}/>
                  </div>
                  {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
                </div>

                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                    <Input id="loginPassword" type={showPassword ? "text" : "password"} className="pl-9 pr-9" placeholder="••••••••" autoComplete="current-password" value={signInData.password} onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10">
                      {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                
                <div className="flex flex-row items-center space-x-3">
                  <Checkbox id="rememberMe" checked={signInData.rememberMe} onCheckedChange={(checked) => setSignInData({ ...signInData, rememberMe: checked })}/>
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>

                
                <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold">
                  Sign In
                </Button>
              </form>)}

            
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            
            <div className="relative flex w-full justify-center">
              {isGoogleLoading && (<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                <Loader2 className="h-5 w-5 animate-spin text-primary"/>
              </div>)}
              <div className="mx-auto flex w-full max-w-xs justify-center sm:max-w-sm">
                {typeof window !== "undefined" && window?.Capacitor?.isNativePlatform?.() ? (
                  <Button variant="outline" type="button" className="w-full h-12 sm:h-14 text-base font-semibold" onClick={handleNativeGoogleLogin} disabled={isGoogleLoading}>
                    {isGoogleLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />جاري التحميل...</>) : "تسجيل الدخول باستخدام Google"}
                  </Button>
                ) : (
                  <div ref={googleButtonRef} className="inline-block" />
                )}
              </div>
            </div>


            
            <div className="text-center text-xs sm:text-sm pt-4 border-t">
              <span className="text-muted-foreground">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button type="button" onClick={() => {
            setIsSignUp(!isSignUp);
            setErrors({});
            setShowPassword(false);
            setShowConfirmPassword(false);
        }} className="text-primary hover:underline font-semibold transition-colors">
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>

        
        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>);
}
