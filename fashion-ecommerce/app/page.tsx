"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Palette, TrendingUp, Camera, Video, ArrowRight, ChevronDown, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Logo } from "@/components/logo"
import {
  AnimatedFeatureCard,
  FadeInWhenVisible,
  SlideInFromLeft,
  SlideInFromRight,
  StaggerContainer,
  StaggerItem,
  AnimatedButton
} from "@/components/animated-card"
import { motion, AnimatePresence } from "framer-motion"
import { ProfessionalNavbar } from "@/components/professional-navbar"
import { CustomerReviewsSection } from "@/components/customer-reviews-section"
import { useRegion } from "@/lib/region"
import { useLanguage } from "@/lib/language"
import { listProducts, type Product } from "@/lib/api/products"
import { FeaturedProductsSkeleton } from "@/components/skeletons"

// Lazy load 3D background for better performance
const Background3DSimple = dynamic(
  () => import("@/components/3d-background").then((mod) => mod.Background3DSimple),
  { ssr: false }
)


const sliderImages = [
  {
    id: 1,
    image: "/white-t-shirt-model.png",
    title: "New Collection 2025",
    subtitle: "Discover the latest fashion trends",
    description: "Premium quality clothing that defines your style",
    buttonText: "Shop Now",
    buttonLink: "/products",
    bgGradient: "linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #ffe4e6 100%)",
    bgImage: "/white-t-shirt-model.png", // Background image for subtle blend
  },
  {
    id: 2,
    image: "/black-hoodie-streetwear.png",
    title: "Streetwear Essentials",
    subtitle: "Urban style meets comfort",
    description: "Express yourself with our premium streetwear collection",
    buttonText: "Explore Collection",
    buttonLink: "/products?category=Hoodies",
    bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #fef3c7 100%)",
    bgImage: "/black-hoodie-streetwear.png", // Background image for subtle blend
  },
  {
    id: 3,
    image: "/gray-sweatshirt-casual.jpg",
    title: "Casual Comfort",
    subtitle: "Everyday elegance",
    description: "Perfect blend of style and comfort for your daily wear",
    buttonText: "Shop Casual",
    buttonLink: "/products?category=Sweatshirts",
    bgGradient: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #dbeafe 100%)",
    bgImage: "/gray-sweatshirt-casual.jpg", // Background image for subtle blend
  },
  {
    id: 4,
    image: "/graphic-t-shirt-fashion.jpg",
    title: "Designer Collection",
    subtitle: "Unique designs for unique you",
    description: "Stand out with our exclusive designer pieces",
    buttonText: "View Collection",
    buttonLink: "/products?category=T-Shirts",
    bgGradient: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f3e8ff 100%)",
    bgImage: "/graphic-t-shirt-fashion.jpg", // Background image for subtle blend
  },
]

const virtualTryOnSlidesData = [
  {
    gradient: "from-rose-100 via-pink-100 to-amber-50",
    title: "معاينة مباشرة",
    description: "بث حي بدون انتظار مع محاذاة دقيقة للقطعة على صورتك قبل أي خطوة شراء.",
    chip: "بث مباشر",
    stats: [
      { label: "زمن الاستجابة", value: "0.9s" },
      { label: "دقة المحاذاة", value: "98%" },
    ],
  },
  {
    gradient: "from-amber-100 via-orange-100 to-rose-50",
    title: "تخصيص ذكي",
    description: "ذكاء اصطناعي يضبط الإضاءة والمقاس لتطابق مقاساتك الفعلية فوراً.",
    chip: "AI Fit",
    stats: [
      { label: "معاينات ناجحة", value: "4.2k+" },
      { label: "إعادة ضبط تلقائي", value: "كل 2.5s" },
    ],
  },
  {
    gradient: "from-pink-100 via-rose-50 to-white",
    title: "جاهزة للطلب",
    description: "تحقق من الألوان والمقاس بثقة قبل إضافة للسلة وإتمام الدفع.",
    chip: "جاهز للشراء",
    stats: [
      { label: "توافق المقاس", value: "99%" },
      { label: "وقت التهيئة", value: "5s" },
    ],
  },
]

