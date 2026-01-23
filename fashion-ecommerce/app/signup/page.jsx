"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL, getApiUrl } from "@/lib/api";
export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const { toast } = useToast();
    const { register } = useAuth();
    const validateForm = () => {
        const newErrors = {};
        if (!formData.firstName.trim())
            newErrors.firstName = "First name is required";
        else if (formData.firstName.length < 2)
            newErrors.firstName = "First name must be at least 2 characters";
        if (!formData.lastName.trim())
            newErrors.lastName = "Last name is required";
        else if (formData.lastName.length < 2)
            newErrors.lastName = "Last name must be at least 2 characters";
        if (!formData.email.trim())
            newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            newErrors.email = "Please enter a valid email";
        if (!formData.password)
            newErrors.password = "Password is required";
        else if (formData.password.length < 8)
            newErrors.password = "Password must be at least 8 characters";
        else if (!/[A-Z]/.test(formData.password))
            newErrors.password = "Password must contain uppercase letter";
        else if (!/[a-z]/.test(formData.password))
            newErrors.password = "Password must contain lowercase letter";
        else if (!/[0-9]/.test(formData.password))
            newErrors.password = "Password must contain a number";
        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords don't match";
        if (!formData.acceptTerms)
            newErrors.acceptTerms = "You must accept the terms and conditions";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
            });
            toast({
                title: "Account created! ✨",
                description: `Welcome, ${formData.firstName}! Your account has been created successfully.`,
            });
            setTimeout(() => {
                router.push("/profile");
            }, 1000);
        }
        catch (error) {
            console.error("Registration error:", error);
            let errorMessage = "Registration failed. Please try again.";
            if (error?.message) {
                errorMessage = error.message;
            }
            else if (typeof error === "string") {
                errorMessage = error;
            }
            if (errorMessage.includes("Cannot connect to the server") || errorMessage.includes("Failed to fetch")) {
                errorMessage = `Cannot connect to the server. Please make sure the backend server is running on ${API_BASE_URL().replace("/api", "")}`;
            }
            toast({
                title: "Registration failed",
                description: errorMessage,
                variant: "destructive",
                duration: 5000,
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
        if (errors[e.target.id]) {
            setErrors({ ...errors, [e.target.id]: "" });
        }
    };
    const exchangeGoogleToken = async (idToken) => {
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
            toast({
                title: "جاري إنشاء الحساب...",
                description: "يرجى الانتظار",
            });
            const backendResponse = await fetch(getApiUrl("/auth/google"), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    idToken,
                }),
            });
            const data = await backendResponse.json();
            if (!backendResponse.ok || !data.success) {
                throw new Error(data.message || 'Google login failed');
            }
            if (data.data.token) {
                localStorage.setItem('auth_token', data.data.token);
            }
            toast({
                title: "تم إنشاء الحساب بنجاح! ✨",
                description: `مرحباً ${data.data.user.firstName}!`,
            });
            const role = String(data.data.user.role || "").toLowerCase().trim();
            const redirectUrl = role === "admin"
                ? "/admin"
                : role === "employee"
                    ? "/employee"
                    : "/profile";
            router.replace(redirectUrl);
        }
        catch (error) {
            console.error("❌ Google login error:", error);
            toast({
                title: "فشل التسجيل",
                description: error.message || "حدث خطأ أثناء التسجيل باستخدام Google",
                variant: "destructive",
            });
        }
        finally {
            setIsGoogleLoading(false);
        }
    };
    const handleNativeGoogleLogin = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
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
            console.error("❌ Google native login error:", error);
            toast({
                title: "فشل التسجيل",
                description: error.message || "حدث خطأ أثناء التسجيل باستخدام Google",
                variant: "destructive",
            });
        }
    };
    const handleGoogleLogin = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (isGoogleLoading) {
            return;
        }
        if (typeof window !== "undefined" && window?.Capacitor?.isNativePlatform?.()) {
            await handleNativeGoogleLogin(e);
            return;
        }
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
            toast({
                title: "معلومات Origin",
                description: `Origin الحالي: ${currentOrigin}. تأكد من إضافة هذا بالضبط في Google Cloud Console → Authorized JavaScript origins`,
                variant: "default",
                duration: 8000,
            });
        }
        setIsGoogleLoading(true);
        try {
            if (typeof window === 'undefined') {
                setIsGoogleLoading(false);
                return;
            }
            if (!window.google) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
                let attempts = 0;
                while (!window.google && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    attempts++;
                }
                if (!window.google) {
                    throw new Error('Google Identity Services failed to load. Please refresh the page and try again.');
                }
            }
            const handleGoogleCallback = async (response) => {
                await exchangeGoogleToken(response?.credential);
            };
            if (!window.google.accounts?.id?._clientId) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleCallback,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    itp_support: true,
                });
            }
            try {
                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed()) {
                        console.log("One Tap not displayed, using button");
                    }
                    else if (notification.isSkippedMoment()) {
                        console.log("One Tap skipped");
                    }
                    else if (notification.isDismissedMoment()) {
                        console.log("One Tap dismissed");
                    }
                });
            }
            catch (promptError) {
                console.warn("Google One Tap error:", promptError);
            }
        }
        catch (error) {
            console.error("❌ Google login initialization error:", error);
            toast({
                title: "خطأ في التهيئة",
                description: error.message || "حدث خطأ أثناء تهيئة التسجيل باستخدام Google. تأكد من إعداد Google Client ID.",
                variant: "destructive",
            });
            setIsGoogleLoading(false);
        }
    };
    return (<div className="min-h-[100svh] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8 space-y-5">
          <Link href="/" className="inline-flex items-center justify-center mb-4 transition-transform hover:scale-105">
            <span className="inline-flex items-center justify-center rounded-full bg-white/85 ring-1 ring-rose-200/70 px-5 py-3 shadow-lg">
              <Logo className="h-16 w-auto sm:h-20 md:h-24"/>
            </span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground">Join us today and start designing your custom apparel</p>
          </div>
        </div>

        
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>Enter your information to create an account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                    <Input id="firstName" type="text" className="pl-9" placeholder="John" autoComplete="given-name" value={formData.firstName} onChange={handleChange}/>
                  </div>
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                    <Input id="lastName" type="text" className="pl-9" placeholder="Doe" autoComplete="family-name" value={formData.lastName} onChange={handleChange}/>
                  </div>
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                </div>
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                  <Input id="email" type="text" className="pl-9" placeholder="you@example.com" autoComplete="email" value={formData.email} onChange={handleChange}/>
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                  <Input id="password" type={showPassword ? "text" : "password"} className="pl-9 pr-9" placeholder="••••••••" autoComplete="new-password" value={formData.password} onChange={handleChange}/>
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
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="pl-9 pr-9" placeholder="••••••••" autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange}/>
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              
              <div className="space-y-2">
                <div className="flex flex-row items-start space-x-3">
                  <Checkbox id="acceptTerms" checked={formData.acceptTerms} onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked })}/>
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

              
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Creating Account...
                  </>) : (<>
                    Create Account
                  </>)}
              </Button>
            </form>

            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            
            <Button variant="outline" type="button" className="w-full h-12 sm:h-14 text-base font-semibold relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50" onClick={(e) => handleGoogleLogin(e)} onMouseDown={(e) => e.preventDefault()} disabled={isGoogleLoading}>
              {isGoogleLoading && (<div className="absolute inset-0 bg-primary/10 animate-pulse"/>)}
              <div className="relative flex items-center justify-center gap-3">
                {isGoogleLoading ? (<>
                    <Loader2 className="h-5 w-5 animate-spin text-primary"/>
                    <span>جاري التحميل...</span>
                  </>) : (<>
                    <svg className="h-6 w-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="font-medium">التسجيل باستخدام Google</span>
                  </>)}
              </div>
            </Button>

            
            <div className="text-center text-sm pt-4 border-t">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>);
}
