"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Trash2, Edit, Grid3x3, List, Plus, Loader2 } from "lucide-react";
import { designsApi } from "@/lib/api/designs";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import { ProfessionalNavbar } from "@/components/professional-navbar";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language";

const LOCAL_DESIGNS_KEY = "fashionhub_simple_studio_designs";
const getLocalDesignsKey = (user) => {
    const userKey = user?._id || user?.id || user?.email || "guest";
    return `${LOCAL_DESIGNS_KEY}:${userKey}`;
};
const mergeUniqueDesigns = (primary, incoming) => {
    const seen = new Set(primary.map((design) => String(design.id)));
    const merged = [...primary];
    incoming.forEach((design) => {
        const key = String(design.id);
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(design);
        }
    });
    return merged;
};
const migrateLocalDesigns = (key) => {
    try {
        const oldRaw = localStorage.getItem(LOCAL_DESIGNS_KEY);
        if (!oldRaw)
            return;
        const oldParsed = JSON.parse(oldRaw);
        if (!Array.isArray(oldParsed) || oldParsed.length === 0) {
            localStorage.removeItem(LOCAL_DESIGNS_KEY);
            return;
        }
        const newRaw = localStorage.getItem(key);
        const newParsed = newRaw ? JSON.parse(newRaw) : [];
        const next = Array.isArray(newParsed)
            ? mergeUniqueDesigns(newParsed, oldParsed)
            : oldParsed;
        localStorage.setItem(key, JSON.stringify(next));
        localStorage.removeItem(LOCAL_DESIGNS_KEY);
    }
    catch {
    }
};

const parseLocalDesigns = (key) => {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.map((design) => ({
            _id: design.id,
            name: design.name || "My design",
            thumbnail: design.thumbnail || "",
            createdAt: design.createdAt || new Date().toISOString(),
            updatedAt: design.createdAt || new Date().toISOString(),
            baseProduct: {
                type: design.data?.selectedProduct || "Product",
            },
            status: "draft",
            isLocal: true,
            isFavorite: Boolean(design.isFavorite),
        }));
    }
    catch {
        return [];
    }
};

