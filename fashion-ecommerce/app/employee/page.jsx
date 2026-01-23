"use client";
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, LayoutDashboard, Package, ShoppingCart, Users, Eye, Edit, CheckCircle, Clock, Truck, Printer, PackageCheck, Languages, MessageSquare, } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth";
import { ordersApi } from "@/lib/api/orders";
import { userPreferencesApi } from "@/lib/api/userPreferences";
import { adminApi } from "@/lib/api/admin";
import { productsAdminApi } from "@/lib/api/productsAdmin";
import { studioProductsApi } from "@/lib/api/studioProducts";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/language";
import { sanitizeExternalUrl } from "@/lib/api";
import { t } from "@/lib/i18n";
import { Trash2, Plus, Upload, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { AppLoader } from "@/components/ui/app-loader";
import { StaffChatPanel } from "@/components/staff-chat-panel";
import { StaffChatWidget } from "@/components/staff-chat-widget";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { getNotifications, markAllAsRead } from "@/lib/api/notifications";
import { staffChatApi } from "@/lib/api/staffChat";
const getStatusColor = (status) => {
    switch (status) {
        case "pending":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        case "processing":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "shipped":
            return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
        case "delivered":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "cancelled":
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        default:
            return "bg-gray-100 text-gray-800";
    }
};
const COLOR_OPTIONS = [
    { id: "white", value: "#ffffff", label: { en: "White", ar: "أبيض" }, needsBorder: true },
    { id: "black", value: "#111111", label: { en: "Black", ar: "أسود" } },
    { id: "navy", value: "#1f2a44", label: { en: "Navy", ar: "كحلي" } },
    { id: "gray", value: "#b6b6b6", label: { en: "Gray", ar: "رمادي" } },
    { id: "blue", value: "#5aa7e0", label: { en: "Blue", ar: "أزرق" } },
    { id: "charcoal", value: "#4a4a4a", label: { en: "Charcoal", ar: "فحمي" } },
    { id: "green", value: "#4fa884", label: { en: "Green", ar: "أخضر" } },
    { id: "peach", value: "#f2b6a0", label: { en: "Peach", ar: "خوخي" } },
    { id: "pink", value: "#f2a8c7", label: { en: "Pink", ar: "وردي" } },
    { id: "burgundy", value: "#722F37", label: { en: "Burgundy", ar: "عنابي" } },
    { id: "olive", value: "#556B2F", label: { en: "Olive", ar: "زيتي" } },
    { id: "cream", value: "#FFFDD0", label: { en: "Cream", ar: "كريمي" }, needsBorder: true },
    { id: "lavender", value: "#E6E6FA", label: { en: "Lavender", ar: "لافندر" }, needsBorder: true },
    { id: "beige", value: "#f5f5dc", label: { en: "Beige", ar: "بيج" }, needsBorder: true },
    { id: "brown", value: "#8b5e3c", label: { en: "Brown", ar: "بني" } },
    { id: "red", value: "#ef4444", label: { en: "Red", ar: "أحمر" } },
    { id: "yellow", value: "#facc15", label: { en: "Yellow", ar: "أصفر" } },
    { id: "orange", value: "#f97316", label: { en: "Orange", ar: "برتقالي" } },
    { id: "purple", value: "#8b5cf6", label: { en: "Purple", ar: "بنفسجي" } },
    { id: "teal", value: "#14b8a6", label: { en: "Teal", ar: "تركوازي" } },
    { id: "cyan", value: "#06b6d4", label: { en: "Cyan", ar: "سماوي" } },
];
const normalizeColorKey = (value) => value.trim().toLowerCase();
const parseColorList = (value) => value.split(",").map((color) => color.trim()).filter(Boolean);
const resolveImageUrl = (value) => {
    if (!value)
        return "";
    if (typeof value === "string")
        return sanitizeExternalUrl(value);
    if (value && typeof value === "object") {
        const candidate = value.url || value.secure_url || value.path;
        return typeof candidate === "string" ? sanitizeExternalUrl(candidate) : "";
    }
    return "";
};
const resolveStockValue = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 100;
};
export default function EmployeeDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studioProducts, setStudioProducts] = useState([]);
    const [studioLoading, setStudioLoading] = useState(false);
    const [showStudioModal, setShowStudioModal] = useState(false);
    const [editingStudio, setEditingStudio] = useState(null);
    const [studioForm, setStudioForm] = useState({
        name: "",
        type: "",
        description: "",
        baseMockupUrl: "",
        viewMockups: { front: "", back: "" },
        colorMockups: {},
        colorViews: {},
        price: "",
        colors: "",
        sizes: "",
        active: true,
        aiEnhanceEnabled: false,
        designAreas: {
            front: { x: 0.18, y: 0.2, width: 0.64, height: 0.55 },
            back: { x: 0.18, y: 0.2, width: 0.64, height: 0.55 },
        },
        safeArea: { x: 60, y: 80, width: 280, height: 300 },
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [designPreviewItem, setDesignPreviewItem] = useState(null);
    const [designPreviewSide, setDesignPreviewSide] = useState("front");
    const [studioPreviewProducts, setStudioPreviewProducts] = useState({});

    const defaultPreviewAreas = {
        front: { top: "30%", left: "30%", width: "40%", height: "22%" },
        back: { top: "30%", left: "30%", width: "40%", height: "22%" },
    };
    const resolvePreviewArea = (studioProduct, side) => {
        const fallback = defaultPreviewAreas[side] || defaultPreviewAreas.front;
        const raw = studioProduct?.designAreas?.[side];
        if (!raw || typeof raw !== "object")
            return fallback;
        const top = Number(raw.y);
        const left = Number(raw.x);
        const width = Number(raw.width);
        const height = Number(raw.height);
        if ([top, left, width, height].some((val) => Number.isNaN(val)))
            return fallback;
        return {
            top: `${top * 100}%`,
            left: `${left * 100}%`,
            width: `${width * 100}%`,
            height: `${height * 100}%`,
        };
    };
    const resolvePreviewBaseImage = (item, studioProduct, side) => {
        const viewMockups = studioProduct?.viewMockups || {};
        if (side === "back") {
            return viewMockups.back || studioProduct?.baseMockupUrl || item?.image || "";
        }
        return viewMockups.front || studioProduct?.baseMockupUrl || item?.image || "";
    };
    const openDesignPreview = (item) => {
        setDesignPreviewItem(item);
        setDesignPreviewSide("front");
    };

    useEffect(() => {
        const baseProductId = designPreviewItem?.baseProductId;
        if (!baseProductId || studioPreviewProducts[baseProductId])
            return;
        let isMounted = true;
        studioProductsApi.getById(baseProductId)
            .then((product) => {
            if (!isMounted || !product)
                return;
            setStudioPreviewProducts((prev) => ({ ...prev, [baseProductId]: product }));
        })
            .catch(() => { });
        return () => {
            isMounted = false;
        };
    }, [designPreviewItem, studioPreviewProducts]);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [productForm, setProductForm] = useState({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
        price: "",
        image: "",
        images: [],
        category: "",
        gender: "",
        season: "",
        style: "",
        occasion: "",
        sizes: [],
        colors: [],
        stock: "100",
        featured: false,
        active: true,
        onSale: false,
        salePercentage: "0",
        newArrival: false,
    });
    const [mainImageFile, setMainImageFile] = useState(null);
    const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
    const [newSize, setNewSize] = useState("");
    const [newColor, setNewColor] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { user, logout, isLoading: authLoading } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const productColorSet = new Set(productForm.colors.map(normalizeColorKey));
    const studioColorList = parseColorList(studioForm.colors);
    const studioColorSet = new Set(studioColorList.map(normalizeColorKey));
    const normalizeGender = (value) => value?.toLowerCase().trim() || "";
    const loadNotifications = useCallback(async () => {
        if (!user)
            return;
        try {
            const response = await getNotifications({ page: 1, limit: 5 });
            setNotifications(response?.data || []);
            setUnreadNotifications(response?.unreadCount || 0);
        }
        catch {
        }
    }, [user]);
    const loadUnreadMessages = useCallback(async () => {
        if (!user)
            return;
        try {
            const threads = await staffChatApi.getThreads();
            const totalUnread = Array.isArray(threads)
                ? threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0)
                : 0;
            setUnreadMessages(totalUnread);
        }
        catch {
        }
    }, [user]);
    useEffect(() => {
        if (!user)
            return;
        loadNotifications();
        loadUnreadMessages();
        const interval = setInterval(() => {
            loadNotifications();
            loadUnreadMessages();
        }, 30000);
        return () => clearInterval(interval);
    }, [user, loadNotifications, loadUnreadMessages]);
    useEffect(() => {
        if (notificationsOpen) {
            loadNotifications();
        }
    }, [notificationsOpen, loadNotifications]);
    const groupedProducts = useMemo(() => {
        const groups = {
            men: [],
            women: [],
            kids: [],
            unisex: [],
            other: [],
        };
        products.forEach((product) => {
            const gender = normalizeGender(product.gender);
            if (["men", "man", "male"].includes(gender)) {
                groups.men.push(product);
            }
            else if (["women", "woman", "female"].includes(gender)) {
                groups.women.push(product);
            }
            else if (["kids", "kid", "children", "child", "boys", "girls"].includes(gender)) {
                groups.kids.push(product);
            }
            else if (["unisex", "all", "all gender", "all genders"].includes(gender)) {
                groups.unisex.push(product);
            }
            else {
                groups.other.push(product);
            }
        });
        return groups;
    }, [products]);
    const productSections = useMemo(() => {
        const sections = [
            { key: "men", label: language === "ar" ? "رجال" : "Men", items: groupedProducts.men },
            { key: "women", label: language === "ar" ? "نساء" : "Women", items: groupedProducts.women },
            { key: "kids", label: language === "ar" ? "أطفال" : "Kids", items: groupedProducts.kids },
        ];
        if (groupedProducts.unisex.length) {
            sections.push({ key: "unisex", label: language === "ar" ? "للجميع" : "Unisex", items: groupedProducts.unisex });
        }
        if (groupedProducts.other.length) {
            sections.push({ key: "other", label: language === "ar" ? "غير محدد" : "Unassigned", items: groupedProducts.other });
        }
        return sections;
    }, [groupedProducts, language]);
    useEffect(() => {
        if (authLoading)
            return;
        if (user && user.role !== "employee") {
            router.replace("/");
            return;
        }
        if (!user && !authLoading) {
            router.replace("/login");
            return;
        }
    }, [user, authLoading, router]);
    useEffect(() => {
        if (authLoading || !user)
            return;
        loadOrders();
        loadUsers();
        loadProducts();
        loadUserPreferences();
    }, [authLoading, user]);
    useEffect(() => {
        if (activeTab === "products" && user) {
            loadProducts();
        }
    }, [activeTab, user]);
    useEffect(() => {
        if (activeTab === "studioProducts") {
            loadStudioProducts();
        }
    }, [activeTab]);
    const loadUserPreferences = async () => {
        try {
            const preferences = await userPreferencesApi.getPreferences();
            if (preferences) {
                if (preferences.dashboardPreferences?.activeTab) {
                    setActiveTab(preferences.dashboardPreferences.activeTab);
                }
                if (preferences.sidebarPreferences?.collapsed !== undefined) {
                }
                if (preferences.theme && preferences.theme !== 'system') {
                    setTheme(preferences.theme);
                }
                if (preferences.language) {
                    setLanguage(preferences.language);
                }
            }
        }
        catch (error) {
            console.error("Failed to load user preferences:", error);
        }
    };
    useEffect(() => {
        if (!user)
            return;
        const savePreferences = async () => {
            try {
                await userPreferencesApi.updatePreferences({
                    dashboardPreferences: {
                        activeTab: activeTab,
                    },
                    theme: (theme === 'light' || theme === 'dark' || theme === 'system')
                        ? theme
                        : 'system',
                    language: (language === 'en' || language === 'ar')
                        ? language
                        : 'en',
                });
            }
            catch (error) {
                console.error("Failed to save preferences:", error);
            }
        };
        const timeoutId = setTimeout(savePreferences, 1000);
        return () => clearTimeout(timeoutId);
    }, [activeTab, theme, language, user]);
    const loadOrders = async () => {
        try {
            setLoading(true);
            console.log("🔄 Employee: Loading orders...");
            const ordersData = await ordersApi.getAllOrders({ limit: 100 });
            console.log("✅ Employee: Orders loaded:", {
                count: Array.isArray(ordersData) ? ordersData.length : 0,
                orders: ordersData,
            });
            setOrders(Array.isArray(ordersData) ? ordersData : []);
        }
        catch (error) {
            console.error("❌ Employee: Error loading orders:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load orders",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const loadUsers = async () => {
        try {
            const usersData = await adminApi.getAllUsers({ limit: 100 });
            setUsers(usersData.data || []);
        }
        catch (error) {
            console.error("❌ Employee: Error loading users:", error);
        }
    };
    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAdminApi.getAllProducts({ limit: 10, page: 1 });
            const productsList = Array.isArray(response.data) ? response.data : [];
            setProducts(productsList);
            setLoading(false);
            if (productsList.length > 0 && response.total && response.total > productsList.length) {
                const chunks = Math.ceil((response.total - productsList.length) / 10);
                for (let i = 0; i < Math.min(chunks, 5); i++) {
                    const page = i + 2;
                    const chunkLimit = 10;
                    setTimeout(() => {
                        productsAdminApi.getAllProducts({
                            limit: chunkLimit,
                            page: page
                        }).then((chunkResponse) => {
                            const chunkProducts = Array.isArray(chunkResponse.data) ? chunkResponse.data : [];
                            if (chunkProducts.length > 0) {
                                setProducts((prev) => {
                                    const productMap = new Map();
                                    prev.forEach(product => {
                                        const id = product._id?.toString() || product.id?.toString();
                                        if (id)
                                            productMap.set(id, product);
                                    });
                                    chunkProducts.forEach(product => {
                                        const id = product._id?.toString() || product.id?.toString();
                                        if (id)
                                            productMap.set(id, product);
                                    });
                                    return Array.from(productMap.values());
                                });
                            }
                        }).catch((err) => {
                            console.warn(`Failed to load product chunk ${page}:`, err);
                        });
                    }, (i + 1) * 1000);
                }
            }
        }
        catch (error) {
            console.error("❌ Employee: Error loading products:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load products",
                variant: "destructive",
            });
            setLoading(false);
        }
    };
    const resetStudioForm = () => {
        setStudioForm({
            name: "",
            type: "",
            description: "",
            baseMockupUrl: "",
            viewMockups: { front: "", back: "" },
            colorMockups: {},
            colorViews: {},
            price: "",
            colors: "",
            sizes: "",
            active: true,
            aiEnhanceEnabled: false,
            designAreas: {
                front: { x: 0.18, y: 0.2, width: 0.64, height: 0.55 },
                back: { x: 0.18, y: 0.2, width: 0.64, height: 0.55 },
            },
            safeArea: { x: 60, y: 80, width: 280, height: 300 },
        });
        setEditingStudio(null);
    };
    const loadStudioProducts = useCallback(async () => {
        try {
            setStudioLoading(true);
            const data = await studioProductsApi.getAll();
            setStudioProducts(data || []);
        }
        catch (error) {
            toast({
                title: "Error",
                description: error?.message || "Failed to load studio products",
                variant: "destructive",
            });
            setStudioProducts([]);
        }
        finally {
            setStudioLoading(false);
        }
    }, [toast]);
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };
    const handleMainImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Error",
                description: language === "ar" ? "الملف يجب أن يكون صورة" : "File must be an image",
                variant: "destructive",
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: language === "ar" ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image size must be less than 5MB",
                variant: "destructive",
            });
            return;
        }
        try {
            setMainImageFile(file);
            const base64 = await fileToBase64(file);
            setProductForm({ ...productForm, image: base64 });
        }
        catch (error) {
            toast({
                title: "Error",
                description: language === "ar" ? "فشل تحميل الصورة" : "Failed to load image",
                variant: "destructive",
            });
        }
    };
    const handleAdditionalImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0)
            return;
        const maxImages = 3;
        const currentImagesCount = productForm.images.length;
        const remainingSlots = maxImages - currentImagesCount;
        if (remainingSlots <= 0) {
            toast({
                title: language === "ar" ? "حد أقصى" : "Maximum reached",
                description: language === "ar" ? "يمكنك إضافة 3 صور إضافية فقط" : "You can only add 3 additional images",
                variant: "destructive",
            });
            return;
        }
        const filesToProcess = files.slice(0, remainingSlots);
        if (files.length > remainingSlots) {
            toast({
                title: language === "ar" ? "تنبيه" : "Notice",
                description: language === "ar" ? `تم اختيار أول ${remainingSlots} صورة فقط` : `Only the first ${remainingSlots} image(s) were selected`,
                variant: "default",
            });
        }
        try {
            const newFiles = [];
            const newBase64Images = [];
            for (const file of filesToProcess) {
                if (!file.type.startsWith('image/')) {
                    toast({
                        title: "Error",
                        description: language === "ar" ? "الملف يجب أن يكون صورة" : "File must be an image",
                        variant: "destructive",
                    });
                    continue;
                }
                if (file.size > 5 * 1024 * 1024) {
                    toast({
                        title: "Error",
                        description: language === "ar" ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image size must be less than 5MB",
                        variant: "destructive",
                    });
                    continue;
                }
                newFiles.push(file);
                const base64 = await fileToBase64(file);
                newBase64Images.push(base64);
            }
            setAdditionalImageFiles([...additionalImageFiles, ...newFiles]);
            setProductForm({ ...productForm, images: [...productForm.images, ...newBase64Images] });
        }
        catch (error) {
            toast({
                title: "Error",
                description: language === "ar" ? "فشل تحميل الصور" : "Failed to load images",
                variant: "destructive",
            });
        }
    };
    const removeAdditionalImage = (index) => {
        const newImages = productForm.images.filter((_, i) => i !== index);
        const newFiles = additionalImageFiles.filter((_, i) => i !== index);
        setProductForm({ ...productForm, images: newImages });
        setAdditionalImageFiles(newFiles);
    };
    const handleStudioViewMockupUpload = async (viewKey, e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Error",
                description: "File must be an image",
                variant: "destructive",
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "Image size must be less than 5MB",
                variant: "destructive",
            });
            return;
        }
        try {
            const base64 = await fileToBase64(file);
            setStudioForm((prev) => ({
                ...prev,
                baseMockupUrl: viewKey === "front" ? base64 : prev.baseMockupUrl,
                viewMockups: {
                    ...(prev.viewMockups || {}),
                    [viewKey]: base64,
                },
            }));
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to load mockup image",
                variant: "destructive",
            });
        }
    };
    const handleStudioColorMockupUpload = async (colorKey, viewKey, e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Error",
                description: "File must be an image",
                variant: "destructive",
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Error",
                description: "Image size must be less than 5MB",
                variant: "destructive",
            });
            return;
        }
        try {
            const base64 = await fileToBase64(file);
            setStudioForm((prev) => ({
                ...prev,
                colorViews: {
                    ...(prev.colorViews || {}),
                    [colorKey]: {
                        ...(prev.colorViews?.[colorKey] || {}),
                        [viewKey]: base64,
                    },
                },
            }));
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to load mockup image",
                variant: "destructive",
            });
        }
    };
    const handleEditStudioProduct = (product) => {
        const legacyColorViews = {};
        if (!product.colorViews && product.colorMockups) {
            Object.entries(product.colorMockups || {}).forEach(([colorKey, url]) => {
                if (!colorKey || !url)
                    return;
                legacyColorViews[colorKey] = { front: url };
            });
        }
        setEditingStudio(product);
        setStudioForm({
            name: product.name,
            type: product.type,
            description: product.description || "",
            baseMockupUrl: product.baseMockupUrl || "",
            viewMockups: {
                front: product.viewMockups?.front || product.baseMockupUrl || "",
                back: product.viewMockups?.back || "",
            },
            colorMockups: product.colorMockups || {},
            colorViews: product.colorViews || legacyColorViews,
            price: product.price.toString(),
            colors: (product.colors || []).join(", "),
            sizes: (product.sizes || []).join(", "),
            active: product.active,
            aiEnhanceEnabled: product.aiEnhanceEnabled || false,
            designAreas: product.designAreas || {
                front: { x: 0.18, y: 0.2, width: 0.64, height: 0.55 },
                back: { x: 0.18, y: 0.2, width: 0.64, height: 0.55 },
            },
            safeArea: product.safeArea || { x: 60, y: 80, width: 280, height: 300 },
        });
        setShowStudioModal(true);
    };
    const handleDeleteStudioProduct = async (id) => {
        if (!confirm("Delete this studio product?"))
            return;
        try {
            await studioProductsApi.remove(id);
            toast({ title: "Deleted", description: "Studio product removed" });
            loadStudioProducts();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error?.message || "Failed to delete studio product",
                variant: "destructive",
            });
        }
    };
    const handleSaveStudioProduct = async () => {
        try {
            const colorList = studioForm.colors.split(",").map((c) => c.trim()).filter(Boolean);
            const normalizedViewMockups = {};
            ["front", "back"].forEach((viewKey) => {
                const url = studioForm.viewMockups?.[viewKey];
                if (url) {
                    normalizedViewMockups[viewKey] = url;
                }
            });
            const normalizedColorViews = {};
            Object.entries(studioForm.colorViews || {}).forEach(([colorKey, views]) => {
                const normalizedKey = colorKey.trim().toLowerCase();
                if (!normalizedKey || !views)
                    return;
                if (colorList.length > 0 && !colorList.some((c) => c.trim().toLowerCase() === normalizedKey)) {
                    return;
                }
                const viewPayload = {};
                ["front", "back"].forEach((viewKey) => {
                    const url = views?.[viewKey];
                    if (url) {
                        viewPayload[viewKey] = url;
                    }
                });
                if (Object.keys(viewPayload).length > 0) {
                    normalizedColorViews[normalizedKey] = viewPayload;
                }
            });
            const normalizedColorMockups = {};
            Object.entries(studioForm.colorMockups || {}).forEach(([colorKey, url]) => {
                const normalizedKey = colorKey.trim().toLowerCase();
                if (!normalizedKey || !url)
                    return;
                if (colorList.length > 0 && !colorList.some((c) => c.trim().toLowerCase() === normalizedKey)) {
                    return;
                }
                normalizedColorMockups[normalizedKey] = url;
            });
            Object.entries(normalizedColorViews).forEach(([colorKey, views]) => {
                if (views?.front && !normalizedColorMockups[colorKey]) {
                    normalizedColorMockups[colorKey] = views.front;
                }
            });
            const payload = {
                name: studioForm.name.trim(),
                type: studioForm.type.trim(),
                description: studioForm.description.trim(),
                baseMockupUrl: (studioForm.baseMockupUrl || studioForm.viewMockups?.front || "").trim(),
                price: Number(studioForm.price) || 0,
                colors: colorList,
                sizes: studioForm.sizes.split(",").map((s) => s.trim()).filter(Boolean),
                active: studioForm.active,
                aiEnhanceEnabled: studioForm.aiEnhanceEnabled,
                viewMockups: normalizedViewMockups,
                colorViews: normalizedColorViews,
                colorMockups: normalizedColorMockups,
                designAreas: {
                    front: {
                        x: Number(studioForm.designAreas?.front?.x) || 0,
                        y: Number(studioForm.designAreas?.front?.y) || 0,
                        width: Number(studioForm.designAreas?.front?.width) || 0,
                        height: Number(studioForm.designAreas?.front?.height) || 0,
                    },
                    back: {
                        x: Number(studioForm.designAreas?.back?.x) || 0,
                        y: Number(studioForm.designAreas?.back?.y) || 0,
                        width: Number(studioForm.designAreas?.back?.width) || 0,
                        height: Number(studioForm.designAreas?.back?.height) || 0,
                    },
                },
                safeArea: {
                    x: Number(studioForm.safeArea.x) || 0,
                    y: Number(studioForm.safeArea.y) || 0,
                    width: Number(studioForm.safeArea.width) || 0,
                    height: Number(studioForm.safeArea.height) || 0,
                },
            };
            if (editingStudio?._id) {
                await studioProductsApi.update(editingStudio._id, payload);
                toast({ title: "Updated", description: "Studio product updated" });
            }
            else {
                await studioProductsApi.create(payload);
                toast({ title: "Created", description: "Studio product added" });
            }
            setShowStudioModal(false);
            resetStudioForm();
            loadStudioProducts();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error?.message || "Failed to save studio product",
                variant: "destructive",
            });
        }
    };
    const handleDeleteUser = async (id) => {
        try {
            await adminApi.deleteUser(id);
            toast({
                title: language === "ar" ? "تم الحذف" : "Deleted",
                description: language === "ar" ? "تم حذف العميل بنجاح" : "Customer deleted successfully",
            });
            loadUsers();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete customer",
                variant: "destructive",
            });
        }
    };
    const [showEditOrder, setShowEditOrder] = useState(false);
    const [editOrderStatus, setEditOrderStatus] = useState("pending");
    const [editTrackingNumber, setEditTrackingNumber] = useState("");
    const [editCarrier, setEditCarrier] = useState("");
    const [editEstimatedDelivery, setEditEstimatedDelivery] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editNote, setEditNote] = useState("");
    const openEditOrder = async (order) => {
        setSelectedOrder(order);
        setEditOrderStatus(order.status);
        setEditTrackingNumber(order.trackingNumber || "");
        setEditCarrier(order.carrier || "");
        setEditEstimatedDelivery(order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : "");
        setEditLocation("");
        setEditNote("");
        setShowEditOrder(true);
    };
    const updateOrderStatus = async (orderId, statusOverride, trackingOverride) => {
        const targetId = orderId || selectedOrder?._id;
        if (!targetId)
            return;
        try {
            await ordersApi.updateOrderStatus(targetId, {
                status: statusOverride || editOrderStatus,
                trackingNumber: trackingOverride || editTrackingNumber || undefined,
                carrier: editCarrier || undefined,
                estimatedDelivery: editEstimatedDelivery || undefined,
                location: editLocation || undefined,
                note: editNote || undefined,
            });
            toast({
                title: "Success",
                description: language === "ar" ? "?? ????? ???? ????? ?????" : "Order status and tracking updated successfully",
            });
            setShowEditOrder(false);
            setSelectedOrder(null);
            loadOrders();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error?.message || "Failed to update order status",
                variant: "destructive",
            });
        }
    };
    const handleUpdateOrderStatus = () => {
        if (!selectedOrder)
            return;
        updateOrderStatus(selectedOrder._id);
    };
    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing");
    const inProgressOrders = orders.filter((o) => o.status === "processing");
    const completedOrders = orders.filter((o) => o.status === "shipped" || o.status === "delivered");
    const stats = [
        {
            label: language === "ar" ? "الطلبات المعلقة" : "Pending Orders",
            value: pendingOrders.length.toString(),
            icon: Clock,
            color: "text-orange-600",
        },
        {
            label: language === "ar" ? "المكتملة اليوم" : "Completed Today",
            value: completedOrders.length.toString(),
            icon: CheckCircle,
            color: "text-green-600",
        },
        {
            label: language === "ar" ? "قيد المعالجة" : "In Progress",
            value: inProgressOrders.length.toString(),
            icon: Printer,
            color: "text-blue-600",
        },
        {
            label: language === "ar" ? "إجمالي الطلبات" : "Total Orders",
            value: orders.length.toString(),
            icon: ShoppingCart,
            color: "text-purple-600",
        },
    ];
    if (authLoading || loading) {
        return (<div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <AppLoader label="Loading dashboard..." size="lg"/>
      </div>);
    }
    if (!user || user.role !== "employee") {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>);
    }
    const previewProduct = designPreviewItem?.baseProductId
        ? studioPreviewProducts[designPreviewItem.baseProductId]
        : null;
    const previewSideData = designPreviewItem?.designMetadata?.studio?.data?.designBySide?.[designPreviewSide] || {};
    const previewArea = resolvePreviewArea(previewProduct, designPreviewSide);
    const previewBaseImage = resolvePreviewBaseImage(designPreviewItem, previewProduct, designPreviewSide);
    const sidebarContent = (<div className="flex h-full flex-col overflow-y-auto">
        <div className="p-6">
          <Link href="/">
            <Logo className="h-20 w-auto"/>
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1"/>
              EMPLOYEE
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{user.firstName} {user.lastName}</span>
          </div>
        </div>

        <nav className="px-4 space-y-1 pb-6">
          <button onClick={() => setActiveTab("overview")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "overview" ? "bg-blue-800 text-white border border-blue-900" : "hover:bg-muted"}`}>
            <LayoutDashboard className="h-5 w-5"/>
            <span className="font-medium">{t("overview", language)}</span>
          </button>

          <button onClick={() => setActiveTab("orders")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "orders" ? "bg-blue-800 text-white border border-blue-900" : "hover:bg-muted"}`}>
            <ShoppingCart className="h-5 w-5"/>
            <span className="font-medium">{t("orders", language)}</span>
            {pendingOrders.length > 0 && (<Badge variant="destructive" className="ml-auto">
                {pendingOrders.length}
              </Badge>)}
          </button>

          <button onClick={() => setActiveTab("progress")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "progress" ? "bg-blue-800 text-white border border-blue-900" : "hover:bg-muted"}`}>
            <Printer className="h-5 w-5"/>
            <span className="font-medium">{language === "ar" ? 'O?O?O"1 O‎O‎O‎,‎O‎,‎O‎.' : "Progress Tracking"}</span>
          </button>

          <button onClick={() => setActiveTab("products")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "products" ? "bg-blue-800 text-white border border-blue-900" : "hover:bg-muted"}`}>
            <Package className="h-5 w-5"/>
            <span className="font-medium">{t("products", language)}</span>
          </button>

          <button onClick={() => setActiveTab("studioProducts")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "studioProducts" ? "bg-blue-800 text-white border border-blue-900" : "hover:bg-muted"}`}>
            <PackageCheck className="h-5 w-5"/>
            <span className="font-medium">{language === "ar" ? "U.U+O?O?O‎‎O? O‎,‎O‎3O?O_USU^" : "Studio Products"}</span>
          </button>

          <button onClick={() => setActiveTab("customers")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "customers" ? "bg-blue-800 text-white border border-blue-900" : "hover:bg-muted"}`}>
            <Users className="h-5 w-5"/>
            <span className="font-medium">{t("customers", language)}</span>
          </button>

          <button onClick={() => setActiveTab("chat")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "chat" ? "bg-blue-800 text-white border border-blue-900" : "hover:bg-muted"}`}>
            <MessageSquare className="h-5 w-5"/>
            <span className="font-medium">Staff Chat</span>
          </button>
        </nav>

        <div className="mt-auto space-y-2 px-4 pb-6">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex-1 text-base" aria-label="Toggle theme">
              <span aria-hidden="true">{theme === "dark" ? "🌙" : "☀️"}</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setLanguage(language === "ar" ? "en" : "ar")} className="flex-1">
              <Languages className="h-4 w-4"/>
            </Button>
          </div>
          <Button variant="outline" className="w-full bg-transparent" onClick={() => {
            window.open("/", "_blank");
        }}>
            <Eye className="h-4 w-4 mr-2"/>
            {language === "ar" ? "O1O?O‎ U?O?O‎O?O?" : "View as Guest"}
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full bg-transparent">
              {language === "ar" ? "O‎,‎O1U^O‎_Oc U,U,U.O?O?O?" : "Back to Store"}
            </Button>
          </Link>
          <Button variant="outline" className="w-full bg-transparent" onClick={logout}>
            {t("logout", language)}
          </Button>
        </div>
        </div>);
    return (<EmployeeLayout sidebar={sidebarContent} title={language === "ar" ? "لوحة الموظف" : "Employee Dashboard"}>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-end gap-2 mb-6">
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative h-9 w-9" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification._id} className="px-3 py-3 text-sm">
                    <div className="font-medium">{notification.title || "Notification"}</div>
                    <div className="text-muted-foreground">{notification.message}</div>
                  </div>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  await markAllAsRead();
                  setUnreadNotifications(0);
                }}
              >
                Mark all as read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            className="relative h-9 w-9"
            aria-label="Staff chat"
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare className="h-4 w-4" />
            {unreadMessages > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </Button>
        </div>
        {loading ? (<div className="flex items-center justify-center h-screen">
            <AppLoader label={language === "ar" ? "Loading..." : "Loading..."} size="lg"/>
          </div>) : (<>
        
        {activeTab === "overview" && (<div className="space-y-8">
            <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {language === "ar" ? "لوحة تحكم الموظف" : "Employee Dashboard"}
                  </h1>
                  <p className="text-muted-foreground">
                    {language === "ar" ? "إدارة الطلبات والمخزون" : "Manage orders and inventory"}
                  </p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (<Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`}/>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5"/>
                        {language === "ar" ? `الطلبات المعلقة (${pendingOrders.length})` : `Pending Orders (${pendingOrders.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                        {pendingOrders.slice(0, 5).map((order) => (<div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{order.orderNumber}</p>
                                <Badge className={getStatusColor(order.status)}>
                                  {t(order.status, language)}
                                </Badge>
                          </div>
                              <p className="text-sm text-muted-foreground">
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </p>
                        </div>
                        <Button size="sm" onClick={() => viewOrderDetails(order)}>
                              {language === "ar" ? "بدء" : "Start"}
                        </Button>
                      </div>))}
                    {pendingOrders.length === 0 && (<p className="text-center text-muted-foreground py-4">
                            {language === "ar" ? "لا توجد طلبات معلقة" : "No pending orders"}
                          </p>)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5"/>
                        {language === "ar" ? `قيد المعالجة (${inProgressOrders.length})` : `In Progress (${inProgressOrders.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                        {inProgressOrders.slice(0, 5).map((order) => (<div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {t(order.status, language)}
                              </Badge>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => viewOrderDetails(order)}>
                              {t("view", language)}
                        </Button>
                      </div>))}
                    {inProgressOrders.length === 0 && (<p className="text-center text-muted-foreground py-4">
                            {language === "ar" ? "لا توجد طلبات قيد المعالجة" : "No orders in progress"}
                          </p>)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>)}

        {activeTab === "studioProducts" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Studio Products</h1>
                <p className="text-muted-foreground">Manage studio products for the studio experience.</p>
              </div>
              <Button onClick={() => {
                    resetStudioForm();
                    setShowStudioModal(true);
                }} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2"/>
                Add Studio Product
              </Button>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                {studioLoading ? (<div className="py-10">
                      <AppLoader label="Loading studio products..." />
                    </div>) : studioProducts.length === 0 ? (<p className="text-center text-muted-foreground py-8">No studio products yet</p>) : (<Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studioProducts.map((p) => {
            const colorViews = p.colorViews || {};
            const colorMockups = p.colorMockups || {};
            const firstColorView = Object.values(colorViews)[0];
            const firstColorMockup = Object.values(colorMockups)[0];
            const thumbnailUrl = resolveImageUrl(p.viewMockups?.front)
                || resolveImageUrl(p.baseMockupUrl)
                || resolveImageUrl(firstColorView?.front)
                || resolveImageUrl(firstColorMockup)
                || "/placeholder-logo.png";
            return (<TableRow key={p._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg border border-border bg-muted/40 overflow-hidden flex items-center justify-center">
                                <img
                                  src={thumbnailUrl}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                    if (e.currentTarget.dataset.fallbackApplied)
                        return;
                    e.currentTarget.dataset.fallbackApplied = "true";
                    e.currentTarget.src = "/placeholder-logo.png";
                }}
                                />
                              </div>
                              <span>{p.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.type}</TableCell>
                          <TableCell>${p.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditStudioProduct(p)}><Edit className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteStudioProduct(p._id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </TableCell>
                        </TableRow>);
        })}
                    </TableBody>
                  </Table>)}
              </CardContent>
            </Card>

            <Dialog open={showStudioModal} onOpenChange={setShowStudioModal}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingStudio ? 'Edit Studio Product' : 'Add Studio Product'}</DialogTitle>
                  <DialogDescription>Define designable product details, pricing, and safe area.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Name</Label>
                    <Input value={studioForm.name} onChange={(e) => setStudioForm({ ...studioForm, name: e.target.value })} placeholder="Hoodie Pro"/>
                    <datalist id="studio-name-list">
                      <option value="Hoodie Pro"/>
                      <option value="Classic Tee"/>
                      <option value="Essential Blouse"/>
                      <option value="Crew Sweatshirt"/>
                      <option value="Street Hoodie"/>
                    </datalist>
                    <Label>Type</Label>
                    <Input value={studioForm.type} onChange={(e) => setStudioForm({ ...studioForm, type: e.target.value })} placeholder="hoodie" list="studio-type-list"/>
                    <datalist id="studio-type-list">
                      <option value="t-shirt"/>
                      <option value="hoodie"/>
                      <option value="blouse"/>
                      <option value="sweatshirt"/>
                      <option value="crewneck"/>
                    </datalist>
                    <Label>Description</Label>
                    <Textarea value={studioForm.description} onChange={(e) => setStudioForm({ ...studioForm, description: e.target.value })} placeholder="Premium hoodie..."/>
                    <Label>View Mockups (Front / Back)</Label>
                    <div className="space-y-3">
                      {["front", "back"].map((viewKey) => {
                        const previewUrl = studioForm.viewMockups?.[viewKey] || (viewKey === "front" ? studioForm.baseMockupUrl : "");
                        return (<div key={viewKey} className="border-2 border-dashed border-border rounded-lg p-3 hover:border-primary transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium capitalize">{viewKey}</span>
                              <div className="flex items-center gap-2">
                                <input id={`studio-view-${viewKey}`} type="file" accept="image/*" onChange={(e) => handleStudioViewMockupUpload(viewKey, e)} className="hidden"/>
                                <Label htmlFor={`studio-view-${viewKey}`} className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">
                                  <Upload className="h-4 w-4"/>
                                  Upload
                                </Label>
                              </div>
                            </div>
                            {previewUrl && (<div className="mt-3 relative w-full max-w-xs">
                                <div className="relative aspect-[4/5] rounded-lg overflow-hidden border-2 border-primary">
                                  <img src={previewUrl} alt={`${viewKey} mockup`} className="w-full h-full object-cover"/>
                                </div>
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setStudioForm((prev) => ({
                        ...prev,
                        baseMockupUrl: viewKey === "front" ? "" : prev.baseMockupUrl,
                        viewMockups: { ...(prev.viewMockups || {}), [viewKey]: "" },
                    }))}>
                                  <X className="h-4 w-4"/>
                                </Button>
                              </div>)}
                            </div>);
                      })}
                    </div>
                    <Label>Price</Label>
                    <Input type="number" value={studioForm.price} onChange={(e) => setStudioForm({ ...studioForm, price: e.target.value })}/>
                  </div>
                  <div className="space-y-3">
                    <Label>Colors (comma separated)</Label>
                    <Input value={studioForm.colors} onChange={(e) => setStudioForm({ ...studioForm, colors: e.target.value })} placeholder="white, black, navy" list="studio-colors-list"/>
                    <datalist id="studio-colors-list">
                      <option value="white"/>
                      <option value="black"/>
                      <option value="navy"/>
                      <option value="gray"/>
                      <option value="blue"/>
                      <option value="charcoal"/>
                      <option value="green"/>
                      <option value="peach"/>
                      <option value="pink"/>
                      <option value="burgundy"/>
                      <option value="olive"/>
                      <option value="cream"/>
                      <option value="lavender"/>
                      <option value="beige"/>
                      <option value="brown"/>
                      <option value="red"/>
                      <option value="yellow"/>
                      <option value="orange"/>
                      <option value="purple"/>
                      <option value="teal"/>
                      <option value="cyan"/>
                    </datalist>
                    <div className="flex flex-wrap gap-3">
                      {COLOR_OPTIONS.map((option) => {
                    const isSelected = studioColorSet.has(option.id);
                    const label = language === "ar" ? option.label.ar : option.label.en;
                    return (<button key={option.id} type="button" onClick={() => {
                            const nextColors = isSelected
                                ? studioColorList.filter((color) => normalizeColorKey(color) !== option.id)
                                : [...studioColorList, option.id];
                            setStudioForm({ ...studioForm, colors: nextColors.join(", ") });
                        }} className="flex flex-col items-center gap-1 text-xs" title={label} aria-label={label}>
                            <span className={`h-8 w-8 rounded-full border transition-all ${option.needsBorder ? "border-border" : "border-transparent"} ${isSelected
                            ? "ring-2 ring-black ring-offset-2 ring-offset-background"
                            : "hover:scale-105"}`} style={{ backgroundColor: option.value }}/>
                            <span className={isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}>
                              {label}
                            </span>
                          </button>);
                })}
                    </div>
                    <Label>Sizes (comma separated)</Label>
                    <Input value={studioForm.sizes} onChange={(e) => setStudioForm({ ...studioForm, sizes: e.target.value })} placeholder="S, M, L" list="studio-sizes-list"/>
                    <datalist id="studio-sizes-list">
                      <option value="XS, S, M, L, XL"/>
                      <option value="S, M, L"/>
                      <option value="M, L, XL"/>
                      <option value="One Size"/>
                    </datalist>
                    <div className="flex items-center gap-3">
                      <Checkbox id="studio-active" checked={studioForm.active} onCheckedChange={(v) => setStudioForm({ ...studioForm, active: Boolean(v) })}/>
                      <Label htmlFor="studio-active">Active</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => { setShowStudioModal(false); resetStudioForm(); }}>Cancel</Button>
                  <Button onClick={handleSaveStudioProduct}>{editingStudio ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>)}


        
        {activeTab === "orders" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "إدارة الطلبات" : "Orders Management"}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "عرض ومعالجة طلبات العملاء" : "View and process customer orders"}
                    </p>
              </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                    <TabsTrigger value="all">
                      {language === "ar" ? `الكل (${orders.length})` : `All Orders (${orders.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      {language === "ar" ? `معلق (${pendingOrders.length})` : `Pending (${pendingOrders.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="progress">
                      {language === "ar" ? `قيد المعالجة (${inProgressOrders.length})` : `In Progress (${inProgressOrders.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      {language === "ar" ? `مكتمل (${completedOrders.length})` : `Completed (${completedOrders.length})`}
                    </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                              <TableHead>{language === "ar" ? "رقم الطلب" : "Order ID"}</TableHead>
                              <TableHead>{language === "ar" ? "العميل" : "Customer"}</TableHead>
                              <TableHead>{t("total", language)}</TableHead>
                              <TableHead>{t("status", language)}</TableHead>
                              <TableHead>{t("date", language)}</TableHead>
                              <TableHead>{t("actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (<TableRow key={order._id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                                  {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                            </TableCell>
                                <TableCell>${order.total.toFixed(2)}</TableCell>
                            <TableCell>
                                  <Badge className={getStatusColor(order.status)}>
                                    {t(order.status, language)}
                                  </Badge>
                            </TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order)} title={language === "ar" ? "عرض التفاصيل" : "View Details"}>
                                  <Eye className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditOrder(order)} title={language === "ar" ? "تحديث التتبع" : "Update Tracking"}>
                                  <Edit className="h-4 w-4"/>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending">
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                              <TableHead>{language === "ar" ? "رقم الطلب" : "Order ID"}</TableHead>
                              <TableHead>{language === "ar" ? "العميل" : "Customer"}</TableHead>
                              <TableHead>{t("total", language)}</TableHead>
                              <TableHead>{t("date", language)}</TableHead>
                              <TableHead>{t("actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingOrders.map((order) => (<TableRow key={order._id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                                  {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                            </TableCell>
                                <TableCell>${order.total.toFixed(2)}</TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => viewOrderDetails(order)}>
                                    {language === "ar" ? "معالجة" : "Process"}
                              </Button>
                            </TableCell>
                          </TableRow>))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress">
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                              <TableHead>{language === "ar" ? "رقم الطلب" : "Order ID"}</TableHead>
                              <TableHead>{language === "ar" ? "العميل" : "Customer"}</TableHead>
                              <TableHead>{t("status", language)}</TableHead>
                              <TableHead>{t("actions", language)}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inProgressOrders.map((order) => (<TableRow key={order._id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                <TableCell>
                                  {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                                </TableCell>
                            <TableCell>
                                  <Badge className={getStatusColor(order.status)}>
                                    {t(order.status, language)}
                                  </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => viewOrderDetails(order)}>
                                    {t("update", language)}
                              </Button>
                            </TableCell>
                          </TableRow>))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed">
                <Card>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                              <TableHead>{language === "ar" ? "رقم الطلب" : "Order ID"}</TableHead>
                              <TableHead>{language === "ar" ? "العميل" : "Customer"}</TableHead>
                              <TableHead>{t("status", language)}</TableHead>
                              <TableHead>{language === "ar" ? "رقم التتبع" : "Tracking"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedOrders.map((order) => (<TableRow key={order._id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                <TableCell>
                                  {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                                </TableCell>
                            <TableCell>
                                  <Badge className={getStatusColor(order.status)}>
                                    {t(order.status, language)}
                                  </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{order.trackingNumber || "N/A"}</TableCell>
                          </TableRow>))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>)}

            
        {activeTab === "progress" && (<div className="space-y-6">
            <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {language === "ar" ? "تقدم التصنيع" : "Manufacturing Progress"}
                  </h1>
                  <p className="text-muted-foreground">
                    {language === "ar" ? "تتبع حالة الطباعة والإنتاج" : "Track printing and production status"}
                  </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Printer className="h-5 w-5"/>
                        {language === "ar" ? "قائمة الانتظار" : "Printing Queue"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders
                    .filter((o) => o.status === "pending")
                    .slice(0, 3)
                    .map((order) => (<div key={order._id} className="p-3 border rounded-lg">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </p>
                          <Button size="sm" className="w-full" onClick={() => updateOrderStatus(order._id, "processing")}>
                                {language === "ar" ? "بدء المعالجة" : "Start Processing"}
                          </Button>
                        </div>))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <PackageCheck className="h-5 w-5"/>
                        {language === "ar" ? "جودة" : "Quality Check"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders
                    .filter((o) => o.status === "processing")
                    .slice(0, 3)
                    .map((order) => (<div key={order._id} className="p-3 border rounded-lg">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => updateOrderStatus(order._id, "pending")}>
                                  {language === "ar" ? "رفض" : "Reject"}
                            </Button>
                                <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order._id, "shipped")}>
                                  {language === "ar" ? "موافقة" : "Approve"}
                            </Button>
                          </div>
                        </div>))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-600">
                    <Truck className="h-5 w-5"/>
                        {language === "ar" ? "جاهز للشحن" : "Ready to Ship"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders
                    .filter((o) => o.status === "processing")
                    .slice(0, 3)
                    .map((order) => (<div key={order._id} className="p-3 border rounded-lg">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </p>
                          <Button size="sm" className="w-full" onClick={() => updateOrderStatus(order._id, "shipped")}>
                                {language === "ar" ? "تم الشحن" : "Mark as Shipped"}
                          </Button>
                        </div>))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>)}

        
        {activeTab === "customers" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("customers", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "عرض وإدارة حسابات العملاء من قاعدة البيانات" : "View and manage customer accounts from database"}
                    </p>
              </div>
                  <Button onClick={loadUsers} variant="outline">
                    {language === "ar" ? "تحديث" : "Refresh"}
                  </Button>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                    {users.filter(u => u.role === "customer").length > 0 ? (<Table>
                  <TableHeader>
                    <TableRow>
                            <TableHead>{t("name", language)}</TableHead>
                            <TableHead>{t("email", language)}</TableHead>
                            <TableHead>{language === "ar" ? "الهاتف" : "Phone"}</TableHead>
                            <TableHead>{t("date", language)}</TableHead>
                            <TableHead className="text-right">{t("actions", language)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                          {users.filter(u => u.role === "customer").map((user) => (<TableRow key={user._id}>
                              <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone || "-"}</TableCell>
                              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                            toast({
                                title: language === "ar" ? "معلومات العميل" : "Customer Info",
                                description: `${user.firstName} ${user.lastName} - ${user.email}`,
                            });
                        }}>
                              <Eye className="h-4 w-4"/>
                            </Button>
                                  <Button variant="ghost" size="icon" onClick={async () => {
                            if (confirm(language === "ar" ? `هل أنت متأكد من حذف العميل ${user.firstName} ${user.lastName}؟` : `Are you sure you want to delete customer ${user.firstName} ${user.lastName}?`)) {
                                await handleDeleteUser(user._id);
                            }
                        }}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                  </Button>
                          </div>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>) : (<div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                        <p className="text-muted-foreground text-lg">{language === "ar" ? "لا يوجد عملاء في قاعدة البيانات" : "No customers in database yet"}</p>
                        <p className="text-sm text-muted-foreground mt-2">{language === "ar" ? "سيظهر العملاء هنا عند تسجيلهم في الموقع" : "Customers will appear here when they register on the website"}</p>
                      </div>)}
              </CardContent>
            </Card>
          </div>)}

        {activeTab === "chat" && (<div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Staff Chat</h1>
              <p className="text-muted-foreground">
                Chat directly with admin. Employees cannot message each other.
              </p>
            </div>
            <StaffChatPanel mode="employee" />
          </div>)}

        
        {activeTab === "products" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("products", language)}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "عرض وتحديث مخزون المنتجات" : "View and update product inventory"}
                </p>
              </div>
              <Button onClick={() => {
                    setIsEditingProduct(false);
                    setSelectedProduct(null);
                    setProductForm({
                        name: "",
                        nameAr: "",
                        description: "",
                        descriptionAr: "",
                        price: "",
                        image: "",
                        images: [],
                        category: "",
                        gender: "",
                        season: "",
                        style: "",
                        occasion: "",
                        sizes: [],
                        colors: [],
                        stock: "100",
                        featured: false,
                        active: true,
                        onSale: false,
                        salePercentage: "0",
                        newArrival: false,
                    });
                    setNewSize("");
                    setNewColor("");
                    setMainImageFile(null);
                    setAdditionalImageFiles([]);
                    setShowProductModal(true);
                }} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2"/>
                {t("add", language)} {t("products", language)}
              </Button>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                {products.length > 0 ? (<Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("name", language)}</TableHead>
                        <TableHead>{t("category", language)}</TableHead>
                        <TableHead>{t("price", language)}</TableHead>
                        <TableHead>{t("stock", language)}</TableHead>
                        <TableHead>{t("status", language)}</TableHead>
                        <TableHead className="text-right">{t("actions", language)}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productSections.map((section) => (<Fragment key={section.key}>
                          <TableRow className="bg-muted/40">
                            <TableCell colSpan={6} className="py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">{section.label}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {section.items.length}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                          {section.items.length > 0 ? (section.items.map((product, index) => {
                            const productId = product._id?.toString() || product.id?.toString() || `product-${index}`;
                            return (<TableRow key={`${section.key}-${productId}`}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                                        <Image src={sanitizeExternalUrl(product.image || "") || "/placeholder-logo.png"} alt={product.name || "Product"} fill className="object-cover" sizes="64px" onError={(e) => {
                                    const target = e.target;
                                    if (target.src !== "/placeholder-logo.png") {
                                        target.src = "/placeholder-logo.png";
                                    }
                                }}/>
                                      </div>
                                      <span className="line-clamp-2">
                                        {language === "ar" && product.nameAr ? product.nameAr : product.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{product.category}</TableCell>
                                  <TableCell>${product.price.toFixed(2)}</TableCell>
                                  <TableCell>{resolveStockValue(product.stock)}</TableCell>
                                  <TableCell>
                                    <Badge variant={product.active !== false ? "default" : "secondary"}>
                                      {product.active !== false ? t("active", language) : t("inactive", language)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => {
                                    setSelectedProduct(product);
                                    setIsEditingProduct(true);
                                    setProductForm({
                                        name: product.name || "",
                                        nameAr: product.nameAr || "",
                                        description: product.description || "",
                                        descriptionAr: product.descriptionAr || "",
                                        price: product.price?.toString() || "",
                                        image: product.image || "",
                                        images: product.images || [],
                                        category: product.category || "",
                                        gender: product.gender || "",
                                        season: product.season || "",
                                        style: product.style || "",
                                        occasion: product.occasion || "",
                                        sizes: product.sizes || [],
                                        colors: product.colors || [],
                                        stock: product.stock?.toString() || "100",
                                        featured: product.featured || false,
                                        active: product.active !== false,
                                        onSale: product.onSale || false,
                                        salePercentage: (product.salePercentage?.toString()) || "0",
                                        newArrival: product.newArrival || false,
                                    });
                                    setNewSize("");
                                    setNewColor("");
                                    setMainImageFile(null);
                                    setAdditionalImageFiles([]);
                                    setShowProductModal(true);
                                }}>
                                        <Edit className="h-4 w-4"/>
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={async () => {
                                    if (confirm(language === "ar" ? "?? ??? ????? ?? ??? ??? ???????" : "Are you sure you want to delete this product?")) {
                                        try {
                                            await productsAdminApi.deleteProduct(product._id || product.id?.toString() || "");
                                            toast({
                                                title: language === "ar" ? "?? ?????" : "Deleted",
                                                description: language === "ar" ? "?? ??? ?????? ?????" : "Product deleted successfully",
                                            });
                                            loadProducts();
                                        }
                                        catch (error) {
                                            toast({
                                                title: "Error",
                                                description: error.message || "Failed to delete product",
                                                variant: "destructive",
                                            });
                                        }
                                    }
                                }}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>);
                        })) : (<TableRow key={`${section.key}-empty`}>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                                {language === "ar" ? "?? ???? ?????? ?? ??? ?????" : "No products in this section"}
                              </TableCell>
                            </TableRow>)}
                        </Fragment>))}
                    </TableBody>
                  </Table>) : (<p className="text-center text-muted-foreground py-8">
                    {language === "ar" ? "لا توجد منتجات" : "No products yet"}
                  </p>)}
              </CardContent>
            </Card>

            
            <Dialog open={showProductModal} onOpenChange={(open) => {
                    setShowProductModal(open);
                    if (!open) {
                        setMainImageFile(null);
                        setAdditionalImageFiles([]);
                    }
                }}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-2 shadow-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingProduct
                    ? language === "ar" ? "تعديل المنتج" : "Edit Product"
                    : language === "ar" ? "إضافة منتج جديد" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "ar" ? "املأ المعلومات أدناه لإضافة منتج جديد" : "Fill in the information below to add a new product"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                      <Input id="name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder={language === "ar" ? "اسم المنتج بالإنجليزية" : "Product name in English"}/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameAr">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                      <Input id="nameAr" value={productForm.nameAr} onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })} placeholder={language === "ar" ? "اسم المنتج بالعربية" : "Product name in Arabic"}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                      <Textarea id="description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder={language === "ar" ? "وصف المنتج بالإنجليزية" : "Product description in English"}/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionAr">{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                      <Textarea id="descriptionAr" value={productForm.descriptionAr} onChange={(e) => setProductForm({ ...productForm, descriptionAr: e.target.value })} placeholder={language === "ar" ? "وصف المنتج بالعربية" : "Product description in Arabic"}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t("price", language)} *</Label>
                      <Input id="price" type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00"/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">{t("stock", language)}</Label>
                      <Input id="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} placeholder="100"/>
                    </div>
                  </div>

                  
                  <div className="space-y-2">
                    <Label htmlFor="main-image">{language === "ar" ? "الصورة الرئيسية" : "Main Image"} *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                      <Label htmlFor="main-image" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground"/>
                          <p className="text-sm font-medium">
                            {language === "ar" ? "اضغط لرفع الصورة الرئيسية" : "Click to upload main image"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "ar" ? "PNG, JPG حتى 5 ميجابايت" : "PNG, JPG up to 5MB"}
                          </p>
                        </div>
                      </Label>
                      <input id="main-image" type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden"/>
                      {productForm.image && (<div className="mt-4 relative w-full max-w-xs mx-auto">
                          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary">
                            <img src={sanitizeExternalUrl(productForm.image || "")} alt={language === "ar" ? "معاينة الصورة الرئيسية" : "Main image preview"} className="w-full h-full object-cover"/>
                          </div>
                          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => {
                        setProductForm({ ...productForm, image: "" });
                        setMainImageFile(null);
                    }}>
                            <X className="h-4 w-4"/>
                          </Button>
                        </div>)}
                    </div>
                  </div>

                  
                  <div className="space-y-2">
                    <Label htmlFor="additional-images">
                      {language === "ar" ? "الصور الإضافية (3 صور مطلوبة)" : "Additional Images (3 images required)"}
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                      {productForm.images.length < 3 ? (<Label htmlFor="additional-images" className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground"/>
                            <p className="text-sm font-medium">
                              {language === "ar"
                        ? `اضغط لرفع ${3 - productForm.images.length} صورة إضافية`
                        : `Click to upload ${3 - productForm.images.length} additional image(s)`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {language === "ar"
                        ? `PNG, JPG حتى 5 ميجابايت لكل صورة (${productForm.images.length}/3)`
                        : `PNG, JPG up to 5MB per image (${productForm.images.length}/3)`}
                            </p>
                          </div>
                        </Label>) : (<div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white"/>
                          </div>
                          <p className="text-sm font-medium text-green-600">
                            {language === "ar" ? "تم رفع جميع الصور (3/3)" : "All images uploaded (3/3)"}
                          </p>
                        </div>)}
                      <input id="additional-images" type="file" accept="image/*" multiple onChange={handleAdditionalImageUpload} className="hidden" disabled={productForm.images.length >= 3}/>
                      {productForm.images.length > 0 && (<div className="mt-4 grid grid-cols-3 gap-4">
                          {Array.from({ length: 3 }).map((_, index) => (<div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                              {productForm.images[index] ? (<>
                                  <img src={sanitizeExternalUrl(productForm.images[index] || "")} alt={language === "ar" ? `صورة إضافية ${index + 1}` : `Additional image ${index + 1}`} className="w-full h-full object-cover"/>
                                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => removeAdditionalImage(index)}>
                                    <X className="h-4 w-4"/>
                                  </Button>
                                </>) : (<div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
                                  <span className="text-xs text-gray-400">
                                    {language === "ar" ? `صورة ${index + 1}` : `Image ${index + 1}`}
                                  </span>
                                </div>)}
                            </div>))}
                        </div>)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{t("category", language)} *</Label>
                      <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر الفئة" : "Select category"}/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="T-Shirts">{language === "ar" ? "تي شيرت" : "T-Shirts"}</SelectItem>
                          <SelectItem value="Tank Tops">{language === "ar" ? "تانك توب" : "Tank Tops"}</SelectItem>
                          <SelectItem value="Tops">{language === "ar" ? "ترنك" : "Tops"}</SelectItem>
                          <SelectItem value="Blouses">{language === "ar" ? "بلوزة" : "Blouses"}</SelectItem>
                          <SelectItem value="Polo Shirts">{language === "ar" ? "بولو" : "Polo Shirts"}</SelectItem>
                          <SelectItem value="Hoodies">{language === "ar" ? "هودي" : "Hoodies"}</SelectItem>
                          <SelectItem value="Sweatshirts">{language === "ar" ? "سويشيرت" : "Sweatshirts"}</SelectItem>
                          <SelectItem value="Pants">{language === "ar" ? "بنطلون" : "Pants"}</SelectItem>
                          <SelectItem value="Jeans">{language === "ar" ? "جينز" : "Jeans"}</SelectItem>
                          <SelectItem value="Shorts">{language === "ar" ? "شورت" : "Shorts"}</SelectItem>
                          <SelectItem value="Jackets">{language === "ar" ? "جاكيت" : "Jackets"}</SelectItem>
                          <SelectItem value="Dresses">{language === "ar" ? "فستان" : "Dresses"}</SelectItem>
                          <SelectItem value="Skirts">{language === "ar" ? "تنورة" : "Skirts"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">{language === "ar" ? "الجنس" : "Gender"} *</Label>
                      <Select value={productForm.gender} onValueChange={(value) => setProductForm({ ...productForm, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر الجنس" : "Select gender"}/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Men">{language === "ar" ? "رجال" : "Men"}</SelectItem>
                          <SelectItem value="Women">{language === "ar" ? "نساء" : "Women"}</SelectItem>
                          <SelectItem value="Unisex">{language === "ar" ? "للجنسين" : "Unisex"}</SelectItem>
                          <SelectItem value="Kids">{language === "ar" ? "أطفال" : "Kids"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="season">{language === "ar" ? "الموسم" : "Season"} *</Label>
                      <Select value={productForm.season} onValueChange={(value) => setProductForm({ ...productForm, season: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر الموسم" : "Select season"}/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Summer">Summer</SelectItem>
                          <SelectItem value="Winter">Winter</SelectItem>
                          <SelectItem value="Spring">Spring</SelectItem>
                          <SelectItem value="Fall">Fall</SelectItem>
                          <SelectItem value="All Season">All Season</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="style">{language === "ar" ? "النمط" : "Style"} *</Label>
                      <Select value={productForm.style} onValueChange={(value) => setProductForm({ ...productForm, style: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر النمط" : "Select style"}/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Plain">Plain</SelectItem>
                          <SelectItem value="Graphic">Graphic</SelectItem>
                          <SelectItem value="Embroidered">Embroidered</SelectItem>
                          <SelectItem value="Printed">Printed</SelectItem>
                          <SelectItem value="Vintage">Vintage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occasion">{language === "ar" ? "المناسبة" : "Occasion"} *</Label>
                    <Select value={productForm.occasion} onValueChange={(value) => setProductForm({ ...productForm, occasion: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر المناسبة" : "Select occasion"}/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Formal">Formal</SelectItem>
                        <SelectItem value="Sport">Sport</SelectItem>
                        <SelectItem value="Classic">Classic</SelectItem>
                        <SelectItem value="Streetwear">Streetwear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="featured" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} className="rounded"/>
                    <Label htmlFor="featured" className="cursor-pointer">
                      {language === "ar" ? "منتج مميز" : "Featured Product"}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="active" checked={productForm.active} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} className="rounded"/>
                    <Label htmlFor="active" className="cursor-pointer">
                      {language === "ar" ? "نشط" : "Active"}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="newArrival" checked={productForm.newArrival || false} onChange={(e) => setProductForm({ ...productForm, newArrival: e.target.checked })} className="rounded"/>
                    <Label htmlFor="newArrival" className="cursor-pointer">
                      {language === "ar" ? "وصل جديد (New Arrival)" : "New Arrival"}
                    </Label>
                  </div>

                  
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="onSale" checked={productForm.onSale} onChange={(e) => setProductForm({ ...productForm, onSale: e.target.checked, salePercentage: e.target.checked ? productForm.salePercentage : "0" })} className="rounded"/>
                      <Label htmlFor="onSale" className="cursor-pointer font-semibold">
                        {language === "ar" ? "تفعيل التخفيض (Sale)" : "Enable Sale"}
                      </Label>
                    </div>
                    
                    {productForm.onSale && (<div className="space-y-2 pl-6 border-l-2 border-primary">
                        <Label htmlFor="salePercentage">
                          {language === "ar" ? "نسبة الخصم (%)" : "Discount Percentage (%)"}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input id="salePercentage" type="number" min="0" max="100" value={productForm.salePercentage} onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                            setProductForm({ ...productForm, salePercentage: value });
                        }
                    }} placeholder="0" className="w-32"/>
                          <span className="text-sm text-muted-foreground">
                            {productForm.price && productForm.salePercentage ? (<>
                                {language === "ar" ? "السعر بعد الخصم:" : "Price after discount:"}{" "}
                                <span className="font-bold text-primary">
                                  ${(parseFloat(productForm.price) * (1 - parseFloat(productForm.salePercentage || "0") / 100)).toFixed(2)}
                                </span>
                              </>) : null}
                          </span>
                        </div>
                      </div>)}
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الأحجام المتاحة" : "Available Sizes"}</Label>
                    <div className="flex flex-wrap gap-2">
                      {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (<button key={size} type="button" onClick={() => {
                        if (productForm.sizes.includes(size)) {
                            setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== size) });
                        }
                        else {
                            setProductForm({ ...productForm, sizes: [...productForm.sizes, size] });
                        }
                    }} className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${productForm.sizes.includes(size)
                        ? "bg-rose-500 text-white border-rose-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-rose-300 hover:bg-rose-50"}`}>
                          {size}
                        </button>))}
                    </div>
                    {productForm.sizes.length > 0 && (<p className="text-sm text-muted-foreground">
                        {language === "ar"
                        ? `تم اختيار ${productForm.sizes.length} حجم`
                        : `${productForm.sizes.length} size(s) selected`}
                      </p>)}
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الألوان المتاحة" : "Available Colors"}</Label>
                    <div className="flex flex-wrap gap-3">
                      {COLOR_OPTIONS.map((option) => {
                    const isSelected = productColorSet.has(option.id);
                    const label = language === "ar" ? option.label.ar : option.label.en;
                    return (<button key={option.id} type="button" onClick={() => {
                            if (isSelected) {
                                setProductForm({
                                    ...productForm,
                                    colors: productForm.colors.filter((color) => normalizeColorKey(color) !== option.id),
                                });
                            }
                            else {
                                setProductForm({ ...productForm, colors: [...productForm.colors, option.id] });
                            }
                        }} className="flex flex-col items-center gap-1 text-xs" title={label} aria-label={label}>
                            <span className={`h-8 w-8 rounded-full border transition-all ${option.needsBorder ? "border-border" : "border-transparent"} ${isSelected
                            ? "ring-2 ring-black ring-offset-2 ring-offset-background"
                            : "hover:scale-105"}`} style={{ backgroundColor: option.value }}/>
                            <span className={isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
                          </button>);
                })}
                    </div>
                    {productForm.colors.length > 0 && (<p className="text-sm text-muted-foreground">
                        {language === "ar"
                        ? `تم اختيار ${productForm.colors.length} لون`
                        : `${productForm.colors.length} color(s) selected`}
                      </p>)}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowProductModal(false)}>
                    {t("cancel", language)}
                  </Button>
                  <Button onClick={async () => {
                    if (!productForm.name || !productForm.price || !productForm.image || !productForm.category || !productForm.gender || !productForm.season || !productForm.style || !productForm.occasion) {
                        toast({
                            title: "Error",
                            description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
                            variant: "destructive",
                        });
                        return;
                    }
                    if (productForm.images.length !== 3) {
                        toast({
                            title: "Error",
                            description: language === "ar" ? "يجب إضافة 3 صور إضافية بالضبط" : "You must add exactly 3 additional images",
                            variant: "destructive",
                        });
                        return;
                    }
                    try {
                        if (isEditingProduct && selectedProduct) {
                            const updateData = {
                                name: productForm.name,
                                nameAr: productForm.nameAr || undefined,
                                description: productForm.description || undefined,
                                descriptionAr: productForm.descriptionAr || undefined,
                                price: parseFloat(productForm.price) || 0,
                                image: productForm.image,
                                images: productForm.images.length > 0 ? productForm.images : undefined,
                                category: productForm.category,
                                gender: productForm.gender,
                                season: productForm.season,
                                style: productForm.style,
                                occasion: productForm.occasion,
                                sizes: productForm.sizes.length > 0 ? productForm.sizes : undefined,
                                colors: productForm.colors.length > 0 ? productForm.colors : undefined,
                                stock: parseInt(productForm.stock) || 100,
                                featured: productForm.featured,
                                active: productForm.active,
                                onSale: productForm.onSale,
                                salePercentage: productForm.onSale ? parseFloat(productForm.salePercentage || "0") : undefined,
                            };
                            await productsAdminApi.updateProduct(selectedProduct._id || selectedProduct.id?.toString() || "", updateData);
                            toast({
                                title: language === "ar" ? "تم التحديث" : "Updated",
                                description: language === "ar" ? "تم تحديث المنتج بنجاح" : "Product updated successfully",
                            });
                        }
                        else {
                            await productsAdminApi.createProduct({
                                name: productForm.name,
                                nameAr: productForm.nameAr || undefined,
                                description: productForm.description || undefined,
                                descriptionAr: productForm.descriptionAr || undefined,
                                price: parseFloat(productForm.price),
                                image: productForm.image,
                                images: productForm.images.length > 0 ? productForm.images : undefined,
                                category: productForm.category,
                                gender: productForm.gender,
                                season: productForm.season,
                                style: productForm.style,
                                occasion: productForm.occasion,
                                sizes: productForm.sizes.length > 0 ? productForm.sizes : undefined,
                                colors: productForm.colors.length > 0 ? productForm.colors : undefined,
                                stock: parseInt(productForm.stock) || 100,
                                featured: productForm.featured,
                                active: productForm.active,
                                onSale: productForm.onSale,
                                salePercentage: productForm.onSale ? parseFloat(productForm.salePercentage || "0") : undefined,
                            });
                            toast({
                                title: language === "ar" ? "تمت الإضافة" : "Added",
                                description: language === "ar" ? "تم إضافة المنتج بنجاح" : "Product added successfully",
                            });
                        }
                        setShowProductModal(false);
                        loadProducts();
                    }
                    catch (error) {
                        toast({
                            title: "Error",
                            description: error.message || "Failed to save product",
                            variant: "destructive",
                        });
                    }
                }}>
                    {t("save", language)}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>)}

          </>)}

        
      {showOrderDetails && selectedOrder && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle>
                    {language === "ar" ? "تفاصيل الطلب" : "Order Details"} - {selectedOrder.orderNumber}
                  </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowOrderDetails(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm text-muted-foreground">{language === "ar" ? "العميل" : "Customer"}</Label>
                    <p className="font-medium">
                      {typeof selectedOrder.user === "object" ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : "N/A"}
                    </p>
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ الطلب" : "Order Date"}</Label>
                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{language === "ar" ? "المبلغ" : "Amount"}</Label>
                    <p className="font-medium">${selectedOrder.total.toFixed(2)}</p>
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground">{t("status", language)}</Label>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {t(selectedOrder.status, language)}
                    </Badge>
                  </div>
                </div>

              <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    {language === "ar" ? "تحديث الحالة" : "Update Status"}
                  </Label>
                <Select value={selectedOrder.status} onValueChange={(value) => updateOrderStatus(selectedOrder._id, value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="pending">{t("pending", language)}</SelectItem>
                      <SelectItem value="processing">{t("processing", language)}</SelectItem>
                      <SelectItem value="shipped">{t("shipped", language)}</SelectItem>
                      <SelectItem value="delivered">{t("delivered", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder.status === "shipped" && (<div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {language === "ar" ? "رقم التتبع" : "Tracking Number"}
                    </Label>
                    <Input placeholder={language === "ar" ? "أدخل رقم التتبع" : "Enter tracking number"} defaultValue={selectedOrder.trackingNumber} onBlur={(e) => {
                    if (e.target.value) {
                        updateOrderStatus(selectedOrder._id, selectedOrder.status, e.target.value);
                    }
                }}/>
                </div>)}


              {selectedOrder.items && selectedOrder.items.length > 0 && (<div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {language === "ar" ? "العناصر" : "Items"}
                    </Label>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (<div key={`${item._id || item.name}-${index}`} className="flex items-center gap-4 p-3 border rounded">
                          <img src={sanitizeExternalUrl(item.image || "")} alt={item.name} className="w-12 h-12 object-cover rounded"/>
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {language === "ar" ? "الكمية" : "Quantity"}: {item.quantity} • {language === "ar" ? "الحجم" : "Size"}: {item.size} • {language === "ar" ? "اللون" : "Color"}: {item.color}
                            </p>
                            {item.notes && (<p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">{language === "ar" ? "ملاحظات" : "Notes"}:</span> {item.notes}
                              </p>)}
                            {item.isCustom && item.design && (<div className="mt-2">
                                <Button type="button" variant="link" className="h-auto p-0 text-xs text-rose-600" onClick={() => openDesignPreview(item)}>
                                  {language === "ar" ? "عرض التصميم" : "View design"}
                                </Button>
                              </div>)}
                          </div>
                          <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>))}
                    </div>
                  </div>)}


              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setShowOrderDetails(false)}>
                    {t("save", language)}
                </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowOrderDetails(false)}>
                    {t("cancel", language)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>)}

      <Dialog open={showEditOrder} onOpenChange={setShowEditOrder}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "Update Order Status & Tracking" : "Update Order Status & Tracking"}</DialogTitle>
            <DialogDescription>
              {selectedOrder && `${language === "ar" ? "Order" : "Order"}: ${selectedOrder.orderNumber}`}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (<div className="space-y-4">
              <div>
                <Label>{language === "ar" ? "Order Status" : "Order Status"}</Label>
                <Select value={editOrderStatus} onValueChange={(value) => setEditOrderStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{language === "ar" ? "Pending" : "Pending"}</SelectItem>
                    <SelectItem value="processing">{language === "ar" ? "Processing" : "Processing"}</SelectItem>
                    <SelectItem value="shipped">{language === "ar" ? "Shipped" : "Shipped"}</SelectItem>
                    <SelectItem value="delivered">{language === "ar" ? "Delivered" : "Delivered"}</SelectItem>
                    <SelectItem value="cancelled">{language === "ar" ? "Cancelled" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{language === "ar" ? "Tracking Number" : "Tracking Number"}</Label>
                <Input value={editTrackingNumber} onChange={(e) => setEditTrackingNumber(e.target.value)} placeholder={language === "ar" ? "Enter tracking number" : "Enter tracking number"} />
              </div>

              <div>
                <Label>{language === "ar" ? "Carrier" : "Carrier"}</Label>
                <Input value={editCarrier} onChange={(e) => setEditCarrier(e.target.value)} placeholder={language === "ar" ? "e.g., DHL, FedEx, UPS" : "e.g., DHL, FedEx, UPS"} />
              </div>

              <div>
                <Label>{language === "ar" ? "Estimated Delivery Date" : "Estimated Delivery Date"}</Label>
                <Input type="date" value={editEstimatedDelivery} onChange={(e) => setEditEstimatedDelivery(e.target.value)} />
              </div>

              <div>
                <Label>{language === "ar" ? "Current Location" : "Current Location"}</Label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder={language === "ar" ? "Nablus - Rafidia" : "e.g., Nablus - Rafidia"} />
              </div>

              <div>
                <Label>{language === "ar" ? "Note" : "Note"}</Label>
                <Textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder={language === "ar" ? "Add a note about the order status..." : "Add a note about the order status..."} className="min-h-[100px]" />
              </div>
            </div>)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditOrder(false)}>
              {language === "ar" ? "Cancel" : "Cancel"}
            </Button>
            <Button onClick={handleUpdateOrderStatus}>
              {language === "ar" ? "Save" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(designPreviewItem)} onOpenChange={(open) => {
            if (!open) {
                setDesignPreviewItem(null);
            }
        }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "معاينة التصميم" : "Design preview"}</DialogTitle>
            <DialogDescription>
              {designPreviewItem?.name}
            </DialogDescription>
          </DialogHeader>
          {designPreviewItem && (<div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button size="sm" variant={designPreviewSide === "front" ? "default" : "outline"} onClick={() => setDesignPreviewSide("front")}>
                  {language === "ar" ? "أمام" : "Front"}
                </Button>
                <Button size="sm" variant={designPreviewSide === "back" ? "default" : "outline"} onClick={() => setDesignPreviewSide("back")}>
                  {language === "ar" ? "خلف" : "Back"}
                </Button>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
                <div className="relative aspect-[4/5]">
                  {previewBaseImage ? (<img src={sanitizeExternalUrl(previewBaseImage || "")} alt={designPreviewItem.name} className="h-full w-full object-contain"/>) : (<div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      {language === "ar" ? "لا توجد معاينة" : "No preview available"}
                    </div>)}
                  <div className="absolute" style={previewArea}>
                    {previewSideData?.uploadedImage && (<div className="absolute inset-0">
                        <div className="absolute" style={{
                    left: `${previewSideData?.imagePosition?.x ?? 50}%`,
                    top: `${previewSideData?.imagePosition?.y ?? 50}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${previewSideData?.imageSize || 120}px`,
                    height: `${previewSideData?.imageSize || 120}px`,
                    maxWidth: "100%",
                    maxHeight: "100%",
                }}>
                          <img src={sanitizeExternalUrl(previewSideData.uploadedImage || "")} alt="Design asset" className="h-full w-full object-contain"/>
                        </div>
                      </div>)}
                    {previewSideData?.textValue && (<div className="absolute inset-0 flex items-center justify-center p-2">
                        <span className="w-full font-bold leading-tight break-words" style={{
                    color: previewSideData?.textColor || "#000000",
                    fontSize: `${previewSideData?.textFontSize || 16}px`,
                    textAlign: previewSideData?.textAlign || "center",
                    fontFamily: previewSideData?.textFontFamily || "Tajawal",
                    textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                }}>
                          {previewSideData.textValue}
                        </span>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>
      </div>
      <StaffChatWidget mode="employee" />
    </EmployeeLayout>);
}
