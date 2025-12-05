"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingBag, Search, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { listProducts, type Product } from "@/lib/api/products"
import { useRegion } from "@/lib/region"

// Note: metadata cannot be exported from client components in Next.js
export default function ProductsPage() {
  const { formatPrice } = useRegion()
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [genderFilter, setGenderFilter] = useState("all")
  const [seasonFilter, setSeasonFilter] = useState("all")
  const [styleFilter, setStyleFilter] = useState("all")
  const [occasionFilter, setOccasionFilter] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      const list = await listProducts({
        search: searchQuery,
        category: categoryFilter,
        gender: genderFilter,
        season: seasonFilter,
        style: styleFilter,
        occasion: occasionFilter,
        sortBy: sortBy as any,
      })
      if (isMounted) setProducts(list)
      setIsLoading(false)
    }
    load()
    return () => {
      isMounted = false
    }
  }, [searchQuery, categoryFilter, genderFilter, seasonFilter, styleFilter, occasionFilter, sortBy])

  const activeFiltersCount = [
    categoryFilter !== "all",
    genderFilter !== "all",
    seasonFilter !== "all",
    styleFilter !== "all",
    occasionFilter !== "all",
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-8 sm:py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 tracking-tight text-white">
            Shop Collection
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400">Discover premium apparel for every style, season, and occasion</p>
        </motion.div>

        {/* Search and Filter Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 h-12 sm:h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl sm:rounded-2xl focus:bg-white/10 focus:border-white/20 transition-all text-sm sm:text-base"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative h-12 sm:h-14 px-4 sm:px-6 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base"
          >
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center bg-white text-black rounded-full text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-auto md:w-56 h-12 sm:h-14 bg-white/5 border-white/10 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
            >
            <div>
              <label className="text-sm font-medium mb-3 block text-white">Gender</label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Men">Men</SelectItem>
                  <SelectItem value="Women">Women</SelectItem>
                  <SelectItem value="Kids">Kids</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-white">Season</label>
              <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All Seasons</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                  <SelectItem value="Winter">Winter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-white">Style</label>
              <Select value={styleFilter} onValueChange={setStyleFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="Plain">Plain</SelectItem>
                  <SelectItem value="Graphic">Graphic/Patterned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-white">Occasion</label>
              <Select value={occasionFilter} onValueChange={setOccasionFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All Occasions</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Classic">Classic</SelectItem>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Wedding">Wedding/Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-white">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="T-Shirts">T-Shirts</SelectItem>
                  <SelectItem value="Hoodies">Hoodies</SelectItem>
                  <SelectItem value="Sweatshirts">Sweatshirts</SelectItem>
                  <SelectItem value="Jackets">Jackets</SelectItem>
                  <SelectItem value="Pants">Pants</SelectItem>
                  <SelectItem value="Shorts">Shorts</SelectItem>
                  <SelectItem value="Tank Tops">Tank Tops</SelectItem>
                  <SelectItem value="Polo Shirts">Polo Shirts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-8"
          >
            {genderFilter !== "all" && (
              <Badge className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all">
                {genderFilter}
                <button onClick={() => setGenderFilter("all")} className="ml-2 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {seasonFilter !== "all" && (
              <Badge className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all">
                {seasonFilter}
                <button onClick={() => setSeasonFilter("all")} className="ml-2 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {styleFilter !== "all" && (
              <Badge className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all">
                {styleFilter}
                <button onClick={() => setStyleFilter("all")} className="ml-2 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {occasionFilter !== "all" && (
              <Badge className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all">
                {occasionFilter}
                <button onClick={() => setOccasionFilter("all")} className="ml-2 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {categoryFilter !== "all" && (
              <Badge className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-full hover:bg-white/20 transition-all">
                {categoryFilter}
                <button onClick={() => setCategoryFilter("all")} className="ml-2 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </motion.div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-base text-gray-400">
            {isLoading ? "Loading..." : `Showing ${products.length} ${products.length === 1 ? "product" : "products"}`}
          </p>
        </div>

        {/* Products Grid - Like popular apps (more products per row) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {products.map((product, index) => {
            const productId = product._id || product.id || `product-${index}`
            return (
            <motion.div
              key={productId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
            >
              <Link href={`/products/${productId}`}>
                <Card className="group overflow-hidden bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 rounded-lg sm:rounded-xl cursor-pointer h-full flex flex-col">
                  <div className="aspect-square overflow-hidden bg-gray-900 relative">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Badge className="text-[10px] sm:text-xs bg-white/95 text-black border-0 rounded-full px-1.5 sm:px-2 py-0.5">
                        {product.gender}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-2 sm:p-3 flex-1 flex flex-col">
                    <div className="mb-1">
                      <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1">{product.category}</p>
                    </div>
                    <h3 className="font-medium text-white mb-1.5 sm:mb-2 line-clamp-2 text-xs sm:text-sm group-hover:text-purple-400 transition-colors flex-1">
                      {product.name}
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-white mt-auto">{formatPrice(product.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
            )
          })}
        </div>

        {!isLoading && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 mb-6 text-lg">No products found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter("all")
                setGenderFilter("all")
                setSeasonFilter("all")
                setStyleFilter("all")
                setOccasionFilter("all")
                setSearchQuery("")
              }}
              className="h-12 px-8 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-full transition-all"
            >
              Clear All Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
