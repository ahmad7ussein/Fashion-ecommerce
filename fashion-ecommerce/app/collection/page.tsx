"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Heart } from "lucide-react"
import { listProducts, type Product } from "@/lib/api/products"
import { useRegion } from "@/lib/region"
import { useLanguage } from "@/lib/language"
import { ProductGridSkeleton } from "@/components/skeletons"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { favoritesApi } from "@/lib/api/favorites"
import { useCart } from "@/lib/cart"
import { useRouter } from "next/navigation"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function CollectionPage() {
  const { formatPrice } = useRegion()
  const { language } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const { addItem } = useCart()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [menProducts, setMenProducts] = useState<Product[]>([])
  const [womenProducts, setWomenProducts] = useState<Product[]>([])
  const [kidsProducts, setKidsProducts] = useState<Product[]>([])
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loadingFavorites, setLoadingFavorites] = useState<Set<string>>(new Set())

  const sliderProducts = useMemo(() => {
    const map = new Map<string, Product>()
    collectionProducts.forEach((product) => {
      const id = product._id || product.id?.toString()
      if (id && !map.has(id)) {
        map.set(id, product)
      }
    })
    return Array.from(map.values()).slice(0, 8)
  }, [collectionProducts])

  useEffect(() => {
    const loadCollection = async () => {
      try {
        setIsLoading(true)
        const [men, women, kids] = await Promise.all([
          listProducts({ gender: "Men", active: true }),
          listProducts({ gender: "Women", active: true }),
          listProducts({ gender: "Kids", active: true }),
        ])
        
        setMenProducts(men.slice(0, 5))
        setWomenProducts(women.slice(0, 5))
        setKidsProducts(kids.slice(0, 5))

        try {
          const collection = await listProducts({ inCollection: true, active: true, sortBy: "newest", limit: 12 })
          setCollectionProducts(collection)
        } catch (collectionError) {
          console.error("Failed to load collection slider:", collectionError)
          setCollectionProducts([])
        }
      } catch (error) {
        console.error("Failed to load collection:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCollection()
  }, [])

  
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setFavoriteIds(new Set())
      return
    }

    const allProducts = [...menProducts, ...womenProducts, ...kidsProducts, ...collectionProducts]
    if (allProducts.length === 0) return

    const loadFavorites = async () => {
      try {
        const favoriteStatuses = await Promise.all(
          allProducts.map(async (product) => {
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
  }, [menProducts, womenProducts, kidsProducts, collectionProducts, isAuthenticated, user])

  
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

  const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const productId = product._id || product.id || `product-${index}`
    const isFavorite = favoriteIds.has(product._id || product.id?.toString() || "")
    const isLoadingFavorite = loadingFavorites.has(product._id || product.id?.toString() || "")
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
      >
        <div className="relative">
          <Link href={`/products/${productId}`}>
            <Card className="group overflow-hidden bg-white backdrop-blur-sm border-2 border-gray-200 hover:bg-white hover:border-rose-300 hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl cursor-pointer h-full flex flex-col">
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 relative">
                <Image
                  src={product.image || "/placeholder-logo.png"}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Badge className="text-xs sm:text-sm bg-rose-500 text-white border-0 rounded-full px-2 sm:px-3 py-1">
                    {product.gender}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2 right-2 sm:top-3 sm:right-3 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 hover:bg-white border-2 shadow-md z-10 transition-all ${
                    isFavorite ? "border-rose-500 bg-rose-50" : "border-gray-200 hover:border-rose-300"
                  }`}
                  onClick={(e) => handleToggleFavorite(product, e)}
                  disabled={isLoadingFavorite}
                >
                  <Heart
                    fill={isFavorite ? "currentColor" : "none"}
                    className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${
                      isFavorite ? "text-rose-500" : "text-gray-600 hover:text-rose-500"
                    }`}
                  />
                </Button>
              </div>
              <CardContent className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
                <div className="mb-2">
                  <p className="text-xs sm:text-sm text-rose-500 line-clamp-1 font-medium">{product.category}</p>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 text-sm sm:text-base md:text-lg group-hover:text-rose-600 transition-colors flex-1 leading-tight">
                  {product.name}
                </h3>
                <div className="mt-auto">
                  {(product as any).onSale && (product as any).salePercentage ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                          {language === "ar" ? `خصم ${(product as any).salePercentage}%` : `${(product as any).salePercentage}% OFF`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base text-gray-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-base sm:text-lg md:text-xl font-bold text-rose-600">
                          {formatPrice(product.price * (1 - ((product as any).salePercentage || 0) / 100))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg md:text-xl font-bold text-rose-600">{formatPrice(product.price)}</p>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full text-xs sm:text-sm font-semibold h-8 sm:h-9"
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <ShoppingBag className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                    {language === "ar" ? "أضف للسلة" : "Add to Cart"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 py-6 sm:py-8 md:py-12">
        { }
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              {language === "ar" ? (
                <>
                  <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                    المجموعة
                  </span>
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">Collection</span>
                </>
              )}
            </h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
            {language === "ar" 
              ? "اكتشف مجموعتنا المختارة بعناية من أفضل المنتجات" 
              : "Discover our carefully curated collection of premium products"}
          </p>
        </motion.div>

        { }
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {language === "ar" ? "أبرز قطع الكولكشن" : "Collection Highlights"}
            </h2>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/products">
                {language === "ar" ? "عرض الكل" : "View All"}
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : sliderProducts.length > 0 ? (
            <Carousel opts={{ align: "start", loop: true }} className="relative">
              <CarouselContent className="-ml-3 sm:-ml-4 lg:-ml-6">
                {sliderProducts.map((product, index) => (
                  <CarouselItem
                    key={product._id || product.id || `slider-${index}`}
                    className="pl-3 sm:pl-4 lg:pl-6 basis-full sm:basis-1/2 lg:basis-1/4"
                  >
                    <ProductCard product={product} index={index} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 sm:left-4 bg-white/90 hover:bg-white border border-rose-200 shadow" />
              <CarouselNext className="right-2 sm:right-4 bg-white/90 hover:bg-white border border-rose-200 shadow" />
            </Carousel>
          ) : null}
        </motion.section>

        { }
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {language === "ar" ? "👔 مجموعة الرجال" : "👔 Men's Collection"}
            </h2>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/products?gender=Men">
                {language === "ar" ? "عرض الكل" : "View All"}
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <ProductGridSkeleton count={5} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {menProducts.map((product, index) => (
                <ProductCard key={product._id || product.id || `men-${index}`} product={product} index={index} />
              ))}
            </div>
          )}
        </motion.section>

        { }
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {language === "ar" ? "👗 مجموعة النساء" : "👗 Women's Collection"}
            </h2>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/products?gender=Women">
                {language === "ar" ? "عرض الكل" : "View All"}
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <ProductGridSkeleton count={5} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {womenProducts.map((product, index) => (
                <ProductCard key={product._id || product.id || `women-${index}`} product={product} index={index} />
              ))}
            </div>
          )}
        </motion.section>

        { }
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {language === "ar" ? "👶 مجموعة الأطفال" : "👶 Kids Collection"}
            </h2>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/products?gender=Kids">
                {language === "ar" ? "عرض الكل" : "View All"}
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <ProductGridSkeleton count={5} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {kidsProducts.map((product, index) => (
                <ProductCard key={product._id || product.id || `kids-${index}`} product={product} index={index} />
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}

