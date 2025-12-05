"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Home, LogOut, Star, Package } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useLanguage } from "@/lib/language"
import Link from "next/link"

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout, user } = useAuth()
  const { language } = useLanguage()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  useEffect(() => {
    const orderNum = searchParams.get("order")
    if (orderNum) {
      setOrderNumber(orderNum)
    } else {
      // If no order number, redirect to home after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    }
  }, [searchParams, router])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const isArabic = language === "ar"

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-12 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl">
          <CardContent className="p-6 md:p-8">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-5"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-green-500 relative z-10" />
              </div>
            </motion.div>

            {/* Main Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                {isArabic ? "تم!" : "Success!"}
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-1.5">
                {isArabic 
                  ? "طلبك قيد التجهيز" 
                  : "Your order is being processed"}
              </p>
              <p className="text-base md:text-lg text-gray-400">
                {isArabic 
                  ? "شكراً لاختيارك متجرنا" 
                  : "Thank you for choosing our store"}
              </p>
              {orderNumber && (
                <div className="mt-5 inline-block">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 shadow-lg">
                    <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                      {isArabic ? "رقم الطلب" : "Order Number"}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-white font-mono">
                      {orderNumber}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              {/* Leave Review Button */}
              <Button
                asChild
                className="w-full bg-white text-black hover:bg-gray-200 rounded-full h-12 text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Link href={orderNumber ? `/review?order=${orderNumber}` : "/review"}>
                  <Star className="mr-2 h-4 w-4" />
                  {isArabic ? "اترك رأيك" : "Leave a Review"}
                </Link>
              </Button>

              {/* Back to Home Button */}
              <Button
                asChild
                variant="outline"
                className="w-full border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white rounded-full h-12 text-base font-semibold transition-all duration-300 hover:scale-105"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {isArabic ? "العودة للموقع" : "Back to Home"}
                </Link>
              </Button>

              {/* View Orders Button */}
              <Button
                asChild
                variant="outline"
                className="w-full border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white rounded-full h-12 text-base font-semibold transition-all duration-300 hover:scale-105"
              >
                <Link href="/profile">
                  <Package className="mr-2 h-4 w-4" />
                  {isArabic ? "عرض طلباتي" : "View My Orders"}
                </Link>
              </Button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-white/5 rounded-full h-10 text-sm transition-all duration-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isArabic ? "تسجيل الخروج" : "Logout"}
              </Button>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center"
            >
              <p className="text-xs md:text-sm text-gray-500">
                {isArabic 
                  ? "سيتم إرسال تأكيد الطلب إلى بريدك الإلكتروني قريباً" 
                  : "Order confirmation will be sent to your email shortly"}
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

