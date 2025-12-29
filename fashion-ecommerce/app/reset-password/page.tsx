"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import logger from "@/lib/logger"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    const emailParam = searchParams.get("email")

    if (tokenParam) setToken(tokenParam)
    if (emailParam) setEmail(decodeURIComponent(emailParam))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        title: "رابط غير صحيح",
        description: "الرجاء استخدام الرابط المرسل إلى بريدك الإلكتروني",
        variant: "destructive",
      })
      return
    }

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "كلمة مرور غير صحيحة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "تأكد من تطابق كلمة المرور الجديدة مع تأكيدها",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    logger.log("🚀 Resetting password for:", email)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "فشل إعادة تعيين كلمة المرور")
      }

      logger.log("✅ Password reset successful")
      setIsSuccess(true)
      
      toast({
        title: "تم إعادة تعيين كلمة المرور بنجاح",
        description: "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة",
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      logger.error("❌ Password reset error:", error)
      
      let errorMessage = error?.message || "حدث خطأ أثناء إعادة تعيين كلمة المرور"
      
      if (errorMessage.includes("Invalid or expired")) {
        errorMessage = "الرابط غير صحيح أو منتهي الصلاحية. يرجى طلب رابط جديد"
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network")) {
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
              <CardTitle className="text-xl sm:text-2xl">تم إعادة تعيين كلمة المرور بنجاح</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                تم تغيير كلمة المرور بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <Link href="/login">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  الانتقال إلى تسجيل الدخول
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              أدخل كلمة المرور الجديدة
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl">كلمة المرور الجديدة</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {email && `للبريد الإلكتروني: ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    className="pl-9 pr-9"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={6}
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
                  يجب أن تكون كلمة المرور 6 أحرف على الأقل
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-9 pr-9"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11 sm:h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    إعادة تعيين كلمة المرور
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center text-xs sm:text-sm pt-4 border-t">
              <Link href="/login" className="text-primary hover:underline font-semibold transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            ← العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}