export default function HomePage() {
  const { formatPrice } = useRegion()
  const { language } = useLanguage()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [virtualTryOnSlide, setVirtualTryOnSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [menProducts, setMenProducts] = useState<Product[]>([])
  const [womenProducts, setWomenProducts] = useState<Product[]>([])
  const [kidsProducts, setKidsProducts] = useState<Product[]>([])
  const [newCollectionProducts, setNewCollectionProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true)
  const [menSlideIndex, setMenSlideIndex] = useState(0)
  const [womenSlideIndex, setWomenSlideIndex] = useState(0)
  const [kidsSlideIndex, setKidsSlideIndex] = useState(0)
  const [newCollectionSlideIndex, setNewCollectionSlideIndex] = useState(0)
  const activeVirtualTryOnSlide = virtualTryOnSlidesData[virtualTryOnSlide] || virtualTryOnSlidesData[0]

  // Auto-slide effect for hero section
  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isPaused, sliderImages.length])

  // Auto-slide effect for Virtual Try-On section
  useEffect(() => {
    const interval = setInterval(() => {
      setVirtualTryOnSlide((prev) => (prev + 1) % virtualTryOnSlidesData.length)
    }, 6000) // Change slide every 6 seconds

    return () => clearInterval(interval)
  }, [])

  // Load products for sliders
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true)
      try {
        // Load products sequentially with smaller limits to avoid timeout
        const men = await listProducts({ gender: "Men", limit: 8 }).catch(() => [])
        setMenProducts(men.slice(0, 8))
        
        const women = await listProducts({ gender: "Women", limit: 8 }).catch(() => [])
        setWomenProducts(women.slice(0, 8))
        
        const kids = await listProducts({ gender: "Kids", limit: 8 }).catch(() => [])
        setKidsProducts(kids.slice(0, 8))
        
        const newCollection = await listProducts({ featured: true, sortBy: "newest", limit: 12 }).catch(() => [])
        setNewCollectionProducts(newCollection.slice(0, 12))
      } catch (error) {
        console.error("Error loading products:", error)
        // Set empty arrays on error to prevent UI issues
        setMenProducts([])
        setWomenProducts([])
        setKidsProducts([])
        setNewCollectionProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }
    loadProducts()
  }, [])

  // Load featured products separately
  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setIsLoadingFeatured(true)
      try {
        const featured = await listProducts({ featured: true, limit: 4 }).catch(() => [])
        setFeaturedProducts(featured.slice(0, 4))
      } catch (error) {
        console.error("Error loading featured products:", error)
        setFeaturedProducts([])
      } finally {
        setIsLoadingFeatured(false)
      }
    }
    loadFeaturedProducts()
  }, [])

  // Auto-slide for product sliders
  useEffect(() => {
    if (menProducts.length === 0 && womenProducts.length === 0 && kidsProducts.length === 0 && newCollectionProducts.length === 0) return
    
    const interval = setInterval(() => {
      if (menProducts.length > 4) {
        setMenSlideIndex((prev) => (prev + 1) % Math.max(1, menProducts.length - 3))
      }
      if (womenProducts.length > 4) {
        setWomenSlideIndex((prev) => (prev + 1) % Math.max(1, womenProducts.length - 3))
      }
      if (kidsProducts.length > 4) {
        setKidsSlideIndex((prev) => (prev + 1) % Math.max(1, kidsProducts.length - 3))
      }
      if (newCollectionProducts.length > 4) {
        setNewCollectionSlideIndex((prev) => (prev + 1) % Math.max(1, newCollectionProducts.length - 3))
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [menProducts.length, womenProducts.length, kidsProducts.length, newCollectionProducts.length])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white">
      {/* Professional Navbar */}
      <ProfessionalNavbar />

      {/* Hero Slider Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-20">
        {/* Slider Container */}
        <div 
          className="relative w-full h-screen"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center overflow-hidden"
              style={{ backgroundImage: sliderImages[currentSlide].bgGradient }}
            >
              {/* Subtle Background Clothing Images */}
              <div className="absolute inset-0 opacity-[0.45]">
                <div
                  className="absolute inset-0 bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${sliderImages[currentSlide].bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(15px) brightness(1.05)',
                    transform: 'scale(1.1)',
                  }}
                />
              </div>
              
              {/* Additional subtle clothing images for depth */}
              <div className="absolute inset-0 opacity-[0.3]">
                <div
                  className="absolute top-1/4 right-1/4 w-96 h-96 bg-center rounded-full"
                  style={{
                    backgroundImage: `url(${sliderImages[currentSlide].bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(24px)',
                  }}
                />
                <div
                  className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-center rounded-full"
                  style={{
                    backgroundImage: `url(${sliderImages[currentSlide].bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(24px)',
                  }}
                />
              </div>

              {/* Animated Background Elements */}
              <div className="absolute inset-0">
                {/* Floating Orbs */}
                <motion.div
                  className="absolute top-20 right-20 w-96 h-96 bg-rose-200/20 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 30, 0],
                    y: [0, 20, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ filter: "blur(64px)" }}
                />
                <motion.div
                  className="absolute bottom-20 left-20 w-80 h-80 bg-pink-200/20 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    x: [0, -30, 0],
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ filter: "blur(64px)" }}
                />
                
                {/* Subtle Pattern */}
                <div className="absolute inset-0 opacity-[0.02]">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
                      backgroundSize: "60px 60px",
                    }}
                  />
                </div>
              </div>

              {/* Content Container */}
              <div className="relative z-20 container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                  {/* Text Content - Enhanced */}
                  <motion.div
                    key={`content-${currentSlide}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-center lg:text-left space-y-6 lg:space-y-8"
                  >
                    {/* Badge - Logo */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <div className="inline-flex items-center px-3 py-2 rounded-full">
                        <Logo className="h-20 md:h-28 mix-blend-multiply dark:mix-blend-normal" />
                      </div>
                    </motion.div>

                    {/* Title - Enhanced */}
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight"
                    >
                      <span className="text-gray-900 block mb-2">{sliderImages[currentSlide].title}</span>
                    </motion.h1>

                    {/* Description - Enhanced */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light"
                    >
                      {sliderImages[currentSlide].description}
                    </motion.p>

                    {/* CTA Button - Enhanced */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="flex justify-center lg:justify-start pt-2"
                    >
                      <Link href={sliderImages[currentSlide].buttonLink}>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 px-10 py-7 text-lg rounded-full font-bold transition-all duration-300 hover:scale-110 hover:shadow-2xl group shadow-xl"
                        >
                          <span className="flex items-center gap-2">
                            {sliderImages[currentSlide].buttonText}
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                          </span>
                        </Button>
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* Image Content - Enhanced */}
                  <motion.div
                    key={`image-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative h-[450px] lg:h-[650px] flex items-center justify-center"
                  >
                    {/* Multiple Glow Layers */}
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-300/30 to-pink-300/30 rounded-[3rem] blur-3xl transform rotate-6" />
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-[3rem] blur-2xl transform -rotate-6" />
                    </div>
                    
                    {/* Main Image Container */}
                    <div className="relative w-full h-full max-w-lg mx-auto">
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="relative bg-white/90 backdrop-blur-md rounded-[2.5rem] p-10 shadow-2xl border-2 border-white/80 overflow-hidden"
                      >
                        {/* Decorative Elements */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-2xl" />
                        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-pink-200/30 to-rose-200/30 rounded-full blur-xl" />
                        
                        <div className="relative w-full h-full min-h-[350px] lg:min-h-[550px]">
                          <Image
                            src={sliderImages[currentSlide].image}
                            alt={sliderImages[currentSlide].title}
                            fill
                            className="object-contain rounded-2xl"
                            priority={currentSlide === 0}
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-300 hover:scale-110 group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700 group-hover:text-rose-600 transition-colors" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-300 hover:scale-110 group"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-gray-700 group-hover:text-rose-600 transition-colors" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-2 items-center">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlide(index)
                }}
                className={`rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "bg-rose-500 w-8 h-2"
                    : "bg-gray-300 hover:bg-gray-400 w-2 h-2"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30"
        >
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <span className="text-xs uppercase tracking-wider font-medium">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-6 w-6 text-rose-500" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* New Collection Slider */}
      {isLoadingProducts ? (
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-16">
          <FeaturedProductsSkeleton />
        </div>
      ) : newCollectionProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-white via-rose-50/20 to-white relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    New Collection
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {language === "ar" ? "اكتشف أحدث مجموعاتنا" : "Discover our latest arrivals"}
                  </p>
                </div>
                <Link href="/products?featured=true&sortBy=newest">
                  <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50 rounded-full px-6">
                    {language === "ar" ? "عرض الكل" : "View All"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <div className="flex gap-6 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${newCollectionSlideIndex * (100 / 4)}%)` }}>
                  {newCollectionProducts.map((product, idx) => (
                    <Link key={product._id || product.id || idx} href={`/products/${product._id || product.id}`} className="min-w-[calc(25%-18px)] flex-shrink-0">
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-rose-300 hover:shadow-xl transition-all"
                      >
                        <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-50 relative">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-4xl font-bold text-gray-300">{product.name.charAt(0)}</div>
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-rose-500 text-white border-0 rounded-full px-3 py-1 text-xs">
                              {language === "ar" ? "جديد" : "New"}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-rose-500 mb-1">{product.category}</p>
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-rose-600">{formatPrice(product.price)}</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Virtual Camera Feature Section - Redesigned */}
      <section className="py-24 bg-gradient-to-b from-white to-rose-50/30 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Main Content - Left Aligned Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
              {/* Left Side - Content (3 columns) */}
              <div className="lg:col-span-3 space-y-8">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md text-sm font-semibold text-rose-700 border border-rose-200 shadow-lg shadow-rose-100/80 ring-1 ring-rose-100"
                >
                  <Camera className="h-4 w-4" />
                  <span>Try it before you buy</span>
                </motion.div>

                {/* Main Heading */}
                <motion.h2
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight"
                >
                  <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">Seamless Virtual Try-On</span>
                </motion.h2>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-5 max-w-3xl"
                >
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Experience a new level of confidence—use the virtual camera to preview any item live on you before purchasing, so you can confirm fit and style instantly.
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Experience like never before! Use our virtual camera to try on any piece before buying. 
                    Simply turn on the camera and stand in front of it, and we'll dress you in the item you want 
                    directly on your image so you can see how it looks on you before deciding to purchase.
                  </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
                >
                  {[
                    { icon: Video, title: "Instant Preview", desc: "See the item on you instantly before you place the order." },
                    { icon: Camera, title: "Try Multiple Items", desc: "Swap colors and sizes quickly to find the perfect match." },
                    { icon: TrendingUp, title: "Precise AR Tech", desc: "Realistic AI-assisted fitting with accurate detail." },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.08 }}
                      className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-rose-100 hover:border-rose-300 hover:shadow-xl transition-all group"
                    >
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-rose-200">
                        <feature.icon className="h-6 w-6 text-rose-600" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Link href="/virtual-try-on">
                    <Button size="lg" className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-white hover:from-rose-700 hover:via-pink-700 hover:to-amber-600 px-8 py-6 text-lg rounded-full font-semibold shadow-lg hover:shadow-2xl transition-all hover:scale-105 border border-white/50">
                      <Camera className="mr-2 h-5 w-5" />
                      ابدأ التجربة الآن
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Right Side - Interactive Card (2 columns) */}
              <div className="lg:col-span-2 relative">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  {/* Main Card */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60">
                    <div className="absolute inset-0">
                      <AnimatePresence mode="wait">
                        {virtualTryOnSlidesData.map((slide, index) => (
                          virtualTryOnSlide === index && (
                            <motion.div
                              key={slide.title}
                              initial={{ opacity: 0, scale: 1.05 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.8 }}
                              className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
                            />
                          )
                        ))}
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.6),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.55),transparent_42%)] opacity-70" />
                      <div className="absolute inset-0 backdrop-blur-[1.5px]" />
                    </div>

                    {/* Card Content */}
                    <div className="relative z-10 p-8 md:p-10 space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-white/80 border border-white/70 shadow flex items-center justify-center">
                            <Camera className="h-7 w-7 text-rose-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-600">Live Try-On</p>
                            <p className="text-sm text-gray-700">Auto alignment & secure feed</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/80 text-rose-700 text-xs font-semibold border border-white/70 shadow-sm">
                          {activeVirtualTryOnSlide.chip}
                        </span>
                      </div>

                      <div className="text-center space-y-3">
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">{activeVirtualTryOnSlide.title}</h3>
                        <p className="text-gray-700 text-sm md:text-base leading-relaxed">{activeVirtualTryOnSlide.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {activeVirtualTryOnSlide.stats.map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            whileHover={{ scale: 1.02, y: -3 }}
                            className="p-4 rounded-xl bg-white/80 backdrop-blur border border-white/70 shadow-md"
                          >
                            <div className="text-xs text-gray-500">{stat.label}</div>
                            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 bg-white/75 backdrop-blur border border-white/70 rounded-xl px-4 py-3 shadow">
                        <div className="flex-1 h-2 bg-rose-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 rounded-full"
                            style={{ width: `${70 + virtualTryOnSlide * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{virtualTryOnSlide + 1}/{virtualTryOnSlidesData.length}</span>
                      </div>

                      <div className="flex justify-center gap-2 pt-2">
                        {virtualTryOnSlidesData.map((slide, index) => (
                          <button
                            key={slide.title}
                            onClick={() => setVirtualTryOnSlide(index)}
                            className={`rounded-full transition-all duration-300 ${
                              virtualTryOnSlide === index
                                ? "bg-rose-600 w-8 h-2"
                                : "bg-rose-200 w-2 h-2 hover:bg-rose-300"
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Sliders Section - After Virtual Camera */}
      <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-white to-rose-50/30 space-y-16">
        {/* Men's Collection Slider */}
        {isLoadingProducts ? (
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 mb-8">
            <FeaturedProductsSkeleton />
          </div>
        ) : menProducts.length > 0 && (
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    Men's Collection
                  </h2>
                  <p className="text-gray-600">Premium fashion for men</p>
                </div>
                <Link href="/products?gender=Men">
                  <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <div className="flex gap-6 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${menSlideIndex * (100 / 4)}%)` }}>
                  {menProducts.map((product, idx) => (
                    <Link key={product._id || product.id || idx} href={`/products/${product._id || product.id}`} className="min-w-[calc(25%-18px)] flex-shrink-0">
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-rose-300 hover:shadow-xl transition-all"
                      >
                        <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-50 relative">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-4xl font-bold text-gray-300">{product.name.charAt(0)}</div>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-rose-500 mb-1">{product.category}</p>
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-rose-600">{formatPrice(product.price)}</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Women's Collection Slider - Reversed Direction */}
        {womenProducts.length > 0 && (
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    Women's Collection
                  </h2>
                  <p className="text-gray-600">Elegant fashion for women</p>
                </div>
                <Link href="/products?gender=Women">
                  <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <div className="flex gap-6 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${Math.max(0, (womenProducts.length - 4 - womenSlideIndex)) * (100 / 4)}%)` }}>
                  {womenProducts.slice().reverse().map((product, idx) => (
                    <Link key={product._id || product.id || idx} href={`/products/${product._id || product.id}`} className="min-w-[calc(25%-18px)] flex-shrink-0">
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-rose-300 hover:shadow-xl transition-all"
                      >
                        <div className="aspect-square bg-gradient-to-br from-pink-50 to-rose-50 relative">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-4xl font-bold text-gray-300">{product.name.charAt(0)}</div>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-rose-500 mb-1">{product.category}</p>
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-rose-600">{formatPrice(product.price)}</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Kids Collection Slider */}
        {kidsProducts.length > 0 && (
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    Kids Collection
                  </h2>
                  <p className="text-gray-600">Fun and comfortable for kids</p>
                </div>
                <Link href="/products?gender=Kids">
                  <Button variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <div className="flex gap-6 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${kidsSlideIndex * (100 / 4)}%)` }}>
                  {kidsProducts.map((product, idx) => (
                    <Link key={product._id || product.id || idx} href={`/products/${product._id || product.id}`} className="min-w-[calc(25%-18px)] flex-shrink-0">
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-rose-300 hover:shadow-xl transition-all"
                      >
                        <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-50 relative">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-4xl font-bold text-gray-300">{product.name.charAt(0)}</div>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-rose-500 mb-1">{product.category}</p>
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-rose-600">{formatPrice(product.price)}</p>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* Features Section - Left Aligned */}
      <section className="relative overflow-hidden py-16 sm:py-24 md:py-32 bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30">
        <div className="absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-rose-200/25 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.7),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.6),transparent_35%)]" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto">
            {/* Section Header - Left Aligned */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-12 sm:mb-16 md:mb-20"
            >
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-rose-100 text-sm font-semibold text-rose-600 shadow-sm">
                  Why choose us?
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                  Reasons that make <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">FashionHub</span> your first choice
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">
                  Smooth experience, premium quality, and fast delivery—everything crafted to keep you confident with every order.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Customer Satisfaction", value: "4.9/5" },
                  { label: "Avg. Delivery", value: "48h" },
                  { label: "Certified Materials", value: "100%" },
                ].map((stat) => (
                  <div key={stat.label} className="px-4 py-3 rounded-2xl bg-white/85 border border-rose-100 shadow-sm">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Features Grid - Left Aligned */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl">
              {[
                {
                  icon: <Palette className="h-8 w-8" />,
                  title: "Live & Interactive Design",
                  description: "Drag-and-drop studio with instant previews before printing.",
                  accent: "from-rose-500/15 to-pink-500/10",
                },
                {
                  icon: <TrendingUp className="h-8 w-8" />,
                  title: "Refined Quality",
                  description: "Certified materials and precise printing for lasting looks.",
                  accent: "from-amber-500/15 to-orange-500/10",
                },
                {
                  icon: <ShoppingBag className="h-8 w-8" />,
                  title: "Fast & Secure Delivery",
                  description: "Smart shipping with live tracking and confirmed delivery.",
                  accent: "from-blue-500/12 to-indigo-500/10",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                  className="group relative p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-white/60 shadow-lg shadow-rose-100/30 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                      {feature.icon}
                    </div>
                    <span className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                      Trusted
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                  <div className="mt-4 h-px bg-gradient-to-r from-transparent via-rose-200/70 to-transparent" />
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-rose-600">
                    Discover more
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - Professional Grid */}
      {isLoadingFeatured ? (
        <section className="py-32 bg-gradient-to-b from-white to-rose-50/50">
          <div className="container mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900">
                {language === "ar" ? "المجموعة المميزة" : "Featured Collection"}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {language === "ar" ? "استكشف مجموعتنا المختارة من الملابس المميزة" : "Explore our curated selection of premium apparel"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm border border-gray-200 animate-pulse">
                  <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-50" />
                  <div className="p-4 sm:p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-6 bg-gray-200 rounded w-2/3" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : featuredProducts.length > 0 && (
        <section className="py-32 bg-gradient-to-b from-white to-rose-50/50">
          <div className="container mx-auto px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900">
                {language === "ar" ? "المجموعة المميزة" : "Featured Collection"}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {language === "ar" ? "استكشف مجموعتنا المختارة من الملابس المميزة" : "Explore our curated selection of premium apparel"}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <Link key={product._id || product.id || index} href={`/products/${product._id || product.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group rounded-2xl overflow-hidden bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white hover:border-rose-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-square bg-gradient-to-br from-rose-50 to-pink-50 relative overflow-hidden">
                      {product.image ? (
                        <Image 
                          src={product.image} 
                          alt={product.name || "Product"} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-6xl font-bold text-gray-200">{(product.name || "P").charAt(0)}</div>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-rose-500 text-white border-0 rounded-full px-3 py-1 text-xs">
                          {language === "ar" ? "مميز" : "Featured"}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="text-xs sm:text-sm text-rose-500 mb-1 sm:mb-2 font-medium">{product.category}</div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                        {language === "ar" && (product as any).nameAr ? (product as any).nameAr : product.name}
                      </h3>
                      <div className="text-xl sm:text-2xl font-bold text-rose-600">{formatPrice(product.price)}</div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-16"
          >
            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 px-10 py-7 text-lg rounded-full font-semibold transition-all duration-300 hover:scale-105 group"
              >
                View All Products
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      )}

      {/* CTA Section - Professional */}
      <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-white via-rose-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-gray-900 px-4">
              Ready to Shop Something Amazing?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4">
              Join thousands of fashion lovers who are already shopping premium clothing at FashionHub.
            </p>
            <Link href="/studio" className="inline-block">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 text-base sm:text-lg md:text-xl rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
              >
                Get Started Now
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Customer Reviews Section - At the End of Content */}
      <CustomerReviewsSection />

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <Logo className="mb-4" />
              <p className="text-sm text-muted-foreground text-pretty">
                Empowering creativity through custom fashion design.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/products?category=tshirts" className="hover:text-foreground transition-colors">
                    T-Shirts
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=hoodies" className="hover:text-foreground transition-colors">
                    Hoodies
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=sweatshirts" className="hover:text-foreground transition-colors">
                    Sweatshirts
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 FashionHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
