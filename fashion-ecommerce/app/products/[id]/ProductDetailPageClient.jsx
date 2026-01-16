"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Minus, Plus, Heart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { getProductById, listProducts } from "@/lib/api/products";
import { useLanguage } from "@/lib/language";
import { useRegion } from "@/lib/region";
import { useRouter } from "next/navigation";
import { ProductDetailSkeleton, ProductGridSkeleton } from "@/components/skeletons";
import { favoritesApi } from "@/lib/api/favorites";
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const defaultColors = ["White", "Black", "Gray", "Navy"];
const features = ["100% Premium Cotton", "Pre-shrunk fabric", "Reinforced seams", "Tagless for comfort", "Machine washable"];
const description = "Premium cotton t-shirt with a classic fit. Perfect for everyday wear or as a canvas for your custom designs.";
export default function ProductDetailPageClient() {
    const params = useParams();
    const productIdParam = params.id;
    const productId = productIdParam ? (isNaN(Number(productIdParam)) ? productIdParam : Number(productIdParam)) : null;
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState("M");
    const [selectedColor, setSelectedColor] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
    const [productNotFound, setProductNotFound] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const { toast } = useToast();
    const { addItem } = useCart();
    const { isAuthenticated, user } = useAuth();
    const { language } = useLanguage();
    const { formatPrice } = useRegion();
    const router = useRouter();
    useEffect(() => {
        if (!productId)
            return;
        const load = async () => {
            setIsLoading(true);
            setProductNotFound(false);
            setSelectedImage(0);
            setLoadError(null);
            try {
                const p = await getProductById(productId);
                if (p) {
                    setProduct(p);
                    setLoadError(null);
                }
                else {
                    setProductNotFound(true);
                    setProduct(null);
                    setLoadError(null);
                }
            }
            catch (error) {
                console.error("Error loading product:", error);
                if (error?.status === 404 || error?.message?.includes("not found") || error?.errorMessage?.includes("not found")) {
                    setProductNotFound(true);
                    setProduct(null);
                    setLoadError(null);
                }
                else {
                    setLoadError("Failed to load product. Please try again.");
                    setProduct(null);
                }
            }
            finally {
                setIsLoading(false);
            }
        };
        load();
    }, [productId]);
    useEffect(() => {
        if (!isAuthenticated || !user || !product) {
            setIsFavorite(false);
            return;
        }
        const productId = product._id || product.id?.toString();
        if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
            setIsFavorite(false);
            return;
        }
        const checkFavorite = async () => {
            try {
                const favoriteStatus = await favoritesApi.checkFavorite(productId);
                setIsFavorite(favoriteStatus);
            }
            catch (error) {
                console.error("Failed to check favorite:", error);
                setIsFavorite(false);
            }
        };
        checkFavorite();
    }, [product, isAuthenticated, user]);
    const handleToggleFavorite = async () => {
        if (loadError || !product)
            return;
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
        if (!product)
            return;
        const productId = product._id || product.id?.toString();
        if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
            toast({
                title: "Error",
                description: language === "ar" ? "معرف المنتج غير صحيح" : "Invalid product ID",
                variant: "destructive",
            });
            return;
        }
        setIsLoadingFavorite(true);
        try {
            const nextIsFavorite = !isFavorite;
            if (isFavorite) {
                await favoritesApi.removeFavorite(productId);
            }
            else {
                await favoritesApi.addFavorite(productId);
            }
            setIsFavorite(nextIsFavorite);
            toast({
                title: nextIsFavorite
                    ? (language === "ar" ? "تمت الإضافة" : "Added to favorites")
                    : (language === "ar" ? "تم الحذف" : "Removed from favorites"),
                description: nextIsFavorite
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
            setIsLoadingFavorite(false);
        }
    };
    useEffect(() => {
        if (!product)
            return;
        const loadRelated = async () => {
            setIsLoadingRelated(true);
            try {
                const related = await listProducts({
                    category: product.category,
                    gender: product.gender,
                });
                const filtered = related
                    .filter((p) => {
                    const pId = p._id || p.id?.toString() || "";
                    const currentId = product._id || product.id?.toString() || "";
                    return pId !== currentId;
                })
                    .slice(0, 8);
                setRelatedProducts(filtered);
            }
            catch (error) {
                console.error("Error loading related products:", error);
            }
            finally {
                setIsLoadingRelated(false);
            }
        };
        loadRelated();
    }, [product]);
    useEffect(() => {
        if (!product)
            return;
        const productColors = product.colors && product.colors.length > 0
            ? product.colors
            : defaultColors;
        if (productColors.length > 0 && !selectedColor) {
            setSelectedColor(productColors[0]);
        }
    }, [product, selectedColor]);
    useEffect(() => {
        if (product) {
            setSelectedImage(0);
        }
    }, [product]);
    const handleAddToCart = async () => {
        if (!product || loadError)
            return;
        if (!isAuthenticated || !user) {
            toast({
                title: "Sign in required",
                description: "Please sign in or create an account to add items to your cart",
                variant: "default",
            });
            setTimeout(() => {
                router.push("/login");
            }, 1500);
            return;
        }
        try {
            setIsAddingToCart(true);
            const prodId = product._id || product.id?.toString() || "";
            const salePercentage = product.salePercentage || 0;
            const finalPrice = product.onSale && salePercentage > 0
                ? product.price * (1 - salePercentage / 100)
                : product.price;
            await addItem({
                id: `${prodId}-${selectedSize}-${selectedColor}`,
                name: product.name,
                price: finalPrice,
                quantity,
                size: selectedSize,
                color: selectedColor,
                image: product.image,
                isCustom: false,
            });
            toast({
                title: "Added to cart",
                description: `${quantity}x ${product.name} (${selectedSize}, ${selectedColor})`,
            });
        }
        catch (error) {
            if (error.name === "AuthenticationRequired" || error.message === "AUTHENTICATION_REQUIRED") {
                toast({
                    title: "Sign in required",
                    description: "Please sign in or create an account to add items to your cart",
                    variant: "default",
                });
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to add item to cart. Please try again.",
                    variant: "destructive",
                });
            }
        }
        finally {
            setIsAddingToCart(false);
        }
    };
    if (isLoading) {
        return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-24">
        <ProductDetailSkeleton />
      </div>);
    }
    if (loadError) {
        return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-4">⚠️</div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {language === "ar" ? "حدث خطأ أثناء تحميل المنتج" : "Error Loading Product"}
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8">
                {language === "ar" ? "تعذر تحميل بيانات المنتج حالياً. يرجى المحاولة مرة أخرى." : loadError}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => router.refresh()} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full font-semibold px-8 py-6 text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-rose-200">
                  {language === "ar" ? "إعادة المحاولة" : "Try Again"}
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/products")} className="border-gray-300 bg-white hover:bg-rose-50 hover:border-rose-300 rounded-full font-semibold px-8 py-6 text-lg transition-all duration-300">
                  {language === "ar" ? "العودة للمنتجات" : "Back to Products"}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>);
    }
    if (productNotFound || !product) {
        return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-4">😕</div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {language === "ar" ? "المنتج غير موجود" : "Product Not Found"}
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8">
                {language === "ar"
                ? "عذراً، المنتج الذي تبحث عنه غير موجود أو تم حذفه."
                : "Sorry, the product you're looking for doesn't exist or has been removed."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => router.push("/products")} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full font-semibold px-8 py-6 text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-rose-200">
                  {language === "ar" ? "عرض جميع المنتجات" : "View All Products"}
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/")} className="border-gray-300 bg-white hover:bg-rose-50 hover:border-rose-300 rounded-full font-semibold px-8 py-6 text-lg transition-all duration-300">
                  {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>);
    }
    const productData = product;
    const allImages = productData.image
        ? [productData.image, ...(productData.images || [])]
        : [productData.image];
    const images = allImages.filter(img => img && img.trim() !== "");
    const productColors = productData.colors && productData.colors.length > 0
        ? productData.colors
        : defaultColors;
    const actionsDisabled = !product || !!loadError;
    return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
        
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 md:mb-8 px-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-rose-600 transition-colors">
            {language === "ar" ? "الرئيسية" : "Home"}
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/products" className="hover:text-rose-600 transition-colors">
            {language === "ar" ? "المنتجات" : "Products"}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium truncate max-w-[150px] sm:max-w-xs">{productData.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 max-w-7xl mx-auto">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-3 md:space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-white border-2 border-gray-200 relative shadow-xl">
              <Image src={images[selectedImage] || "/placeholder-logo.png"} alt={productData.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority onError={(e) => {
            const target = e.target;
            if (target.src !== "/placeholder-logo.png") {
                target.src = "/placeholder-logo.png";
            }
        }}/>
            </div>
            
            {images.length > 1 && (<div className="flex gap-2 md:gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#fda4af #f3f4f6' }}>
                {images.map((image, index) => (<button key={index} onClick={() => setSelectedImage(index)} className={`flex-shrink-0 aspect-square overflow-hidden rounded-lg bg-white border-2 transition-all duration-300 relative cursor-pointer ${selectedImage === index
                    ? "border-rose-500 shadow-lg shadow-rose-200 scale-105 ring-2 ring-rose-200"
                    : "border-gray-200 hover:border-rose-300 hover:shadow-md"}`} style={{ minWidth: '80px', width: '80px' }} aria-label={`${language === "ar" ? "عرض الصورة" : "View image"} ${index + 1}`}>
                    <Image src={image || "/placeholder-logo.png"} alt={`${productData.name} ${language === "ar" ? "صورة" : "image"} ${index + 1}`} fill className="object-cover" sizes="80px"/>
                  </button>))}
              </div>)}
          </motion.div>

          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-5 md:space-y-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wider">{productData.category}</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 text-gray-900 tracking-tight">{productData.name}</h1>
              {productData.onSale && productData.salePercentage ? (<div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-500 text-white text-sm sm:text-base px-3 py-1">
                      {language === "ar" ? `خصم ${productData.salePercentage}%` : `${productData.salePercentage}% OFF`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg sm:text-xl md:text-2xl text-gray-400 line-through">
                      {formatPrice(productData.price)}
                    </span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                      {formatPrice(productData.price * (1 - (productData.salePercentage || 0) / 100))}
                    </span>
                  </div>
                </div>) : (<p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">{formatPrice(productData.price)}</p>)}
            </div>

            <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base">{description || "Premium cotton t-shirt with a classic fit. Perfect for everyday wear or as a canvas for your custom designs."}</p>

            
            {productData.sizes && productData.sizes.length > 0 ? (<div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                  {language === "ar" ? "الحجم" : "Size"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {productData.sizes.map((size) => (<button key={size} onClick={() => setSelectedSize(size)} className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg transition-all duration-300 ${selectedSize === size
                    ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200"
                    : "border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50"}`}>
                      {size}
                    </button>))}
                </div>
              </div>) : (<div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                  {language === "ar" ? "الحجم" : "Size"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (<button key={size} onClick={() => setSelectedSize(size)} className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg transition-all duration-300 ${selectedSize === size
                    ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200"
                    : "border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50"}`}>
                      {size}
                    </button>))}
                </div>
              </div>)}

            
            {productColors.length > 0 && (<div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                  {language === "ar" ? "اللون" : "Color"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {productColors.map((color) => (<button key={color} onClick={() => setSelectedColor(color)} className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg transition-all duration-300 ${selectedColor === color
                    ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200"
                    : "border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50"}`}>
                      {color}
                    </button>))}
                </div>
              </div>)}

            
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                {language === "ar" ? "الكمية" : "Quantity"}
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="border-gray-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-gray-700 h-9 w-9 sm:h-10 sm:w-10">
                  <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                </Button>
                <span className="text-sm sm:text-base md:text-lg font-semibold w-10 sm:w-12 text-center text-gray-900">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)} className="border-gray-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-gray-700 h-9 w-9 sm:h-10 sm:w-10">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                </Button>
              </div>
            </div>

            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button size="lg" className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full font-semibold h-11 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-rose-200" onClick={handleAddToCart} disabled={actionsDisabled}>
                <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
                {language === "ar" ? "أضف للسلة" : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`border-gray-300 bg-white hover:bg-rose-50 rounded-full h-11 sm:h-12 md:h-14 w-full sm:w-auto px-4 sm:px-5 transition-all flex items-center justify-center gap-2 text-sm sm:text-base font-semibold ${isFavorite ? "border-rose-500 bg-rose-50 text-rose-600" : "hover:border-rose-300 text-gray-700"}`}
                onClick={handleToggleFavorite}
                disabled={isLoadingFavorite || actionsDisabled}
              >
                {isLoadingFavorite ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin"/>
                ) : (
                  <Heart fill={isFavorite ? "currentColor" : "none"} className="h-4 w-4 sm:h-5 sm:w-5"/>
                )}
                {isFavorite
                  ? (language === "ar" ? "مفضلة" : "Favorited")
                  : (language === "ar" ? "مفضل" : "Favorite")}
              </Button>
            </div>

            
            <Card className="p-4 sm:p-5 md:p-6 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl shadow-lg">
              <h3 className="font-semibold mb-3 sm:mb-4 text-gray-900 text-base sm:text-lg">
                {language === "ar" ? "مميزات المنتج" : "Product Features"}
              </h3>
              <ul className="space-y-2 sm:space-y-2.5">
                {features.map((feature, index) => (<li key={index} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-gray-600">
                    <span className="text-rose-500 mt-1 sm:mt-1.5">•</span>
                    <span>{feature}</span>
                  </li>))}
              </ul>
            </Card>
          </motion.div>
        </div>

        
        {relatedProducts.length > 0 && (<div className="mt-16 md:mt-20 lg:mt-24 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                {language === "ar" ? "منتجات مشابهة" : "You May Also Like"}
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                {language === "ar"
                ? "اكتشف المزيد من المنتجات التي قد تعجبك"
                : "Discover more products you might like"}
              </p>
            </motion.div>

            {isLoadingRelated ? (<ProductGridSkeleton count={4}/>) : (<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {relatedProducts.map((relatedProduct, index) => {
                    const relatedProductId = relatedProduct._id || relatedProduct.id || `product-${index}`;
                    return (<motion.div key={relatedProductId} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -8, transition: { duration: 0.3 } }}>
                      <Link href={`/products/${relatedProductId}`}>
                        <Card className="group overflow-hidden bg-white border-2 border-gray-200 hover:border-rose-300 hover:shadow-xl transition-all duration-500 rounded-2xl h-full flex flex-col shadow-lg">
                          <div className="aspect-square overflow-hidden bg-white relative">
                            <Image src={relatedProduct.image || "/placeholder-logo.png"} alt={relatedProduct.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                            <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
                              {relatedProduct.gender && (<Badge className="text-xs bg-rose-500 text-white border-0 rounded-full px-3 py-1">
                                  {relatedProduct.gender}
                                </Badge>)}
                              {relatedProduct.season && (<Badge className="text-xs bg-rose-500 text-white border-0 rounded-full px-3 py-1">
                                  {relatedProduct.season}
                                </Badge>)}
                            </div>
                          </div>
                          <CardContent className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
                            <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{relatedProduct.category}</div>
                            <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1.5 sm:mb-2 text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2 flex-1">
                              {relatedProduct.name}
                            </h3>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                                {formatPrice(relatedProduct.price)}
                              </div>
                              <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={async (e) => {
                            e.preventDefault();
                            if (!isAuthenticated || !user) {
                                toast({
                                    title: "Sign in required",
                                    description: "Please sign in or create an account to add items to your cart",
                                    variant: "default",
                                });
                                setTimeout(() => {
                                    router.push("/login");
                                }, 1500);
                                return;
                            }
                            try {
                                const prodId = relatedProduct._id || relatedProduct.id?.toString() || "";
                                await addItem({
                                    id: `${prodId}-M-White`,
                                    name: relatedProduct.name,
                                    price: relatedProduct.price,
                                    quantity: 1,
                                    size: "M",
                                    color: "White",
                                    image: relatedProduct.image,
                                    isCustom: false,
                                });
                                toast({
                                    title: "Added to cart",
                                    description: `${relatedProduct.name} added to cart`,
                                });
                            }
                            catch (error) {
                                if (error.name === "AuthenticationRequired" || error.message === "AUTHENTICATION_REQUIRED") {
                                    toast({
                                        title: "Sign in required",
                                        description: "Please sign in or create an account to add items to your cart",
                                        variant: "default",
                                    });
                                    setTimeout(() => {
                                        router.push("/login");
                                    }, 1500);
                                }
                                else {
                                    toast({
                                        title: "Error",
                                        description: "Failed to add item to cart. Please try again.",
                                        variant: "destructive",
                                    });
                                }
                            }
                        }}>
                                <ShoppingBag className="h-4 w-4"/>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>);
                })}
              </div>)}
          </div>)}
      </div>
    </div>);
}
