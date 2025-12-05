"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Sparkles, Palette, TrendingUp, Camera, Video, ArrowRight, ChevronDown, Star } from "lucide-react"
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
import { motion } from "framer-motion"
import { ProfessionalNavbar } from "@/components/professional-navbar"
import { CustomerReviewsSection } from "@/components/customer-reviews-section"
import { useRegion } from "@/lib/region"

// Lazy load 3D background for better performance
const Background3DSimple = dynamic(
  () => import("@/components/3d-background").then((mod) => mod.Background3DSimple),
  { ssr: false }
)

const featuredProducts = [
  {
    id: 1,
    name: "Classic White Tee",
    price: 29.99,
    image: "/white-t-shirt-model.png",
    category: "T-Shirts",
  },
  {
    id: 2,
    name: "Urban Hoodie",
    price: 59.99,
    image: "/black-hoodie-streetwear.png",
    category: "Hoodies",
  },
  {
    id: 3,
    name: "Comfort Sweatshirt",
    price: 49.99,
    image: "/gray-sweatshirt-casual.jpg",
    category: "Sweatshirts",
  },
  {
    id: 4,
    name: "Designer Tee",
    price: 34.99,
    image: "/graphic-t-shirt-fashion.jpg",
    category: "T-Shirts",
  },
]

const sliderImages = [
  {
    id: 1,
    image: "/white-t-shirt-model.png",
    title: "Design Your Style",
    subtitle: "Create unique designs that reflect your personality",
  },
  {
    id: 2,
    image: "/black-hoodie-streetwear.png",
    title: "Premium Quality",
    subtitle: "High-quality materials for lasting comfort",
  },
  {
    id: 3,
    image: "/gray-sweatshirt-casual.jpg",
    title: "Express Yourself",
    subtitle: "Turn your ideas into wearable art",
  },
  {
    id: 4,
    image: "/graphic-t-shirt-fashion.jpg",
    title: "Fashion Forward",
    subtitle: "Stay ahead with cutting-edge designs",
  },
]

