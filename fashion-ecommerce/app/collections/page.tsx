"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Heart, Sparkles, Star, ArrowRight, Zap } from "lucide-react"
import { listProducts, type Product } from "@/lib/api/products"
import { useRegion } from "@/lib/region"
import { useLanguage } from "@/lib/language"
import { ProductGridSkeleton } from "@/components/skeletons"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { favoritesApi } from "@/lib/api/favorites"
import { useCart } from "@/lib/cart"
import { useRouter } from "next/navigation"

export default function CollectionsPage() {
  const { formatPrice } = useRegion()
  const { language } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const { addItem } = useCart()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set())
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    const loadCollection = async () => {
      try {
        setIsLoading(true)
        // Fetch products with inCollection filter
        const collectionProducts = await listProducts({ inCollection: true, active: true })
        setProducts(collectionProducts)
      } catch (error) {
        console.error("Failed to load collection:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCollection()
  }, [])

  // Load favorite status
  useEffect(() => {
    if (!isAuthenticated || !user || products.length === 0) {
      setFavoriteIds(new Set())
      return
    }

    const loadFavorites = async () => {
      try {
        const favoriteStatuses = await Promise.all(
          products.map(async (product) => {
            const productId = product._id || product.id?.toString()
            if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) return null
            try {
              const isFavorite = await favoritesApi.checkFavorite(productId)
              return { productId, isFavorite }
            } catch {
              return { productId, isFavorite: false }
            }
          })
        )

        const favoriteSet = new Set<string>()
        favoriteStatuses.forEach((status) => {
          if (status && status.productId && status.isFavorite === true) {
            favoriteSet.add(status.productId)
          }
        })
        setFavoriteIds(favoriteSet)
      } catch (error) {
        console.error("Failed to load favorites:", error)
      }
    }

    loadFavorites()
  }, [products, isAuthenticated, user])

  // Handle favorite toggle
  const handleToggleFavorite = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated || !user) {
      toast({
        title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
        description: language === "ar" ? "يرجى تسجيل الدخول لإضافة المنتجات للمفضلة" : "Please sign in to add products to favorites",
        variant: "default",
      })
      setTimeout(() => {
        router.push("/login")
      }, 1500)
      return
    }

    const productId = product._id || product.id?.toString()
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return
    }

    const isCurrentlyFavorite = favoriteIds.has(productId)
    setLoadingFavorites((prev) => new Set(prev).add(productId))

    try {
      const result = await favoritesApi.toggleFavorite(productId)
      setFavoriteIds((prev) => {
        const newSet = new Set(prev)
        if (result.isFavorite) {
          newSet.add(productId)
        } else {
          newSet.delete(productId)
        }
        return newSet
      })

      toast({
        title: result.isFavorite
          ? (language === "ar" ? "تمت الإضافة" : "Added to favorites")
          : (language === "ar" ? "تم الحذف" : "Removed from favorites"),
        description: result.isFavorite
          ? (language === "ar" ? `${product.name} تمت إضافته للمفضلة` : `${product.name} added to favorites`)
          : (language === "ar" ? `${product.name} تم حذفه من المفضلة` : `${product.name} removed from favorites`),
        duration: 2000,
      })
    } catch (error: any) {
      console.error("Failed to toggle favorite:", error)
      toast({
        title: "Error",
        description: error.message || (language === "ar" ? "فشل تحديث المفضلة" : "Failed to update favorite"),
        variant: "destructive",
      })
    } finally {
      setLoadingFavorites((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  // Handle add to cart
  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated || !user) {
      toast({
        title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
        description: language === "ar" ? "يرجى تسجيل الدخول لإضافة المنتجات للسلة" : "Please sign in to add items to your cart",
        variant: "default",
      })
      setTimeout(() => {
        router.push("/login")
      }, 1500)
      return
    }

    try {
      const prodId = product._id || product.id?.toString() || ""
      const salePercentage = (product as any).salePercentage || 0
      const finalPrice = (product as any).onSale && salePercentage > 0
        ? product.price * (1 - salePercentage / 100)
        : product.price

      await addItem({
        id: `${prodId}-M-${product.colors?.[0] || "default"}`,
        name: product.name,
        price: finalPrice,
        quantity: 1,
        size: "M",
        color: product.colors?.[0] || "default",
        image: product.image,
        isCustom: false,
      })

      toast({
        title: language === "ar" ? "تمت الإضافة" : "Added to cart",
        description: language === "ar" ? `${product.name} تمت إضافته للسلة` : `${product.name} added to cart`,
      })
    } catch (error: any) {
      if (error.name === "AuthenticationRequired" || error.message === "AUTHENTICATION_REQUIRED") {
        toast({
          title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
          description: language === "ar" ? "يرجى تسجيل الدخول لإضافة المنتجات للسلة" : "Please sign in to add items to your cart",
          variant: "default",
        })
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      } else {
        toast({
          title: "Error",
          description: error.message || (language === "ar" ? "فشل إضافة المنتج للسلة" : "Failed to add item to cart"),
          variant: "destructive",
        })
      }
    }
  }

  // Create staggered animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  // Group products by category for masonry layout
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || "Other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  const categories = Object.keys(groupedProducts)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12">
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <Star className="h-16 w-16 text-rose-300 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {language === "ar" ? "لا توجد منتجات في المجموعة" : "No Products in Collection"}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === "ar"
              ? "لم يتم إضافة أي منتجات إلى المجموعة بعد. يرجى إضافة منتجات من لوحة التحكم."
              : "No products have been added to the collection yet. Please add products from the admin panel."}
          </p>
          <Button asChild className="bg-gradient-to-r from-rose-500 to-pink-500">
            <Link href="/products">
              {language === "ar" ? "عرض جميع المنتجات" : "View All Products"}
            </Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      {/* Hero Section with Parallax */}
      <motion.div
        style={{ opacity, scale }}
        className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 text-white py-16 sm:py-24 md:py-32"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
                {language === "ar" ? "المجموعات المميزة" : "Featured Collections"}
              </h1>
              <Star className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-rose-100 mb-8 max-w-2xl mx-auto">
              {language === "ar"
                ? "اكتشف مجموعتنا المختارة بعناية من أفضل المنتجات المميزة"
                : "Discover our carefully curated selection of premium featured products"}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2"
            >
              <Zap className="h-5 w-5" />
              <span className="text-sm sm:text-base">
                {products.length} {language === "ar" ? "منتج مميز" : "Featured Products"}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Products Grid - Masonry Style */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {categories.map((category, categoryIndex) => (
            <motion.section
              key={category}
              variants={itemVariants}
              className="space-y-8"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    {category}
                  </h2>
                  <div className="h-1 flex-1 bg-gradient-to-r from-pink-500 to-transparent rounded-full max-w-md" />
                </div>
                <Badge className="bg-rose-500 text-white text-sm px-4 py-1.5">
                  {groupedProducts[category].length} {language === "ar" ? "منتج" : "Products"}
                </Badge>
              </div>

              {/* Masonry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {groupedProducts[category].map((product, index) => {
                  const productId = product._id || product.id || `product-${index}`
                  const isFavorite = favoriteIds.has(product._id || product.id?.toString() || "")
                  const isLoadingFavorite = loadingFavorites.has(product._id || product.id?.toString() || "")

                  return (
                    <motion.div
                      key={productId}
                      variants={itemVariants}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="group"
                    >
                      <Link href={`/products/${productId}`}>
                        <Card className="overflow-hidden bg-white border-2 border-gray-200 hover:border-rose-300 hover:shadow-2xl transition-all duration-500 rounded-2xl h-full flex flex-col relative">
                          {/* Image Container with Overlay */}
                          <div className="aspect-square overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 relative">
                            <Image
                              src={product.image || "/placeholder-logo.png"}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                              {product.gender && (
                                <Badge className="text-xs bg-rose-500 text-white border-0 rounded-full px-3 py-1">
                                  {product.gender}
                                </Badge>
                              )}
                              {(product as any).onSale && (
                                <Badge className="text-xs bg-red-500 text-white border-0 rounded-full px-3 py-1">
                                  {language === "ar" ? "خصم" : "SALE"}
                                </Badge>
                              )}
                            </div>

                            {/* Favorite Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 hover:bg-white border-2 shadow-lg z-10 transition-all ${
                                isFavorite ? "border-rose-500 bg-rose-50" : "border-gray-200 hover:border-rose-300"
                              }`}
                              onClick={(e) => handleToggleFavorite(product, e)}
                              disabled={isLoadingFavorite}
                            >
                              <Heart
                                fill={isFavorite ? "currentColor" : "none"}
                                className={`h-5 w-5 transition-all duration-200 ${
                                  isFavorite ? "text-rose-500" : "text-gray-600"
                                }`}
                              />
                            </Button>

                            {/* Quick Add Button - Appears on Hover */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                              <Button
                                size="sm"
                                className="w-full bg-white text-rose-600 hover:bg-rose-50 border-2 border-white rounded-full font-semibold shadow-lg"
                                onClick={(e) => handleAddToCart(product, e)}
                              >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                {language === "ar" ? "أضف للسلة" : "Add to Cart"}
                              </Button>
                            </div>
                          </div>

                          {/* Product Info */}
                          <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
                            <div className="mb-2">
                              <p className="text-xs sm:text-sm text-rose-500 font-medium uppercase tracking-wider">
                                {product.category}
                              </p>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-base sm:text-lg group-hover:text-rose-600 transition-colors flex-1">
                              {product.name}
                            </h3>
                            
                            {/* Price */}
                            <div className="mt-auto">
                              {(product as any).onSale && (product as any).salePercentage ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                                      {language === "ar" ? `خصم ${(product as any).salePercentage}%` : `${(product as any).salePercentage}% OFF`}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400 line-through">
                                      {formatPrice(product.price)}
                                    </span>
                                    <span className="text-lg font-bold text-rose-600">
                                      {formatPrice(product.price * (1 - ((product as any).salePercentage || 0) / 100))}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                                  {formatPrice(product.price)}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>
          ))}
        </motion.div>

        {/* Call to Action */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <Card className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white border-0 p-8 sm:p-12 rounded-3xl">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                {language === "ar" ? "اكتشف المزيد من المنتجات" : "Discover More Products"}
              </h3>
              <p className="text-rose-100 mb-6 text-lg">
                {language === "ar"
                  ? "تصفح مجموعتنا الكاملة من المنتجات المميزة"
                  : "Browse our complete collection of premium products"}
              </p>
              <Button asChild size="lg" className="bg-white text-rose-600 hover:bg-rose-50 rounded-full px-8">
                <Link href="/products">
                  {language === "ar" ? "عرض جميع المنتجات" : "View All Products"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
