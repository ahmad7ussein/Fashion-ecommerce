"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import logger from "@/lib/logger";
import { API_BASE_URL } from "@/lib/api";
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast({
                title: "Email required",
                description: "Please enter your email address to reset your password.",
                variant: "destructive",
            });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast({
                title: "Invalid email address",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        logger.log("Requesting password reset for:", email);
        try {
            const response = await fetch(`${API_BASE_URL()}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to request password reset. Please try again.");
            }
            logger.log("Password reset request successful");
            setIsSuccess(true);
            toast({
                title: "Reset link sent",
                description: "Check your inbox for a reset link. It may take a few minutes to arrive.",
            });
        }
        catch (error) {
            logger.error("Password reset error:", error);
            let errorMessage = error?.message || "Something went wrong while requesting a password reset.";
            if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
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
        return (<div className="min-h-[100svh] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-2">
            <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6 text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary"/>
              </div>
              <CardTitle className="text-xl sm:text-2xl">Reset link sent</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                If an account exists for this email, we sent a secure reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  We sent a reset link to <strong className="text-foreground">{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  If you do not see it, check your spam folder or request another link.
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => {
                setIsSuccess(false);
                setEmail("");
            }} variant="outline" className="w-full">
                  Send another link
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>);
    }
    return (<div className="min-h-[100svh] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <Link href="/" className="inline-block mb-3 sm:mb-4 transition-transform hover:scale-105">
            <Logo className="mx-auto h-16 sm:h-20"/>
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Forgot your password?</h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              Enter your email and we will send you a secure reset link.
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl">Reset your password</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter the email address associated with your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"/>
                  <Input id="email" type="email" className="pl-9" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required/>
                </div>
                <p className="text-xs text-muted-foreground">
                  We will send a reset link to this email address.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Sending reset link...
                  </>) : (<>
                    <Mail className="mr-2 h-4 w-4"/>
                    Send reset link
                  </>)}
              </Button>
            </form>

            <div className="text-center text-xs sm:text-sm pt-4 border-t">
              <Link href="/login" className="text-primary hover:underline font-semibold transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3"/>
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            Back to home
          </Link>
        </div>
      </div>
    </div>);
}