export default function HomePage() {
  const { formatPrice } = useRegion()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [virtualTryOnSlide, setVirtualTryOnSlide] = useState(0)

  // Auto-slide effect for hero section
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Auto-slide effect for Virtual Try-On section
  useEffect(() => {
    const interval = setInterval(() => {
      setVirtualTryOnSlide((prev) => (prev + 1) % 3)
    }, 6000) // Change slide every 6 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black">
      {/* Professional Navbar */}
      <ProfessionalNavbar />

      {/* 3D Background */}
      <Suspense fallback={null}>
        <Background3DSimple />
      </Suspense>

      {/* Hero Section - Minimalist & Professional with 3D Background */}
      <section className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/50" />

        {/* Content */}
        <div className="relative z-20 container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-16 sm:py-24 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 sm:mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/5 backdrop-blur-md rounded-full text-xs sm:text-sm text-white/70 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                Welcome to StyleCraft
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold mb-6 sm:mb-8 leading-[0.95] tracking-tighter text-white px-2"
            >
              Design. Create.
              <br />
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                Wear Your Vision
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-8 sm:mb-12 md:mb-14 text-gray-400 max-w-4xl mx-auto leading-relaxed font-light px-4"
            >
              Transform your ideas into wearable art with our interactive design studio.
              <br className="hidden sm:block" />
              <span className="hidden sm:inline">Create custom apparel that reflects your unique style.</span>
              <span className="sm:hidden">Create custom apparel that reflects your style.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center px-4"
            >
              <Link href="/studio" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-black hover:bg-gray-100 px-6 sm:px-8 md:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                >
                  <Palette className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                  Start Designing
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/products" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-6 sm:px-8 md:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-full font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Explore Collection
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto px-4"
            >
              {[
                { label: "Designs Created", value: "10K+" },
                { label: "Happy Customers", value: "5K+" },
                { label: "Products", value: "500+" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-3 text-white/40">
            <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-6 w-6" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Virtual Camera Feature Section - Main Feature */}
      <section className="py-24 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <SlideInFromLeft>
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/50"
                  >
                    <Camera className="h-5 w-5" />
                    <span>✨ Try Before You Buy</span>
                  </motion.div>
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                    Virtual Camera Experience
                  </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  تجربة فريدة من نوعها! استخدم الكاميرا الافتراضية لتجربة أي قطعة قبل شرائها. 
                  فقط قم بتشغيل الكاميرا ووقف أمامها، وسنقوم بإلباسك القطعة التي تريدها مباشرة 
                  على صورتك لترى كيف ستبدو عليك قبل أن تقرر الشراء.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Experience like never before! Use our virtual camera to try on any piece before buying. 
                  Simply turn on the camera and stand in front of it, and we'll dress you in the item you want 
                  directly on your image so you can see how it looks on you before deciding to purchase.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Video className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Real-time Preview</h4>
                      <p className="text-sm text-muted-foreground">
                        See yourself wearing the product instantly
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Camera className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Try Multiple Items</h4>
                      <p className="text-sm text-muted-foreground">
                        Test different sizes, colors, and designs
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">AR Technology</h4>
                      <p className="text-sm text-muted-foreground">
                        Advanced augmented reality for accurate fit
                      </p>
                    </div>
                  </li>
                </ul>
                  <Link href="/virtual-try-on">
                    <Button size="lg" className="mt-4">
                      <Camera className="mr-2 h-5 w-5" />
                      Try Virtual Camera
                    </Button>
                  </Link>
                </div>
              </SlideInFromLeft>
              <SlideInFromRight>
                <div className="relative">
                  {/* Virtual Try-On Card with Auto Slider Background - Eye-catching Design */}
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white/50 backdrop-blur-sm">
                    {/* Glowing Border Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur-xl opacity-75 animate-pulse" />
                    
                    {/* Auto Slider Background with Vibrant Gradients */}
                    <div className="absolute inset-0">
                      {[
                        {
                          gradient: "from-purple-500 via-pink-500 to-rose-500",
                          pattern: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        },
                        {
                          gradient: "from-cyan-500 via-blue-500 to-purple-500",
                          pattern: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        },
                        {
                          gradient: "from-pink-500 via-rose-500 to-orange-500",
                          pattern: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 40% 60%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        },
                      ].map((bg, index) => (
                        <motion.div
                          key={index}
                          className={`absolute inset-0 bg-gradient-to-br ${bg.gradient}`}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{
                            opacity: virtualTryOnSlide === index ? 1 : 0,
                            scale: virtualTryOnSlide === index ? 1 : 1.05,
                          }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                        >
                          {/* Animated Pattern Overlay */}
                          <div 
                            className="absolute inset-0 opacity-40"
                            style={{
                              backgroundImage: bg.pattern,
                            }}
                          />
                          {/* Enhanced Shimmer Effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ["-100%", "200%"],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              repeatDelay: 2,
                              ease: "linear",
                            }}
                            style={{
                              width: "50%",
                              height: "100%",
                              transform: "skewX(-20deg)",
                            }}
                          />
                          {/* Floating Particles Effect */}
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-white/40 rounded-full"
                              style={{
                                left: `${20 + i * 15}%`,
                                top: `${30 + (i % 3) * 20}%`,
                              }}
                              animate={{
                                y: [0, -20, 0],
                                opacity: [0.4, 0.8, 0.4],
                                scale: [1, 1.5, 1],
                              }}
                              transition={{
                                duration: 3 + i * 0.5,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </motion.div>
                      ))}
                    </div>

                    {/* Content - Enhanced Design */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
                      <div className="text-center space-y-6">
                        {/* Animated Camera Icon */}
                        <motion.div
                          className="h-32 w-32 mx-auto rounded-full bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl flex items-center justify-center border-4 border-white/50 shadow-2xl"
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Camera className="h-16 w-16 text-white drop-shadow-2xl" />
                        </motion.div>
                        <div className="space-y-3">
                          <h3 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-2xl">
                            Virtual Try-On
                          </h3>
                          <p className="text-white/95 drop-shadow-lg text-lg font-medium">
                            Experience products in real-time using your camera
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-10">
                          <motion.div
                            className="p-5 rounded-xl bg-white/30 backdrop-blur-xl border-2 border-white/40 shadow-2xl hover:bg-white/40 transition-all cursor-pointer"
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="text-3xl font-extrabold text-white drop-shadow-2xl mb-1">AR</div>
                            <div className="text-sm text-white/95 font-semibold">Augmented Reality</div>
                          </motion.div>
                          <motion.div
                            className="p-5 rounded-xl bg-white/30 backdrop-blur-xl border-2 border-white/40 shadow-2xl hover:bg-white/40 transition-all cursor-pointer"
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="text-3xl font-extrabold text-white drop-shadow-2xl mb-1">AI</div>
                            <div className="text-sm text-white/95 font-semibold">AI-Powered</div>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Slider Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                      {[0, 1, 2].map((index) => (
                        <button
                          key={index}
                          onClick={() => setVirtualTryOnSlide(index)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            virtualTryOnSlide === index
                              ? "w-8 bg-white"
                              : "w-2 bg-white/40 hover:bg-white/60"
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </SlideInFromRight>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Professional Grid */}
      <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16 md:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 tracking-tight text-white px-4">
              Why Choose
              <span className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent"> StyleCraft</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Experience the future of fashion design with our cutting-edge platform
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Palette className="h-8 w-8" />,
                title: "Interactive Design Studio",
                description: "Create stunning designs with our intuitive drag-and-drop interface and real-time preview.",
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Premium Quality",
                description: "We use only the finest materials and printing techniques for exceptional results.",
              },
              {
                icon: <ShoppingBag className="h-8 w-8" />,
                title: "Fast Delivery",
                description: "Your designs go from screen to reality in days. Quick turnaround guaranteed.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group p-6 sm:p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
              >
                <div className="mb-4 sm:mb-5 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Professional Grid */}
      <section className="py-32 bg-gradient-to-b from-gray-950 to-black">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white">
              Featured Collection
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore our curated selection of premium apparel
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <div className="text-6xl font-bold text-white/10">{product.name.charAt(0)}</div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{product.category}</div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-white group-hover:text-gray-200 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="text-xl sm:text-2xl font-bold text-white">{formatPrice(product.price)}</div>
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
                className="border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-10 py-7 text-lg rounded-full font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm group"
              >
                View All Products
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <CustomerReviewsSection />

      {/* CTA Section - Professional */}
      <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-white px-4">
              Ready to Create Something Amazing?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4">
              Join thousands of creators who are already designing their dream apparel with StyleCraft.
            </p>
            <Link href="/studio" className="inline-block">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 text-base sm:text-lg md:text-xl rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
              >
                <Sparkles className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform" />
                Get Started Now
                <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12">
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
            <p>&copy; 2025 StyleCraft. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
