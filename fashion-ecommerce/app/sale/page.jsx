"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listProducts } from "@/lib/api/products";
import { useRegion } from "@/lib/region";
import { useLanguage } from "@/lib/language";
import { ProductGridSkeleton } from "@/components/skeletons";
import { ProfessionalNavbar } from "@/components/professional-navbar";
import { Tag } from "lucide-react";
export default function SalePage() {
    const { formatPrice } = useRegion();
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState([]);
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const saleProducts = await listProducts({ onSale: true });
                setProducts(saleProducts);
            }
            catch (error) {
                console.error("Error loading sale products:", error);
                setProducts([]);
            }
            finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);
    return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white">
      <ProfessionalNavbar />
      
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-8 sm:py-12 pt-24 sm:pt-28">
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-8 sm:mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Tag className="h-8 w-8 sm:h-10 sm:w-10 text-rose-500"/>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
              {language === "ar" ? (<>
                  <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">التخفيضات</span> الحصرية
                </>) : (<>
                  Exclusive <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">Sales</span>
                </>)}
            </h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            {language === "ar"
            ? "استفد من أفضل العروض والخصومات على منتجاتنا المميزة"
            : "Take advantage of the best offers and discounts on our premium products"}
          </p>
        </motion.div>

        
        {isLoading ? (<ProductGridSkeleton count={10}/>) : products.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {products.map((product, index) => {
                const productId = product._id || product.id || `product-${index}`;
                const salePercentage = product.salePercentage || 0;
                const originalPrice = product.price;
                const salePrice = originalPrice * (1 - salePercentage / 100);
                return (<motion.div key={productId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.03 }}>
                  <Link href={`/products/${productId}`}>
                    <Card className="group overflow-hidden bg-white backdrop-blur-sm border-2 border-gray-200 hover:bg-white hover:border-rose-300 hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl cursor-pointer h-full flex flex-col">
                      <div className="aspect-square overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 relative">
                        <Image src={product.image || "/placeholder-logo.png"} alt={product.name} width={300} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
                        
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                          <Badge className="bg-red-500 text-white border-0 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold shadow-lg">
                            {language === "ar" ? `خصم ${salePercentage}%` : `${salePercentage}% OFF`}
                          </Badge>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                      </div>
                      <CardContent className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
                        <div className="mb-2">
                          <p className="text-xs sm:text-sm text-rose-500 line-clamp-1 font-medium">{product.category}</p>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 text-sm sm:text-base md:text-lg group-hover:text-rose-600 transition-colors flex-1 leading-tight">
                          {product.name}
                        </h3>
                        <div className="mt-auto space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-400 line-through">
                              {formatPrice(originalPrice)}
                            </span>
                          </div>
                          <p className="text-base sm:text-lg md:text-xl font-bold text-rose-600">
                            {formatPrice(salePrice)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>);
            })}
          </div>) : (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 sm:py-16 md:py-20">
            <p className="text-lg sm:text-xl text-gray-600">
              {language === "ar"
                ? "لا توجد منتجات في التخفيضات حالياً"
                : "No products on sale at the moment"}
            </p>
            <Link href="/products">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-6 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg">
                {language === "ar" ? "تصفح جميع المنتجات" : "Browse All Products"}
              </motion.button>
            </Link>
          </motion.div>)}
      </div>
    </div>);
}
