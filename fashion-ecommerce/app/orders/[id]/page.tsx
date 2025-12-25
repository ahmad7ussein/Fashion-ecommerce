"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Package, MapPin, Clock, CheckCircle, Truck, XCircle, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ordersApi, type Order } from "@/lib/api/orders"
import { useAuth } from "@/lib/auth"
import { useLanguage } from "@/lib/language"
import { useRegion } from "@/lib/region"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"

const statusConfig: Record<string, { label: { en: string; ar: string }; icon: any; color: string }> = {
  pending: {
    label: { en: "Pending", ar: "قيد الانتظار" },
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  processing: {
    label: { en: "Processing", ar: "قيد المعالجة" },
    icon: Package,
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  shipped: {
    label: { en: "Shipped", ar: "تم الشحن" },
    icon: Truck,
    color: "bg-cyan-100 text-cyan-800 border-cyan-300",
  },
  delivered: {
    label: { en: "Delivered", ar: "تم التسليم" },
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-300",
  },
  cancelled: {
    label: { en: "Cancelled", ar: "ملغي" },
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-300",
  },
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const { formatPrice } = useRegion()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const loadOrder = async () => {
      try {
        setIsLoading(true)
        const orderData = await ordersApi.getOrder(orderId)
        // Check if order belongs to current user
        if (typeof orderData.user === "object" && user?.id && orderData.user._id !== user.id) {
          toast({
            title: language === "ar" ? "غير مصرح" : "Unauthorized",
            description: language === "ar" ? "ليس لديك صلاحية لعرض هذا الطلب" : "You don't have permission to view this order",
            variant: "destructive",
          })
          router.push("/profile")
          return
        }
        setOrder(orderData)
      } catch (error: any) {
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: error.message || (language === "ar" ? "فشل تحميل الطلب" : "Failed to load order"),
          variant: "destructive",
        })
        router.push("/profile")
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId && isAuthenticated) {
      loadOrder()
    }
  }, [orderId, isAuthenticated, user, router, language, toast])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24 flex items-center justify-center">
        <Card className="p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{language === "ar" ? "الطلب غير موجود" : "Order Not Found"}</h2>
          <Link href="/profile">
            <Button>{language === "ar" ? "العودة للملف الشخصي" : "Back to Profile"}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const statusInfo = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/profile">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "ar" ? "العودة" : "Back"}
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
                {language === "ar" ? "تتبع الطلب" : "Order Tracking"}
              </h1>
              <p className="text-gray-600">
                {language === "ar" ? "رقم الطلب" : "Order Number"}: <span className="font-semibold">{order.orderNumber}</span>
              </p>
            </div>
            <Badge className={`${statusInfo.color} border-2 px-4 py-2 text-lg`}>
              <StatusIcon className="h-5 w-5 mr-2" />
              {statusInfo.label[language]}
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Tracking Timeline */}
            <Card className="p-6 bg-white border-2 border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                {language === "ar" ? "سجل التتبع" : "Tracking History"}
              </h2>
              {order.trackingHistory && order.trackingHistory.length > 0 ? (
                <div className="space-y-4">
                  {order.trackingHistory.map((entry, index) => {
                    const entryStatus = statusConfig[entry.status] || statusConfig.pending
                    const EntryIcon = entryStatus.icon
                    return (
                      <div key={index} className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          <div className={`p-3 rounded-full ${entryStatus.color} border-2`}>
                            <EntryIcon className="h-5 w-5" />
                          </div>
                          {index < order.trackingHistory!.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{entryStatus.label[language]}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.updatedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                            </span>
                          </div>
                          {entry.location && (
                            <div className="flex items-center gap-2 mb-2 text-gray-700">
                              <MapPin className="h-4 w-4" />
                              <span>{entry.location}</span>
                            </div>
                          )}
                          {entry.note && (
                            <p className="text-gray-600 text-sm">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {language === "ar" ? "لا يوجد سجل تتبع بعد" : "No tracking history yet"}
                  </p>
                </div>
              )}
            </Card>

            {/* Order Items */}
            <Card className="p-6 bg-white border-2 border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                {language === "ar" ? "عناصر الطلب" : "Order Items"}
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 border-2 border-gray-200 rounded-lg">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.image || "/placeholder-logo.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>{language === "ar" ? "الحجم" : "Size"}: {item.size}</span>
                        <span>{language === "ar" ? "اللون" : "Color"}: {item.color}</span>
                        <span>{language === "ar" ? "الكمية" : "Quantity"}: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Tracking Info */}
            {order.trackingNumber && (
              <Card className="p-6 bg-white border-2 border-gray-200 shadow-lg">
                <h3 className="font-bold mb-4 text-gray-900">{language === "ar" ? "معلومات التتبع" : "Tracking Information"}</h3>
                <div className="space-y-3">
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{language === "ar" ? "رقم التتبع" : "Tracking Number"}</p>
                      <p className="font-mono font-semibold text-gray-900">{order.trackingNumber}</p>
                    </div>
                  )}
                  {order.carrier && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{language === "ar" ? "شركة الشحن" : "Carrier"}</p>
                      <p className="font-semibold text-gray-900">{order.carrier}</p>
                    </div>
                  )}
                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{language === "ar" ? "تاريخ التسليم المتوقع" : "Estimated Delivery"}</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(order.estimatedDelivery).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Shipping Address */}
            <Card className="p-6 bg-white border-2 border-gray-200 shadow-lg">
              <h3 className="font-bold mb-4 text-gray-900">{language === "ar" ? "عنوان الشحن" : "Shipping Address"}</h3>
              <div className="space-y-2 text-gray-700">
                <p className="font-semibold">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-2 border-t">{order.shippingAddress.phone}</p>
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="p-6 bg-white border-2 border-gray-200 shadow-lg">
              <h3 className="font-bold mb-4 text-gray-900">{language === "ar" ? "ملخص الطلب" : "Order Summary"}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{language === "ar" ? "الضريبة" : "Tax"}</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{language === "ar" ? "الشحن" : "Shipping"}</span>
                  <span>{formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t">
                  <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
