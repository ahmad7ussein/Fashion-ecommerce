"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import logger from "@/lib/logger";
function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();
    useEffect(() => {
        const tokenParam = searchParams.get("token");
        const emailParam = searchParams.get("email");
        if (tokenParam)
            setToken(tokenParam);
        if (emailParam)
            setEmail(decodeURIComponent(emailParam));
    }, [searchParams]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            toast({
                title: "Missing reset token",
                description: "This reset link is missing a token. Please use the link from your email.",
                variant: "destructive",
            });
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters.",
                variant: "destructive",
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords do not match",
                description: "Make sure both password fields are the same.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        logger.log("Resetting password for:", email);
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password. Please try again.");
            }
            logger.log("Password reset successful");
            setIsSuccess(true);
            toast({
                title: "Password reset successful",
                description: "Your password has been updated. Redirecting to login...",
            });
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        }
        catch (error) {
            logger.error("Password reset error:", error);
            let errorMessage = error?.message || "Something went wrong while resetting your password.";
            if (errorMessage.includes("Invalid or expired")) {
                errorMessage = "This reset link is invalid or expired. Please request a new one.";
            }
            else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
                errorMessage = "Network error. Please check your connection and try again.";
            }
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    if (isSuccess) {
        return (<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-2">
            <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6 text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary"/>
              </div>
              <CardTitle className="text-xl sm:text-2xl">Password reset successful</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your password has been updated. You can now sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <Link href="/login">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4"/>
                  Back to login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <Link href="/" className="inline-block mb-3 sm:mb-4 transition-transform hover:scale-105">
            <Logo className="mx-auto scale-90 sm:scale-100"/>
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              Enter a new password for your account.
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl">Set a new password</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {email && `Resetting password for: ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                  <Input id="newPassword" type={showPassword ? "text" : "password"} className="pl-9 pr-9" placeholder="********" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isLoading} required minLength={6}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10">
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="pl-9 pr-9" placeholder="********" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} required minLength={6}/>
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Resetting...
                  </>) : (<>
                    <Lock className="mr-2 h-4 w-4"/>
                    Reset password
                  </>)}
              </Button>
            </form>

            <div className="text-center text-xs sm:text-sm pt-4 border-t">
              <Link href="/login" className="text-primary hover:underline font-semibold transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3"/>
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            Return to home
          </Link>
        </div>
      </div>
    </div>);
}

export default function ResetPasswordPage() {
    return (<Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"/>}>
      <ResetPasswordContent />
    </Suspense>);
}
