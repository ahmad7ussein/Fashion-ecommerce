"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, X, Send } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useLanguage } from "@/lib/language"
import { useToast } from "@/hooks/use-toast"
import { reviewsApi } from "@/lib/api/reviews"
import Link from "next/link"

function ReviewFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { language } = useLanguage()
  const { toast } = useToast()
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orderNumber = searchParams.get("order")

  const isArabic = language === "ar"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: isArabic ? "يجب تسجيل الدخول" : "Login Required",
        description: isArabic ? "يجب تسجيل الدخول لترك رأي" : "Please login to leave a review",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!title.trim() || !comment.trim()) {
      toast({
        title: isArabic ? "الحقول مطلوبة" : "Required Fields",
        description: isArabic ? "الرجاء ملء جميع الحقول" : "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await reviewsApi.createReview({
        rating,
        title: title.trim(),
        comment: comment.trim(),
      })

      toast({
        title: isArabic ? "شكراً لك!" : "Thank You!",
        description: isArabic 
          ? "تم إرسال رأيك بنجاح. سيتم مراجعته من قبل الإدارة قبل النشر."
          : "Your review has been submitted. It will be reviewed by admin before publishing.",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: error.message || (isArabic ? "فشل إرسال الرأي" : "Failed to submit review"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-12 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl md:text-3xl font-bold text-white">
                {isArabic ? "اترك رأيك" : "Leave a Review"}
              </CardTitle>
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            {orderNumber && (
              <p className="text-sm text-gray-400 mt-2">
                {isArabic ? "رقم الطلب:" : "Order:"} {orderNumber}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <Label className="text-white mb-3 block">
                  {isArabic ? "التقييم" : "Rating"}
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-all duration-200 hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {rating} {isArabic ? "نجمة" : "star"}{rating > 1 ? "s" : ""}
                </p>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-white mb-2 block">
                  {isArabic ? "عنوان الرأي" : "Review Title"}
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isArabic ? "اكتب عنواناً لرأيك" : "Enter a title for your review"}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor="comment" className="text-white mb-2 block">
                  {isArabic ? "رأيك" : "Your Review"}
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isArabic ? "شاركنا تجربتك مع منتجاتنا..." : "Share your experience with our products..."}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 min-h-[150px] resize-none"
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{comment.length}/1000</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !comment.trim()}
                className="w-full bg-white text-black hover:bg-gray-200 rounded-full font-semibold h-12 text-base transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    {isArabic ? "جاري الإرسال..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {isArabic ? "إرسال الرأي" : "Submit Review"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <ReviewFormContent />
    </Suspense>
  )
}

