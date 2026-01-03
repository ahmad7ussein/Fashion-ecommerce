"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import logger from "@/lib/logger"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Email مطلوب",
        description: "الرجاء إدخال عنوان البريد الإلكتروني",
        variant: "destructive",
      })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "بريد إلكتروني غير صحيح",
        description: "الرجاء إدخال عنوان بريد إلكتروني صحيح",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    logger.log("🚀 Requesting password reset for:", email)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      
      const requestBody: any = { email }

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "فشل إرسال طلب إعادة تعيين كلمة المرور")
      }

      logger.log("✅ Password reset request successful")
      setIsSuccess(true)
      
      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور على بريدك الإلكتروني",
      })
    } catch (error: any) {
      logger.error("❌ Password reset error:", error)
      
      let errorMessage = error?.message || "حدث خطأ أثناء إرسال الطلب"
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
        errorMessage = "لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم"
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-2">
            <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6 text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">تم إرسال الطلب بنجاح</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  تحقق من صندوق الوارد الخاص بك على <strong className="text-foreground">{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  إذا لم تجد الرسالة، تحقق من مجلد الرسائل غير المرغوب فيها (Spam)
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  إرسال طلب آخر
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    العودة إلى تسجيل الدخول
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        { }
        <div className="text-center mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <Link href="/" className="inline-block mb-3 sm:mb-4 transition-transform hover:scale-105">
            <Logo className="mx-auto scale-90 sm:scale-100" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              نسيت كلمة المرور؟
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
            </p>
          </div>
        </div>

        { }
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl">إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              أدخل عنوان بريدك الإلكتروني المسجل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              { }
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني المسجل</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  البريد الإلكتروني المرتبط بحسابك في الموقع
                </p>
              </div>

              { }
              <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    إرسال رابط إعادة التعيين
                  </>
                )}
              </Button>
            </form>

            { }
            <div className="text-center text-xs sm:text-sm pt-4 border-t">
              <Link href="/login" className="text-primary hover:underline font-semibold transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </CardContent>
        </Card>

        { }
        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}






