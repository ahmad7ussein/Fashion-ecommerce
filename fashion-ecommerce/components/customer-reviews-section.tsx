"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
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
      <section className="py-24 bg-gradient-to-b from-gray-950 to-black">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        </div>
      </section>
    )
  }

  if (reviews.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-gradient-to-b from-gray-950 to-black">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-white">
            {isArabic ? "آراء عملائنا" : "What Our Customers Say"}
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            {isArabic
              ? "اكتشف ما يقوله عملاؤنا عن تجربتهم معنا"
              : "Discover what our customers are saying about their experience"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => {
            const userName = review.user
              ? `${review.user.firstName} ${review.user.lastName}`
              : "Anonymous"
            
            return (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 h-full flex flex-col rounded-2xl">
                  <CardContent className="p-6 flex flex-col flex-1">
                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">
                      {review.title}
                    </h3>

                    {/* Comment */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-4 flex-1 line-clamp-4">
                      {review.comment}
                    </p>

                    {/* User Info */}
                    <div className="mt-auto pt-4 border-t border-white/10">
                      <p className="text-sm font-semibold text-white">{userName}</p>
                      {review.adminResponse && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          {isArabic ? "رد الإدارة:" : "Admin Response:"} {review.adminResponse}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

