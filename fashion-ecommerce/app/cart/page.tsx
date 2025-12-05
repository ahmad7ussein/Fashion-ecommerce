"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Tag } from "lucide-react"
import { useCart } from "@/lib/cart"
import { useRegion } from "@/lib/region"

export default function CartPage() {
  const { items: cartItems, updateQuantity, removeItem, subtotal } = useCart()
  const { formatPrice, convertPrice } = useRegion()
  const [promoCode, setPromoCode] = useState("")
  const shipping = subtotal > 100 ? 0 : 9.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 py-6 sm:py-8 md:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 md:mb-12 text-white"
        >
          Shopping Cart
        </motion.h1>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-20 text-center"
          >
            <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto mb-4 sm:mb-6 text-gray-400" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3 text-white">Your cart is empty</h2>
            <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">Add some items to get started</p>
            <Link href="/products">
              <Button className="h-11 sm:h-12 px-6 sm:px-8 bg-white text-black hover:bg-gray-200 rounded-full text-sm sm:text-base font-medium">
                Continue Shopping
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl sm:rounded-2xl overflow-hidden">
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="w-full sm:w-24 md:w-32 h-48 sm:h-24 md:h-32 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 128px"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg md:text-xl text-white mb-1 sm:mb-2 line-clamp-2">{item.name}</h3>
                              {item.isCustom && (
                                <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-xs bg-white/10 text-white rounded-full">
                                  Custom Design
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </div>

                          <div className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                            <p>
                              Size: {item.size} • Color: {item.color}
                            </p>
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 rounded-full"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                              </Button>
                              <span className="font-medium w-8 sm:w-10 text-center text-white text-sm sm:text-base md:text-lg">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 rounded-full"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                              </Button>
                            </div>

                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="sticky top-20 sm:top-24 md:top-28 bg-white/5 backdrop-blur-sm border-white/10 rounded-xl sm:rounded-2xl">
                  <CardContent className="p-5 sm:p-6 md:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white">Order Summary</h2>

                    <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="font-medium text-white">{formatPrice(subtotal)}</span>
                      </div>

                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-400">Shipping</span>
                        <span className="font-medium text-white">{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                      </div>

                      {shipping > 0 && <p className="text-xs sm:text-sm text-gray-500">Free shipping on orders over {formatPrice(100)}</p>}

                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-400">Tax</span>
                        <span className="font-medium text-white">{formatPrice(tax)}</span>
                      </div>

                      <div className="border-t border-white/10 pt-4 sm:pt-5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base sm:text-lg text-white">Total</span>
                          <span className="text-2xl sm:text-3xl font-bold text-white">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                      <div className="flex gap-2 sm:gap-3">
                        <Input
                          placeholder="Promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-white/20 text-sm sm:text-base h-10 sm:h-11"
                        />
                        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0">
                          <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </Button>
                      </div>
                    </div>

                    <Link href="/checkout">
                      <Button className="w-full h-12 sm:h-14 bg-white text-black hover:bg-gray-200 rounded-full text-sm sm:text-base font-medium mb-3 sm:mb-4">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>

                    <Link href="/products">
                      <Button variant="ghost" className="w-full h-11 sm:h-12 text-white hover:bg-white/10 rounded-full text-sm sm:text-base">
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
