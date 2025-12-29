"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, Quote, Heart } from "lucide-react"
import { reviewsApi, Review } from "@/lib/api/reviews"
import { useLanguage } from "@/lib/language"

export function CustomerReviewsSection() {
  const { language } = useLanguage()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await reviewsApi.getApprovedReviews({ limit: 6 })
        setReviews(response.data)
      } catch (error) {
        console.error("Error loading reviews:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadReviews()
  }, [])

  const isArabic = language === "ar"

  if (isLoading) {
    return (
      <section className="py-24 bg-gradient-to-b from-white to-rose-50/30">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          </div>
        </div>
      </section>
    )
  }

  if (reviews.length === 0) {
    return null
  }

  return (
    <section className="py-20 sm:py-24 md:py-32 bg-gradient-to-b from-white via-rose-50/30 to-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 md:mb-20"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              <span className="text-sm font-semibold text-rose-600 uppercase tracking-wider">
                {isArabic ? "شهادات العملاء" : "Testimonials"}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 tracking-tight text-gray-900">
              {isArabic ? "آراء عملائنا" : "What Our"}
              <br />
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                {isArabic ? "الرائعون" : "Customers Say"}
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {isArabic
                ? "اكتشف ما يقوله عملاؤنا عن تجربتهم المميزة معنا"
                : "Discover what our customers are saying about their experience"}
            </p>
          </motion.div>

          {/* Reviews Grid - New Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {reviews.map((review, index) => {
              const userName = review.user
                ? `${review.user.firstName} ${review.user.lastName}`
                : "Anonymous"
              
              // Alternate card styles for visual variety
              const isLarge = index === 0 || index === reviews.length - 1
              const cardVariants = [
                "bg-gradient-to-br from-white to-rose-50/50",
                "bg-gradient-to-br from-white to-pink-50/50",
                "bg-gradient-to-br from-white via-rose-50/30 to-white",
              ]
              
              return (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  whileHover={{ 
                    y: -12, 
                    scale: 1.02,
                    transition: { duration: 0.3 }
                  }}
                  className={`${isLarge && index === 0 ? "md:col-span-2 lg:col-span-1" : ""} ${isLarge && index === reviews.length - 1 ? "md:col-span-2 lg:col-span-1 lg:col-start-2" : ""}`}
                >
                  <div className={`relative h-full ${cardVariants[index % cardVariants.length]} rounded-3xl p-6 sm:p-8 border-2 border-rose-100/50 hover:border-rose-300 hover:shadow-2xl transition-all duration-300 group`}>
                    {/* Quote Icon */}
                    <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Quote className="h-16 w-16 text-rose-500" />
                    </div>

                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-4 relative z-10">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 transition-all ${
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400 scale-100"
                              : "text-gray-300 scale-90"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Review Title */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 relative z-10 line-clamp-2 group-hover:text-rose-600 transition-colors">
                      {review.title}
                    </h3>

                    {/* Review Comment */}
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 relative z-10 line-clamp-5">
                      "{review.comment}"
                    </p>

                    {/* User Info Section */}
                    <div className="mt-auto pt-6 border-t border-rose-200/50 relative z-10">
                      <div className="flex items-center gap-4">
                        {/* Avatar Circle */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{userName}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {isArabic ? "عميل موثوق" : "Verified Customer"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {review.adminResponse && (
                        <div className="mt-4 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                          <p className="text-xs font-semibold text-rose-700 mb-1">
                            {isArabic ? "رد الإدارة:" : "Admin Response:"}
                          </p>
                          <p className="text-xs text-gray-600 italic">
                            {review.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Decorative Corner Element */}
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-200/20 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12 md:mt-16"
          >
            <p className="text-sm text-gray-500 mb-2">
              {isArabic 
                ? "انضم إلى آلاف العملاء الراضين" 
                : "Join thousands of satisfied customers"}
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-5 w-5 fill-amber-400 text-amber-400"
                />
              ))}
              <span className="ml-2 text-sm font-semibold text-gray-700">
                4.9/5 {isArabic ? "تقييم" : "Rating"}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

