"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Tag } from "lucide-react"
import { useCart } from "@/lib/cart"
import { useRegion } from "@/lib/region"
import { CartSkeleton } from "@/components/skeletons"

export default function CartPage() {
  const { items: cartItems, updateQuantity, removeItem, subtotal } = useCart()
  const { formatPrice, convertPrice } = useRegion()
  const [promoCode, setPromoCode] = useState("")
  const shipping = subtotal > 100 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 py-6 sm:py-8 md:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 md:mb-12 text-gray-900"
        >
          Shopping <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">Cart</span>
        </motion.h1>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white backdrop-blur-sm border-2 border-rose-100 rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-20 text-center shadow-xl"
          >
            <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto mb-4 sm:mb-6 text-rose-400" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3 text-gray-900">Your cart is empty</h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">Add some items to get started</p>
            <Link href="/products">
              <Button className="h-11 sm:h-12 px-6 sm:px-8 bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full text-sm sm:text-base font-medium shadow-lg">
                Continue Shopping
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id || item._id || `cart-item-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
                    transition={{ delay: index * 0.1 }}
                    layout
                  >
                  <Card className="bg-white backdrop-blur-sm border-2 border-rose-100 hover:bg-white hover:border-rose-300 hover:shadow-xl transition-all rounded-xl sm:rounded-2xl overflow-hidden">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="w-full sm:w-24 md:w-32 h-48 sm:h-24 md:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 flex-shrink-0 relative">
                          <Image
                            src={item.image || "/placeholder-logo.png"}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 128px"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg md:text-xl text-gray-900 mb-1 sm:mb-2 line-clamp-2">{item.name}</h3>
                              {item.isCustom && (
                                <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-xs bg-rose-100 text-rose-700 rounded-full">
                                  Custom Design
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </div>

                          <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            <p>
                              Size: {item.size} • Color: {item.color}
                            </p>
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-white border-2 border-gray-200 hover:bg-rose-50 hover:border-rose-300 rounded-full"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
                              </Button>
                              <span className="font-medium w-8 sm:w-10 text-center text-gray-900 text-sm sm:text-base md:text-lg">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-white border-2 border-gray-200 hover:bg-rose-50 hover:border-rose-300 rounded-full"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
                              </Button>
                            </div>

                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-rose-600">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="sticky top-20 sm:top-24 md:top-28 bg-white backdrop-blur-sm border-2 border-rose-100 rounded-xl sm:rounded-2xl shadow-xl">
                  <CardContent className="p-5 sm:p-6 md:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Order Summary</h2>

                    <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                      </div>

                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-gray-900">{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                      </div>

                      {shipping > 0 && <p className="text-xs sm:text-sm text-gray-500">Free shipping on orders over {formatPrice(100)}</p>}

                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
                      </div>

                      <div className="border-t border-rose-200 pt-4 sm:pt-5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base sm:text-lg text-gray-900">Total</span>
                          <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      <div className="flex gap-2 sm:gap-3">
                        <Input
                          placeholder="Promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-rose-300 text-sm sm:text-base h-10 sm:h-11"
                        />
                        <Button variant="outline" className="bg-white border-2 border-gray-200 hover:bg-rose-50 hover:border-rose-300 h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0">
                          <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                        </Button>
                      </div>
                    </div>

                    <Link href="/checkout">
                      <Button className="w-full h-12 sm:h-14 bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full text-sm sm:text-base font-medium mb-3 sm:mb-4 shadow-lg">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>

                    <Link href="/products">
                      <Button variant="ghost" className="w-full h-11 sm:h-12 text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-full text-sm sm:text-base">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