const removeLocalDesign = (key, designId) => {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) {
            return [];
        }
        const next = parsed.filter((design) => String(design.id) !== String(designId));
        localStorage.setItem(key, JSON.stringify(next));
        return next;
    }
    catch {
        return [];
    }
};
export default function MyDesignsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { addItem } = useCart();
    const { language } = useLanguage();
    const [designs, setDesigns] = useState([]);
    const [localDesigns, setLocalDesigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
                return;
            }
            loadDesigns();
        }
    }, [user, authLoading]);
    const loadDesigns = async () => {
        setIsLoading(true);
        try {
            const data = await designsApi.getMyDesigns();
            setDesigns(data);
        }
        catch (error) {
            logger.error("Failed to load designs:", error);
            toast({
                title: "Error",
                description: "Failed to load designs",
                variant: "destructive",
            });
        }
        finally {
            const key = getLocalDesignsKey(user);
            migrateLocalDesigns(key);
            setLocalDesigns(parseLocalDesigns(key));
            setIsLoading(false);
        }
    };
    const deleteDesign = async (id) => {
        if (!confirm("Are you sure you want to delete this design?"))
            return;
        try {
            const target = allDesigns.find((design) => design._id === id);
            if (target?.isLocal) {
                const key = getLocalDesignsKey(user);
                removeLocalDesign(key, id);
                setLocalDesigns(parseLocalDesigns(key));
            }
            else {
                await designsApi.deleteDesign(id);
                setDesigns(designs.filter((d) => d._id !== id));
            }
            toast({
                title: "Design deleted",
                description: "Your design has been deleted successfully",
            });
        }
        catch (error) {
            logger.error("Failed to delete design:", error);
            toast({
                title: "Error",
                description: "Failed to delete design",
                variant: "destructive",
            });
        }
    };
    const allDesigns = useMemo(() => {
        const merged = [...designs];
        localDesigns.forEach((localDesign) => {
            if (!merged.some((design) => design._id === localDesign._id)) {
                merged.push(localDesign);
            }
        });
        return merged;
    }, [designs, localDesigns]);
    const filteredDesigns = allDesigns.filter((design) => {
        const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            design.baseProduct?.type?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });
    const getDesignLink = (design) =>
        design.isLocal ? `/studio?localDesign=${design._id}` : `/studio?design=${design._id}`;
    const handleOrderDesign = async (design, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (design.isLocal) {
            toast({
                title: language === "ar" ? "احفظ التصميم أولاً" : "Save your design first",
                description: language === "ar"
                    ? "الطلب يتطلب حفظ التصميم بحسابك. افتح التصميم ثم احفظه."
                    : "Ordering requires saving the design to your account. Open it and save first.",
                variant: "default",
            });
            return;
        }
        try {
            const size = design.baseProduct?.size || "M";
            const color = design.baseProduct?.color || "white";
            const orderNotes = design?.designMetadata?.studio?.data?.orderNotes || "";
            const cartId = `design-${design._id}-${size}-${color}`;
            await addItem({
                id: cartId,
                name: `${design.name} (Custom)`,
                price: Number(design.price) || 39.99,
                quantity: 1,
                size,
                color,
                image: design.thumbnail || design.designImageURL || "",
                isCustom: true,
                notes: orderNotes || undefined,
                design: design._id,
                baseProductId: design.baseProductId,
                baseProduct: design.baseProduct,
                designMetadata: design.designMetadata,
                designImageURL: design.designImageURL,
            });
            toast({
                title: language === "ar" ? "تمت الإضافة للسلة" : "Added to cart",
                description: language === "ar"
                    ? `${design.name} تمت إضافته إلى السلة`
                    : `${design.name} added to cart`,
            });
        }
        catch (error) {
            if (error?.name === "AuthenticationRequired" || error?.message === "AUTHENTICATION_REQUIRED") {
                toast({
                    title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
                    description: language === "ar"
                        ? "يرجى تسجيل الدخول لإضافة التصميم إلى السلة"
                        : "Please sign in to add designs to your cart",
                    variant: "default",
                });
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
                return;
            }
            toast({
                title: "Error",
                description: error?.message || (language === "ar" ? "فشل إضافة التصميم إلى السلة" : "Failed to add design to cart"),
                variant: "destructive",
            });
        }
    };
    if (authLoading || isLoading) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      <ProfessionalNavbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Designs</h1>
          <p className="text-muted-foreground">Manage and organize your custom clothing designs</p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Designs</p>
                  <p className="text-3xl font-bold">{allDesigns.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Grid3x3 className="h-6 w-6 text-primary"/>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">This Month</p>
                  <p className="text-3xl font-bold">
                    {allDesigns.filter((d) => {
            const designDate = new Date(d.createdAt);
            const now = new Date();
            return designDate.getMonth() === now.getMonth() && designDate.getFullYear() === now.getFullYear();
        }).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-blue-600"/>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input placeholder="Search designs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
          </div>

          <div className="flex gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
              <Grid3x3 className="h-4 w-4"/>
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4"/>
            </Button>
            <Link href="/studio">
              <Button>
                <Plus className="h-4 w-4 mr-2"/>
                New Design
              </Button>
            </Link>
          </div>
        </div>


        
        {filteredDesigns.length === 0 ? (<Card>
            <CardContent className="p-12 text-center">
              <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50"/>
              <h3 className="text-xl font-semibold mb-2">No designs found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                ? "Try adjusting your search"
                : "Start creating your first custom design"}
              </p>
              <Link href="/studio">
                <Button>
                  <Plus className="h-4 w-4 mr-2"/>
                  Create New Design
                </Button>
              </Link>
            </CardContent>
          </Card>) : viewMode === "grid" ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDesigns.map((design) => (<Card key={design._id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <Image src={design.thumbnail || "/placeholder-logo.png"} alt={design.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"/>
                  {design.status === "published" && (<Badge className="absolute top-3 left-3 bg-green-500">Published</Badge>)}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link href={getDesignLink(design)}>
                      <Button size="sm" variant="secondary">
                        <Edit className="h-4 w-4 mr-1"/>
                        Edit
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary" onClick={(event) => handleOrderDesign(design, event)}>
                      <ShoppingBag className="h-4 w-4 mr-1"/>
                      Order
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{design.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{design.baseProduct?.type || "Product"}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(design.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={getDesignLink(design)}>
                        <Edit className="h-3 w-3 mr-1"/>
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteDesign(design._id)}>
                      <Trash2 className="h-3 w-3"/>
                    </Button>
                  </div>
                </CardContent>
              </Card>))}
          </div>) : (<div className="space-y-4">
            {filteredDesigns.map((design) => (<Card key={design._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                      <Image src={design.thumbnail || "/placeholder-logo.png"} alt={design.name} fill className="object-cover" sizes="128px"/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{design.name}</h3>
                          <p className="text-sm text-muted-foreground">{design.baseProduct?.type || "Product"}</p>
                        </div>
                        {design.status === "published" && (<Badge className="bg-green-500">Published</Badge>)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>Created: {new Date(design.createdAt).toLocaleDateString()}</span>
                        <span>Modified: {new Date(design.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={getDesignLink(design)}>
                          <Button size="sm">
                            <Edit className="h-4 w-4 mr-1"/>
                            Edit Design
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={(event) => handleOrderDesign(design, event)}>
                          <ShoppingBag className="h-4 w-4 mr-1"/>
                          Order
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => deleteDesign(design._id)}>
                          <Trash2 className="h-4 w-4 mr-1"/>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>))}
          </div>)}
      </div>
    </div>);
}
