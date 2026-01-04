"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Search, Filter, X, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { listProductsPaginated } from "@/lib/api/products";
import { useRegion } from "@/lib/region";
import { useLanguage } from "@/lib/language";
import { ProductGridSkeleton } from "@/components/skeletons";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { favoritesApi } from "@/lib/api/favorites";
import { useCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
function ProductsPageContent() {
    const { formatPrice } = useRegion();
    const { language } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const { addItem } = useCart();
    const router = useRouter();
    const searchParams = useSearchParams();
    const PAGE_SIZE = 24;
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [loadingFavorites, setLoadingFavorites] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [categoryFilter, setCategoryFilter] = useState(() => {
        const cat = searchParams.get("category");
        return cat && cat !== "all" ? cat : "all";
    });
    const [genderFilter, setGenderFilter] = useState(() => {
        const gen = searchParams.get("gender");
        return gen && gen !== "all" ? gen : "all";
    });
    const [seasonFilter, setSeasonFilter] = useState(() => {
        const sea = searchParams.get("season");
        return sea && sea !== "all" ? sea : "all";
    });
    const [styleFilter, setStyleFilter] = useState("all");
    const [occasionFilter, setOccasionFilter] = useState("all");
    const [sortBy, setSortBy] = useState("featured");
    const [showFilters, setShowFilters] = useState(false);
    useEffect(() => {
        const searchParam = searchParams.get("search");
        const genderParam = searchParams.get("gender");
        const seasonParam = searchParams.get("season");
        const categoryParam = searchParams.get("category");
        if (searchParam !== null) {
            setSearchQuery(searchParam);
        }
        if (genderParam !== null && genderParam !== "all") {
            setGenderFilter(genderParam);
        }
        else if (genderParam === null) {
            setGenderFilter("all");
        }
        if (seasonParam !== null && seasonParam !== "all") {
            setSeasonFilter(seasonParam);
        }
        else if (seasonParam === null) {
            setSeasonFilter("all");
        }
        if (categoryParam !== null && categoryParam !== "all") {
            setCategoryFilter(categoryParam);
        }
        else if (categoryParam === null) {
            setCategoryFilter("all");
        }
        setCurrentPage(1);
    }, [searchParams]);
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter, genderFilter, seasonFilter, styleFilter, occasionFilter, sortBy]);
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const searchParam = searchParams.get("search");
                const genderParam = searchParams.get("gender");
                const seasonParam = searchParams.get("season");
                const categoryParam = searchParams.get("category");
                const filters = {
                    sortBy: sortBy,
                    page: currentPage,
                    limit: PAGE_SIZE,
                };
                if (searchParam) {
                    filters.search = searchParam;
                }
                else if (searchQuery) {
                    filters.search = searchQuery;
                }
                if (categoryParam !== null && categoryParam !== "all") {
                    filters.category = categoryParam;
                }
                else if (categoryFilter !== "all") {
                    filters.category = categoryFilter;
                }
                if (genderParam !== null && genderParam !== "all") {
                    filters.gender = genderParam;
                }
                else if (genderFilter !== "all") {
                    filters.gender = genderFilter;
                }
                if (seasonParam !== null && seasonParam !== "all") {
                    filters.season = seasonParam;
                }
                else if (seasonFilter !== "all") {
                    filters.season = seasonFilter;
                }
                if (styleFilter !== "all") {
                    filters.style = styleFilter;
                }
                if (occasionFilter !== "all") {
                    filters.occasion = occasionFilter;
                }
                const result = await listProductsPaginated(filters);
                if (isMounted) {
                    setProducts(result.data);
                    setTotalCount(result.total);
                    setTotalPages(Math.max(result.pages || 1, 1));
                    setIsLoading(false);
                }
            }
            catch (error) {
                console.error("Failed to load products:", error);
                if (isMounted) {
                    setProducts([]);
                    setTotalCount(0);
                    setTotalPages(1);
                    setIsLoading(false);
                }
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [searchParams, searchQuery, categoryFilter, genderFilter, seasonFilter, styleFilter, occasionFilter, sortBy, currentPage]);
    useEffect(() => {
        if (!isAuthenticated || !user || products.length === 0) {
            setFavoriteIds(new Set());
            return;
        }
        const loadFavorites = async () => {
            try {
                const validProducts = products.filter(p => {
                    const productId = p._id || p.id?.toString();
                    return productId && /^[0-9a-fA-F]{24}$/.test(productId);
                });
                if (validProducts.length === 0) {
                    setFavoriteIds(new Set());
                    return;
                }
                const favoriteStatuses = await Promise.all(validProducts.map(async (product) => {
                    const productId = product._id || product.id?.toString();
                    if (!productId)
                        return null;
                    try {
                        const isFavorite = await favoritesApi.checkFavorite(productId);
                        return isFavorite ? { productId, isFavorite: true } : null;
                    }
                    catch (error) {
                        console.warn(`Failed to check favorite for product ${productId}:`, error);
                        return null;
                    }
                }));
                const favoriteSet = new Set();
                favoriteStatuses.forEach((status) => {
                    if (status && status.productId && status.isFavorite === true) {
                        favoriteSet.add(status.productId);
                    }
                });
                setFavoriteIds(favoriteSet);
            }
            catch (error) {
                console.error("Failed to load favorites:", error);
                setFavoriteIds(new Set());
            }
        };
        loadFavorites();
    }, [products, isAuthenticated, user]);
    const handleToggleFavorite = async (product, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated || !user) {
            toast({
                title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
                description: language === "ar" ? "يرجى تسجيل الدخول لإضافة المنتجات للمفضلة" : "Please sign in to add products to favorites",
                variant: "default",
            });
            setTimeout(() => {
                router.push("/login");
            }, 1500);
            return;
        }
        const productId = product._id || product.id?.toString();
        if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
            toast({
                title: "Error",
                description: language === "ar" ? "معرف المنتج غير صحيح" : "Invalid product ID",
                variant: "destructive",
            });
            return;
        }
        const isCurrentlyFavorite = favoriteIds.has(productId);
        setLoadingFavorites((prev) => new Set(prev).add(productId));
        try {
            const result = await favoritesApi.toggleFavorite(productId);
            setFavoriteIds((prev) => {
                const newSet = new Set(prev);
                if (result.isFavorite) {
                    newSet.add(productId);
                }
                else {
                    newSet.delete(productId);
                }
                return newSet;
            });
            toast({
                title: result.isFavorite
                    ? (language === "ar" ? "تمت الإضافة" : "Added to favorites")
                    : (language === "ar" ? "تم الحذف" : "Removed from favorites"),
                description: result.isFavorite
                    ? (language === "ar" ? `${product.name} تمت إضافته للمفضلة` : `${product.name} added to favorites`)
                    : (language === "ar" ? `${product.name} تم حذفه من المفضلة` : `${product.name} removed from favorites`),
                duration: 2000,
            });
        }
        catch (error) {
            console.error("Failed to toggle favorite:", error);
            toast({
                title: "Error",
                description: error.message || (language === "ar" ? "فشل تحديث المفضلة" : "Failed to update favorite"),
                variant: "destructive",
            });
        }
        finally {
            setLoadingFavorites((prev) => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
        }
    };
    const handleAddToCart = async (product, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated || !user) {
            toast({
                title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
                description: language === "ar" ? "يرجى تسجيل الدخول لإضافة المنتجات للسلة" : "Please sign in to add items to your cart",
                variant: "default",
            });
            setTimeout(() => {
                router.push("/login");
            }, 1500);
            return;
        }
        try {
            const prodId = product._id || product.id?.toString() || "";
            const salePercentage = product.salePercentage || 0;
            const finalPrice = product.onSale && salePercentage > 0
                ? product.price * (1 - salePercentage / 100)
                : product.price;
            await addItem({
                id: `${prodId}-M-${product.colors?.[0] || "default"}`,
                name: product.name,
                price: finalPrice,
                quantity: 1,
                size: "M",
                color: product.colors?.[0] || "default",
                image: product.image,
                isCustom: false,
            });
            toast({
                title: language === "ar" ? "تمت الإضافة" : "Added to cart",
                description: language === "ar" ? `${product.name} تمت إضافته للسلة` : `${product.name} added to cart`,
            });
        }
        catch (error) {
            if (error.name === "AuthenticationRequired" || error.message === "AUTHENTICATION_REQUIRED") {
                toast({
                    title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
                    description: language === "ar" ? "يرجى تسجيل الدخول لإضافة المنتجات للسلة" : "Please sign in to add items to your cart",
                    variant: "default",
                });
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            }
            else {
                toast({
                    title: "Error",
                    description: error.message || (language === "ar" ? "فشل إضافة المنتج للسلة" : "Failed to add item to cart"),
                    variant: "destructive",
                });
            }
        }
    };
    const activeFiltersCount = [
        categoryFilter !== "all",
        genderFilter !== "all",
        seasonFilter !== "all",
        styleFilter !== "all",
        occasionFilter !== "all",
    ].filter(Boolean).length;
    const paginationPages = (() => {
        const maxPagesToShow = 5;
        const half = Math.floor(maxPagesToShow / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxPagesToShow - 1);
        if (end - start + 1 < maxPagesToShow) {
            start = Math.max(1, end - maxPagesToShow + 1);
        }
        const pages = [];
        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }
        return {
            pages,
            showStartEllipsis: start > 1,
            showEndEllipsis: end < totalPages,
        };
    })();
    return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-8 sm:py-12">
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 tracking-tight text-gray-900">
            {language === "ar" ? (<>
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">المجموعة</span> التسوق
              </>) : (<>
                Shop <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">Collection</span>
              </>)}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            {language === "ar"
            ? "اكتشف الملابس الفاخرة لكل نمط وموسم ومناسبة"
            : "Discover premium apparel for every style, season, and occasion"}
          </p>
        </motion.div>

        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
            <Input placeholder={language === "ar" ? "ابحث عن المنتجات..." : "Search products..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 sm:pl-12 h-12 sm:h-14 bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl sm:rounded-2xl focus:bg-white focus:border-rose-300 transition-all text-sm sm:text-base"/>
          </div>

          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative h-12 sm:h-14 px-4 sm:px-6 bg-white border-2 border-gray-200 text-gray-700 hover:bg-rose-50 hover:border-rose-300 rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2"/>
            {language === "ar" ? "الفلترة" : "Filters"}
            {activeFiltersCount > 0 && (<Badge className="ml-2 h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center bg-white text-black rounded-full text-xs">
                {activeFiltersCount}
              </Badge>)}
          </Button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-auto md:w-56 h-12 sm:h-14 bg-white border-2 border-gray-200 text-gray-700 rounded-xl sm:rounded-2xl text-sm sm:text-base hover:border-rose-300">
              <SelectValue placeholder={language === "ar" ? "ترتيب حسب" : "Sort by"}/>
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-gray-200">
              <SelectItem value="featured">{language === "ar" ? "مميز" : "Featured"}</SelectItem>
              <SelectItem value="price-low">{language === "ar" ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</SelectItem>
              <SelectItem value="price-high">{language === "ar" ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <AnimatePresence>
          {showFilters && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-white backdrop-blur-sm border-2 border-rose-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 shadow-lg">
            <div>
              <label className="text-sm font-medium mb-3 block text-gray-900">{language === "ar" ? "الجنس" : "Gender"}</label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-rose-300">
                  <SelectValue placeholder={language === "ar" ? "الكل" : "All"}/>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="Men">{language === "ar" ? "رجال" : "Men"}</SelectItem>
                  <SelectItem value="Women">{language === "ar" ? "نساء" : "Women"}</SelectItem>
                  <SelectItem value="Kids">{language === "ar" ? "أطفال" : "Kids"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-gray-900">{language === "ar" ? "الموسم" : "Season"}</label>
              <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                <SelectTrigger className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-rose-300">
                  <SelectValue placeholder={language === "ar" ? "الكل" : "All"}/>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="all">{language === "ar" ? "جميع المواسم" : "All Seasons"}</SelectItem>
                  <SelectItem value="Summer">{language === "ar" ? "صيف" : "Summer"}</SelectItem>
                  <SelectItem value="Winter">{language === "ar" ? "شتاء" : "Winter"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-gray-900">{language === "ar" ? "النمط" : "Style"}</label>
              <Select value={styleFilter} onValueChange={setStyleFilter}>
                <SelectTrigger className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-rose-300">
                  <SelectValue placeholder={language === "ar" ? "الكل" : "All"}/>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="all">{language === "ar" ? "جميع الأنماط" : "All Styles"}</SelectItem>
                  <SelectItem value="Plain">{language === "ar" ? "عادي" : "Plain"}</SelectItem>
                  <SelectItem value="Graphic">{language === "ar" ? "مطبوع/مزخرف" : "Graphic/Patterned"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-gray-900">{language === "ar" ? "المناسبة" : "Occasion"}</label>
              <Select value={occasionFilter} onValueChange={setOccasionFilter}>
                <SelectTrigger className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-rose-300">
                  <SelectValue placeholder={language === "ar" ? "الكل" : "All"}/>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="all">{language === "ar" ? "جميع المناسبات" : "All Occasions"}</SelectItem>
                  <SelectItem value="Casual">{language === "ar" ? "عادي" : "Casual"}</SelectItem>
                  <SelectItem value="Sports">{language === "ar" ? "رياضي" : "Sports"}</SelectItem>
                  <SelectItem value="Classic">{language === "ar" ? "كلاسيكي" : "Classic"}</SelectItem>
                  <SelectItem value="Formal">{language === "ar" ? "رسمي" : "Formal"}</SelectItem>
                  <SelectItem value="Wedding">{language === "ar" ? "زفاف/مناسبات" : "Wedding/Events"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-gray-900">{language === "ar" ? "الفئة" : "Category"}</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-rose-300">
                  <SelectValue placeholder={language === "ar" ? "الكل" : "All"}/>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200">
                  <SelectItem value="all">{language === "ar" ? "جميع الفئات" : "All Categories"}</SelectItem>
                  <SelectItem value="T-Shirts">{language === "ar" ? "قمصان" : "T-Shirts"}</SelectItem>
                  <SelectItem value="Hoodies">{language === "ar" ? "هوديز" : "Hoodies"}</SelectItem>
                  <SelectItem value="Sweatshirts">{language === "ar" ? "سويت شيرت" : "Sweatshirts"}</SelectItem>
                  <SelectItem value="Jackets">{language === "ar" ? "جاكيتات" : "Jackets"}</SelectItem>
                  <SelectItem value="Pants">{language === "ar" ? "بناطيل" : "Pants"}</SelectItem>
                  <SelectItem value="Shorts">{language === "ar" ? "شورتات" : "Shorts"}</SelectItem>
                  <SelectItem value="Tank Tops">{language === "ar" ? "قمصان بدون أكمام" : "Tank Tops"}</SelectItem>
                  <SelectItem value="Polo Shirts">{language === "ar" ? "قمصان بولو" : "Polo Shirts"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>)}
        </AnimatePresence>

        
        {activeFiltersCount > 0 && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3 mb-8">
            {genderFilter !== "all" && (<Badge className="px-4 py-2 bg-rose-50 text-rose-700 border-2 border-rose-200 rounded-full hover:bg-rose-100 transition-all">
                {genderFilter}
                <button onClick={() => setGenderFilter("all")} className="ml-2 hover:text-rose-600">
                  <X className="h-3 w-3"/>
                </button>
              </Badge>)}
            {seasonFilter !== "all" && (<Badge className="px-4 py-2 bg-rose-50 text-rose-700 border-2 border-rose-200 rounded-full hover:bg-rose-100 transition-all">
                {seasonFilter}
                <button onClick={() => setSeasonFilter("all")} className="ml-2 hover:text-rose-600">
                  <X className="h-3 w-3"/>
                </button>
              </Badge>)}
            {styleFilter !== "all" && (<Badge className="px-4 py-2 bg-rose-50 text-rose-700 border-2 border-rose-200 rounded-full hover:bg-rose-100 transition-all">
                {styleFilter}
                <button onClick={() => setStyleFilter("all")} className="ml-2 hover:text-rose-600">
                  <X className="h-3 w-3"/>
                </button>
              </Badge>)}
            {occasionFilter !== "all" && (<Badge className="px-4 py-2 bg-rose-50 text-rose-700 border-2 border-rose-200 rounded-full hover:bg-rose-100 transition-all">
                {occasionFilter}
                <button onClick={() => setOccasionFilter("all")} className="ml-2 hover:text-rose-600">
                  <X className="h-3 w-3"/>
                </button>
              </Badge>)}
            {categoryFilter !== "all" && (<Badge className="px-4 py-2 bg-rose-50 text-rose-700 border-2 border-rose-200 rounded-full hover:bg-rose-100 transition-all">
                {categoryFilter}
                <button onClick={() => setCategoryFilter("all")} className="ml-2 hover:text-rose-600">
                  <X className="h-3 w-3"/>
                </button>
              </Badge>)}
          </motion.div>)}

        
        <div className="mb-6">
          <p className="text-base text-gray-600">
            {isLoading
            ? (language === "ar" ? "جاري التحميل..." : "Loading...")
            : language === "ar"
                ? `عرض ${products.length} ${products.length === 1 ? "منتج" : "منتج"}`
                : totalCount > 0
                    ? `Showing ${products.length} of ${totalCount} ${totalCount === 1 ? "product" : "products"}`
                    : `Showing ${products.length} ${products.length === 1 ? "product" : "products"}`}
          </p>
        </div>

        
        {isLoading ? (<ProductGridSkeleton count={10}/>) : (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {products.map((product, index) => {
                const productId = product._id || product.id || `product-${index}`;
                return (<motion.div key={productId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.03 }}>
              <div className="relative">
                <Link href={`/products/${productId}`}>
                  <Card className="group overflow-hidden bg-white backdrop-blur-sm border-2 border-gray-200 hover:bg-white hover:border-rose-300 hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl cursor-pointer h-full flex flex-col">
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 relative">
                      <Image src={product.image || "/placeholder-logo.png"} alt={product.name} width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={(e) => {
                        const target = e.target;
                        if (target.src !== "/placeholder-logo.png") {
                            target.src = "/placeholder-logo.png";
                        }
                    }}/>
                      <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Badge className="text-xs sm:text-sm bg-rose-500 text-white border-0 rounded-full px-2 sm:px-3 py-1">
                          {product.gender}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className={`absolute top-2 right-2 sm:top-3 sm:right-3 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 hover:bg-white border-2 shadow-md z-10 transition-all ${favoriteIds.has(product._id || product.id?.toString() || "")
                        ? "border-rose-500 bg-rose-50"
                        : "border-gray-200 hover:border-rose-300"}`} onClick={(e) => handleToggleFavorite(product, e)} disabled={loadingFavorites.has(product._id || product.id?.toString() || "")}>
                        <Heart fill={favoriteIds.has(product._id || product.id?.toString() || "") ? "currentColor" : "none"} className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${favoriteIds.has(product._id || product.id?.toString() || "")
                        ? "text-rose-500"
                        : "text-gray-600 hover:text-rose-500"}`}/>
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
                      {product.onSale && product.salePercentage ? (<div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                              {language === "ar" ? `خصم ${product.salePercentage}%` : `${product.salePercentage}% OFF`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base text-gray-400 line-through">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-base sm:text-lg md:text-xl font-bold text-rose-600">
                              {formatPrice(product.price * (1 - (product.salePercentage || 0) / 100))}
                            </span>
                          </div>
                        </div>) : (<p className="text-base sm:text-lg md:text-xl font-bold text-rose-600">{formatPrice(product.price)}</p>)}
                      <Button size="sm" className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full text-xs sm:text-sm font-semibold h-8 sm:h-9" onClick={(e) => handleAddToCart(product, e)}>
                        <ShoppingBag className="mr-1.5 h-3 w-3 sm:h-4 sm:w-4"/>
                        {language === "ar" ? "أضف للسلة" : "Add to Cart"}
                      </Button>
                    </div>
                  </CardContent>
                  </Card>
                </Link>
              </div>
            </motion.div>);
            })}
          </div>)}

        {!isLoading && totalPages > 1 && products.length > 0 && (<div className="mt-10 flex justify-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 text-gray-700 hover:border-rose-300" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4"/>
              </Button>

              {paginationPages.showStartEllipsis && (<>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 text-gray-700 hover:border-rose-300" onClick={() => setCurrentPage(1)}>
                    1
                  </Button>
                  <span className="px-1 text-gray-400">...</span>
                </>)}

              {paginationPages.pages.map((page) => (<Button key={page} variant="outline" size="sm" className={page === currentPage
                    ? "h-9 w-9 p-0 bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                    : "h-9 w-9 p-0 border-gray-200 text-gray-700 hover:border-rose-300"} onClick={() => setCurrentPage(page)} aria-current={page === currentPage ? "page" : undefined}>
                  {page}
                </Button>))}

              {paginationPages.showEndEllipsis && (<>
                  <span className="px-1 text-gray-400">...</span>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 text-gray-700 hover:border-rose-300" onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </Button>
                </>)}

              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 text-gray-700 hover:border-rose-300" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} aria-label="Next page">
                <ChevronRight className="h-4 w-4"/>
              </Button>
            </div>
          </div>)}

        {!isLoading && products.length === 0 && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <p className="text-gray-600 mb-6 text-lg">
              {language === "ar"
                ? "لم يتم العثور على منتجات تطابق معاييرك."
                : "No products found matching your criteria."}
            </p>
            <Button variant="outline" onClick={() => {
                setCategoryFilter("all");
                setGenderFilter("all");
                setSeasonFilter("all");
                setStyleFilter("all");
                setOccasionFilter("all");
                setSearchQuery("");
            }} className="h-12 px-8 bg-white border-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 rounded-full transition-all">
              {language === "ar" ? "مسح جميع الفلاتر" : "Clear All Filters"}
            </Button>
          </motion.div>)}
      </div>
    </div>);
}

export default function ProductsPage() {
    return (<Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ProductsPageContent />
    </Suspense>);
}
