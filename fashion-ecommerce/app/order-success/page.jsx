"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLoader } from "@/components/ui/app-loader";
import { CheckCircle2, Home, LogOut, Star, Package } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import Link from "next/link";
function OrderSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { logout, user } = useAuth();
    const { language } = useLanguage();
    const [orderNumber, setOrderNumber] = useState(null);
    useEffect(() => {
        const orderNum = searchParams.get("order");
        if (orderNum) {
            setOrderNumber(orderNum);
        }
        else {
            setTimeout(() => {
                router.push("/");
            }, 3000);
        }
    }, [searchParams, router]);
    const handleLogout = async () => {
        await logout();
        router.push("/");
    };
    const isArabic = language === "ar";
    return (<div className="min-h-[100svh] bg-white pt-24 pb-12 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
        <Card className="bg-white border border-gray-200 shadow-xl rounded-3xl">
          <CardContent className="p-6 md:p-8">
            
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"/>
                <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-green-500 relative z-10"/>
              </div>
            </motion.div>

            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                {isArabic ? "تم!" : "Success!"}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-1.5">
                {isArabic
            ? "طلبك قيد التجهيز"
            : "Your order is being processed"}
              </p>
              <p className="text-base md:text-lg text-gray-500">
                {isArabic
            ? "شكراً لاختيارك متجرنا"
            : "Thank you for choosing our store"}
              </p>
              {orderNumber && (<div className="mt-5 inline-block">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                      {isArabic ? "رقم الطلب" : "Order Number"}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 font-mono">
                      {orderNumber}
                    </p>
                  </div>
                </div>)}
            </motion.div>

            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
              
              <Button asChild className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-full h-12 text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                <Link href={orderNumber ? `/review?order=${orderNumber}` : "/review"}>
                  <Star className="mr-2 h-4 w-4"/>
                  {isArabic ? "اترك رأيك" : "Leave a Review"}
                </Link>
              </Button>

              
              <Button asChild variant="outline" className="w-full border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-full h-12 text-base font-semibold transition-all duration-300 hover:scale-105">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4"/>
                  {isArabic ? "العودة للموقع" : "Back to Home"}
                </Link>
              </Button>

              
              <Button asChild variant="outline" className="w-full border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-full h-12 text-base font-semibold transition-all duration-300 hover:scale-105">
                <Link href="/profile">
                  <Package className="mr-2 h-4 w-4"/>
                  {isArabic ? "عرض طلباتي" : "View My Orders"}
                </Link>
              </Button>

              
              <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full h-10 text-sm transition-all duration-300">
                <LogOut className="mr-2 h-4 w-4"/>
                {isArabic ? "تسجيل الخروج" : "Logout"}
              </Button>
            </motion.div>

            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 text-center">
              <p className="text-xs md:text-sm text-gray-500">
                {isArabic
            ? "سيتم إرسال تأكيد الطلب إلى بريدك الإلكتروني قريباً"
            : "Order confirmation will be sent to your email shortly"}
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>);
}
export default function OrderSuccessPage() {
    return (<Suspense fallback={<div className="min-h-[100svh] bg-white pt-24 flex items-center justify-center">
        <AppLoader label="Loading..." size="lg"/>
      </div>}>
      <OrderSuccessContent />
    </Suspense>);
}
