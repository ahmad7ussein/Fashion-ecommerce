"use client";
import { Suspense, useState, useEffect, useRef, useMemo, useCallback, Fragment } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign, Eye, Edit, Trash2, Download, Plus, Star, CheckCircle, XCircle, TrendingUp, X, UserPlus, MessageSquare, Mail, Send, Upload, Truck, Check, Search, } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppLoader } from "@/components/ui/app-loader";
import { productsAdminApi } from "@/lib/api/productsAdmin";
import { studioProductsApi } from "@/lib/api/studioProducts";
import { useAuth } from "@/lib/auth";
import { adminApi } from "@/lib/api/admin";
import { ordersApi } from "@/lib/api/orders";
import { userPreferencesApi } from "@/lib/api/userPreferences";
import { reviewsApi } from "@/lib/api/reviews";
import { accountDeletionsApi } from "@/lib/api/accountDeletions";
import { getContactMessages, updateContactMessage, deleteContactMessage } from "@/lib/api/contact";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/language";
import { sanitizeExternalUrl } from "@/lib/api";
import { t } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StaffChatWidget } from "@/components/staff-chat-widget";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from "recharts";
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
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
const COLOR_OPTION_MAP = new Map(COLOR_OPTIONS.map((option) => [option.id, option]));
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
const getColorLabel = (colorId, language) => {
    const option = COLOR_OPTION_MAP.get(normalizeColorKey(colorId));
    if (!option)
        return colorId;
    return language === "ar" ? option.label.ar : option.label.en;
};
const exportToExcel = (data, reportType, language) => {
    if (!data || data.length === 0) {
        return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
        link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(url);
};
function AdminDashboardContent() {
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [salesReport, setSalesReport] = useState({ salesByDay: [], summary: { total: 0, count: 0 } });
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewStatusFilter, setReviewStatusFilter] = useState("pending");
    const [accountDeletionRequests, setAccountDeletionRequests] = useState([]);
    const [accountDeletionLoading, setAccountDeletionLoading] = useState(false);
    const [accountDeletionStatusFilter, setAccountDeletionStatusFilter] = useState("pending");
    const [pendingAccountDeletionCount, setPendingAccountDeletionCount] = useState(0);
    const [contactMessages, setContactMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messageStatusFilter, setMessageStatusFilter] = useState("all");
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMessageDetails, setShowMessageDetails] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productSearchQuery, setProductSearchQuery] = useState("");
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
        inCollection: false,
    });
    const [newImageUrl, setNewImageUrl] = useState("");
    const [newSize, setNewSize] = useState("");
    const [newColor, setNewColor] = useState("");
    const [mainImageFile, setMainImageFile] = useState(null);
    const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
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
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [chartSettings, setChartSettings] = useState({
        revenueChartType: 'bar',
        ordersChartType: 'pie',
        dateRange: '30d',
    });
    const [employeeForm, setEmployeeForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
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
        const metadataBase = item?.designMetadata?.studio?.data;
        const explicitBase = side === "back"
            ? item?.baseBackUrl || metadataBase?.baseBackUrl
            : item?.baseFrontUrl || metadataBase?.baseFrontUrl;
        const viewMockups = studioProduct?.viewMockups || {};
        if (side === "back") {
            return explicitBase || viewMockups.back || studioProduct?.baseMockupUrl || item?.image || "";
        }
        return explicitBase || viewMockups.front || studioProduct?.baseMockupUrl || item?.image || "";
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
    const [showEditOrder, setShowEditOrder] = useState(false);
    const [editOrderStatus, setEditOrderStatus] = useState("pending");
    const [editTrackingNumber, setEditTrackingNumber] = useState("");
    const [editCarrier, setEditCarrier] = useState("");
    const [editEstimatedDelivery, setEditEstimatedDelivery] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editNote, setEditNote] = useState("");
    const [orderTrackingLoading, setOrderTrackingLoading] = useState(false);
    const [orderStatusFilter, setOrderStatusFilter] = useState("all");
    const { user, logout, isLoading: authLoading } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const productColorSet = new Set(productForm.colors.map(normalizeColorKey));
    const studioColorList = parseColorList(studioForm.colors);
    const studioColorSet = new Set(studioColorList.map(normalizeColorKey));
    const toPercent = (value) => Math.round((Number(value) || 0) * 100);
    const fromPercent = (value) => {
        const numeric = Number(value);
        if (Number.isNaN(numeric))
            return 0;
        return Math.max(0, Math.min(100, numeric)) / 100;
    };
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
    const hasCheckedAuth = useRef(false);
    useEffect(() => {
        if (authLoading) {
            return;
        }
        if (hasCheckedAuth.current)
            return;
        hasCheckedAuth.current = true;
        console.log(" Admin page - Auth loaded. User:", user?.email);
        console.log(" Admin page - User role:", user?.role);
        if (user && user.role !== "admin") {
            console.log("User is not admin, redirecting to home. Role:", user.role);
            window.location.href = "/";
            return;
        }
        if (!user && !authLoading) {
            console.log("No user found, redirecting to login");
            window.location.href = "/login";
            return;
        }
        if (user && user.role === "admin") {
            console.log("Admin user confirmed, showing dashboard");
        }
    }, [user, authLoading, router]);
    useEffect(() => {
        if (user && user.role === 'admin') {
            loadDashboardData();
            loadUserPreferences();
            refreshPendingAccountDeletionCount();
        }
    }, [user]);
    const loadUserPreferences = async () => {
        try {
            const preferences = await userPreferencesApi.getPreferences();
            if (preferences) {
                if (!tabParam && preferences.dashboardPreferences?.activeTab) {
                    setActiveTab(preferences.dashboardPreferences.activeTab);
                }
                const chartSettings = preferences.dashboardPreferences?.chartSettings;
                if (chartSettings && typeof chartSettings === 'object') {
                    setChartSettings({
                        revenueChartType: (chartSettings.revenueChartType && ['line', 'bar', 'area'].includes(chartSettings.revenueChartType))
                            ? chartSettings.revenueChartType
                            : 'bar',
                        ordersChartType: (chartSettings.ordersChartType && ['pie', 'bar', 'line'].includes(chartSettings.ordersChartType))
                            ? chartSettings.ordersChartType
                            : 'pie',
                        dateRange: chartSettings.dateRange || '30d',
                    });
                }
                if (preferences.theme && preferences.theme !== 'system') {
                    const themeValue = preferences.theme;
                    if (themeValue === 'light' || themeValue === 'dark' || themeValue === 'system') {
                        setTheme(themeValue);
                    }
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
        if (activeTab === "customers" && user) {
            loadCustomers();
        }
    }, [activeTab, user]);
    useEffect(() => {
        if (activeTab === "studioProducts" && user) {
            loadStudioProducts();
        }
    }, [activeTab, user]);
    useEffect(() => {
        if (activeTab === "staff" && user) {
            loadStaff();
        }
    }, [activeTab, user]);
    const loadStaff = async () => {
        try {
            setLoading(true);
            console.log("Loading staff from database...");
            const staffData = await adminApi.getAllUsers({ role: 'all', limit: 100 });
            const staff = (staffData.data || []).filter((u) => u.role === 'admin' || u.role === 'employee');
            console.log("Staff loaded:", {
                total: staff.length,
                admins: staff.filter((u) => u.role === 'admin').length,
                employees: staff.filter((u) => u.role === 'employee').length,
            });
            setUsers(staff);
        }
        catch (error) {
            console.error("Error loading staff:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load staff",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (activeTab === "reviews" && user) {
            loadReviews();
        }
    }, [activeTab, reviewStatusFilter, user]);
    useEffect(() => {
        if (activeTab === "accountDeletions" && user) {
            loadAccountDeletionRequests();
        }
    }, [activeTab, accountDeletionStatusFilter, user]);
    const loadContactMessages = async () => {
        try {
            setMessagesLoading(true);
            const response = await getContactMessages({
                status: messageStatusFilter === "all" ? undefined : messageStatusFilter,
                limit: 50,
            });
            setContactMessages(response.data || []);
        }
        catch (error) {
            toast({
                title: language === "ar" ? "خطأ" : "Error",
                description: error.message || (language === "ar" ? "فشل تحميل الرسائل" : "Failed to load messages"),
                variant: "destructive",
            });
        }
        finally {
            setMessagesLoading(false);
        }
    };
    useEffect(() => {
        if (activeTab === "messages" && user) {
            loadContactMessages();
        }
    }, [activeTab, messageStatusFilter, user]);
    useEffect(() => {
        if (activeTab === "tracking" && user) {
            loadOrderTracking();
        }
    }, [activeTab, orderStatusFilter, user]);
    useEffect(() => {
        if (!authLoading && (!user || user.role !== "admin")) {
            router.replace("/");
        }
    }, [user, authLoading, router]);
    useEffect(() => {
        if (!user)
            return;
        const savePreferences = async () => {
            try {
                const preferencesToSave = {
                    dashboardPreferences: {
                        activeTab: activeTab || 'overview',
                        chartSettings: {
                            revenueChartType: (chartSettings.revenueChartType && ['line', 'bar', 'area'].includes(chartSettings.revenueChartType))
                                ? chartSettings.revenueChartType
                                : 'bar',
                            ordersChartType: (chartSettings.ordersChartType && ['pie', 'bar', 'line'].includes(chartSettings.ordersChartType))
                                ? chartSettings.ordersChartType
                                : 'pie',
                            dateRange: chartSettings.dateRange || '30d',
                            selectedMetrics: [],
                        },
                        tableSettings: {
                            pageSize: 10,
                            sortBy: 'createdAt',
                            sortOrder: 'desc',
                        },
                    },
                    sidebarPreferences: {
                        collapsed: false,
                        width: 256,
                    },
                    theme: (theme === 'light' || theme === 'dark' || theme === 'system')
                        ? theme
                        : 'system',
                    language: (language && ['en', 'ar'].includes(language)) ? language : 'en',
                };
                await userPreferencesApi.updatePreferences(preferencesToSave);
            }
            catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Failed to save preferences:", error?.message || error);
                }
            }
        };
        const timeoutId = setTimeout(savePreferences, 1000);
        return () => clearTimeout(timeoutId);
    }, [activeTab, theme, language, chartSettings, user]);
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
    useEffect(() => {
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [tabParam, activeTab]);
    const loadProducts = useCallback(async () => {
        try {
            setProductsLoading(true);
            console.log("Loading products...");
            const response = await productsAdminApi.getAllProducts({
                limit: 10,
                page: 1
            });
            const productsList = Array.isArray(response.data) ? response.data : [];
            console.log("Products loaded:", productsList.length);
            setProducts(productsList);
            setProductsLoading(false);
            if (productsList.length > 0 && response.total && response.total > 10) {
                console.log(`Will load remaining ${response.total - 10} products in background...`);
                const chunks = Math.ceil((response.total - 10) / 10);
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
                                console.log(`Loaded chunk ${page}: ${chunkProducts.length} products`);
                            }
                        }).catch((err) => {
                            console.warn(`Failed to load chunk ${page}:`, err);
                        });
                    }, (i + 1) * 1000);
                }
            }
        }
        catch (error) {
            console.error("Error loading products:", error);
            const isDatabaseTimeout = error.message?.includes("Database connection timeout") ||
                error.message?.includes("timeout") ||
                error.status === 503 ||
                error.status === 504;
            if (isDatabaseTimeout) {
                toast({
                    title: language === "ar" ? "انتهت مهلة الاتصال" : "Connection Timeout",
                    description: language === "ar"
                        ? "قاعدة البيانات تستغرق وقتاً طويلاً. جاري المحاولة مع عدد أقل من المنتجات..."
                        : "Database is taking too long. Retrying with fewer products...",
                    variant: "destructive",
                });
                setTimeout(async () => {
                    try {
                        const retryResponse = await productsAdminApi.getAllProducts({ limit: 5, page: 1 });
                        const retryProducts = Array.isArray(retryResponse.data) ? retryResponse.data : [];
                        setProducts(retryProducts);
                        setProductsLoading(false);
                        toast({
                            title: language === "ar" ? "تم التحميل" : "Loaded",
                            description: language === "ar"
                                ? `تم تحميل ${retryProducts.length} منتج (من أصل ${retryResponse.total || '?'})`
                                : `Loaded ${retryProducts.length} products (of ${retryResponse.total || '?'})`,
                        });
                    }
                    catch (retryError) {
                        console.error("Retry also failed:", retryError);
                        toast({
                            title: language === "ar" ? "فشل التحميل" : "Load Failed",
                            description: language === "ar"
                                ? "فشل تحميل المنتجات. يرجى التحقق من اتصال قاعدة البيانات."
                                : "Failed to load products. Please check database connection.",
                            variant: "destructive",
                        });
                    }
                }, 2000);
            }
            else {
                setProductsLoading(false);
                toast({
                    title: "Error",
                    description: error.message || "Failed to load products",
                    variant: "destructive",
                });
            }
        }
        finally {
            setProductsLoading(false);
        }
    }, [language, toast]);
    useEffect(() => {
        if (activeTab === "products" && user) {
            loadProducts();
        }
    }, [activeTab, user, loadProducts]);
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
    };// this is computed value -in the three level -
    //1- remove the duplication 
    const filteredProducts = useMemo(() => {
        const uniqueProducts = products.filter((product, index, self) => {
            const id = product._id?.toString() || product.id?.toString();
            return id && index === self.findIndex(p => (p._id?.toString() || p.id?.toString()) === id);// check all product this is a first show ?
        });// 2- search - filter-  in the query 
        if (!productSearchQuery.trim())
            return uniqueProducts;
        const query = productSearchQuery.toLowerCase();
        return uniqueProducts.filter((product) => {
            const name = (language === "ar" && product.nameAr ? product.nameAr : product.name)?.toLowerCase() || "";
            const category = product.category?.toLowerCase() || "";
            const description = product.description?.toLowerCase() || "";
            return name.includes(query) || category.includes(query) || description.includes(query);
        });// her filtering (male/female/kids)
    }, [products, productSearchQuery, language]);
    const normalizeGender = (value) => value?.toLowerCase().trim() || "";
    const groupedProducts = useMemo(() => {
        const groups = {
            men: [],
            women: [],
            kids: [],
            unisex: [],
            other: [],
        };
        filteredProducts.forEach((product) => {
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
    }, [filteredProducts]);
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
    }, [groupedProducts, language]);//parallel loding 
    const loadDashboardData = async () => {
        try {
            if (!user || user.role !== 'admin') {
                console.warn("Cannot load dashboard data: User is not admin");
                return;
            }
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) {
                console.warn("Cannot load dashboard data: No token found");
                toast({
                    title: language === "ar" ? "خطأ في المصادقة" : "Authentication Error",
                    description: language === "ar" ? "يرجى تسجيل الدخول مرة أخرى" : "Please log in again",
                    variant: "destructive",
                });
                logout();
                router.replace("/login");
                return;
            }
            setLoading(true);
            console.log("Loading dashboard data...");
            const [statsData, ordersData, usersData, salesData] = await Promise.all([
                adminApi.getDashboardStats(),
                ordersApi.getAllOrders({ limit: 50 }),
                adminApi.getAllUsers({ role: 'all', limit: 100 }),
                adminApi.getSalesReport().catch(() => ({ salesByDay: [], summary: { total: 0, count: 0 } })),
            ]);
            console.log("Dashboard data loaded:", {
                stats: statsData,
                ordersCount: Array.isArray(ordersData) ? ordersData.length : 0,
                usersCount: usersData.data?.length || 0,
                customersCount: usersData.data?.filter((u) => u.role === 'customer').length || 0,
            });
            setStats(statsData);
            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setUsers(usersData.data || []);
            setSalesReport(salesData);
        }
        catch (error) {
            console.error("Error loading dashboard data:", error);
            if (error.status === 401 || error.message?.includes("Not authorized") || error.message?.includes("Unauthorized")) {
                toast({
                    title: language === "ar" ? "انتهت صلاحية الجلسة" : "Session Expired",
                    description: language === "ar" ? "يرجى تسجيل الدخول مرة أخرى" : "Please log in again",
                    variant: "destructive",
                });
                logout();
                router.replace("/login");
                return;
            }
            toast({
                title: "Error",
                description: error.message || "Failed to load dashboard data",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const loadOrderTracking = async () => {
        try {
            setOrderTrackingLoading(true);
            const status = orderStatusFilter === "all" ? undefined : orderStatusFilter;
            const ordersData = await ordersApi.getAllOrders({
                status,
                limit: 100
            });
            setOrders(Array.isArray(ordersData) ? ordersData : []);
        }
        catch (error) {
            console.error("Error loading orders:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load orders",
                variant: "destructive",
            });
        }
        finally {
            setOrderTrackingLoading(false);
        }
    };
    const viewOrderDetails = async (orderId) => {
        try {
            const order = await ordersApi.getOrder(orderId);
            setSelectedOrder(order);
            setShowOrderDetails(true);
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to load order details",
                variant: "destructive",
            });
        }
    };
    const openEditOrder = async (orderId) => {
        try {
            const order = await ordersApi.getOrder(orderId);
            setSelectedOrder(order);
            setEditOrderStatus(order.status);
            setEditTrackingNumber(order.trackingNumber || "");
            setShowEditOrder(true);
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to load order",
                variant: "destructive",
            });
        }
    };
    const handleUpdateOrderStatus = async () => {
        if (!selectedOrder)
            return;
        try {
            await ordersApi.updateOrderStatus(selectedOrder._id, {
                status: editOrderStatus,
                trackingNumber: editTrackingNumber || undefined,
            });
            toast({
                title: "Success",
                description: language === "ar" ? "تم تحديث حالة الطلب بنجاح" : "Order status updated successfully",
            });
            setShowEditOrder(false);
            setSelectedOrder(null);
            loadDashboardData();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update order status",
                variant: "destructive",
            });
        }
    };
    const handleDeleteOrder = async (orderId) => {
        if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الطلب؟" : "Are you sure you want to delete this order?")) {
            return;
        }
        try {
            await ordersApi.deleteOrder(orderId);
            toast({
                title: "Success",
                description: language === "ar" ? "تم حذف الطلب بنجاح" : "Order deleted successfully",
            });
            loadDashboardData();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete order",
                variant: "destructive",
            });
        }
    };
    const exportOrders = () => {
        if (orders.length === 0) {
            toast({
                title: "Warning",
                description: language === "ar" ? "لا توجد طلبات للتصدير" : "No orders to export",
                variant: "default",
            });
            return;
        }
        const headers = [
            language === "ar" ? "رقم الطلب" : "Order ID",
            language === "ar" ? "العميل" : "Customer",
            language === "ar" ? "الإجمالي" : "Total",
            language === "ar" ? "الحالة" : "Status",
            language === "ar" ? "التاريخ" : "Date",
            language === "ar" ? "طريقة الدفع" : "Payment Method",
            language === "ar" ? "حالة الدفع" : "Payment Status",
        ];
        const rows = orders.map(order => [
            order.orderNumber,
            typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A",
            `$${order.total.toFixed(2)}`,
            order.status,
            new Date(order.createdAt).toLocaleDateString(),
            order.paymentInfo.method || "N/A",
            order.paymentInfo.status || "N/A",
        ]);
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `orders_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(url);
        toast({
            title: "Success",
            description: language === "ar" ? "تم تصدير الطلبات بنجاح" : "Orders exported successfully",
        });
    };
    const loadCustomers = async () => {
        try {
            setLoading(true);
            console.log("Loading customers from database...");
            console.log("API Call: getAllUsers({ role: 'customer', limit: 100 })");
            const customersData = await adminApi.getAllUsers({ role: 'customer', limit: 100 });
            console.log("Full response from getAllUsers:", JSON.stringify(customersData, null, 2));
            console.log("Customers loaded:", {
                total: customersData.total,
                page: customersData.page,
                pages: customersData.pages,
                customersCount: customersData.data?.length || 0,
                customers: customersData.data,
            });
            if (!customersData.data || customersData.data.length === 0) {
                console.warn("No customers found in response!");
                toast({
                    title: language === "ar" ? "تحذير" : "Warning",
                    description: language === "ar" ? "لم يتم العثور على عملاء في قاعدة البيانات" : "No customers found in database",
                    variant: "default",
                });
            }
            setUsers(customersData.data || []);
        }
        catch (error) {
            console.error("Error loading customers:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });
            toast({
                title: "Error",
                description: error.message || "Failed to load customers",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    const loadReviews = async () => {
        setReviewsLoading(true);
        try {
            console.log("Loading reviews...", { status: reviewStatusFilter });
            const response = await reviewsApi.getAllReviews({
                status: reviewStatusFilter === "all" ? undefined : reviewStatusFilter,
                limit: 50
            });
            console.log("Reviews loaded:", response.data.length);
            setReviews(response.data);
        }
        catch (error) {
            console.error("Error loading reviews:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load reviews",
                variant: "destructive",
            });
        }
        finally {
            setReviewsLoading(false);
        }
    };
    const refreshPendingAccountDeletionCount = async () => {
        try {
            const response = await accountDeletionsApi.getAllRequests({
                status: "pending",
                limit: 1,
                page: 1,
            });
            setPendingAccountDeletionCount(response.total || 0);
        }
        catch (error) {
            console.error("Error loading pending account deletion count:", error);
        }
    };
    const loadAccountDeletionRequests = async () => {
        setAccountDeletionLoading(true);
        try {
            const response = await accountDeletionsApi.getAllRequests({
                status: accountDeletionStatusFilter === "all" ? undefined : accountDeletionStatusFilter,
                limit: 50,
            });
            setAccountDeletionRequests(response.data || []);
            if (accountDeletionStatusFilter === "pending") {
                setPendingAccountDeletionCount(response.total || (response.data || []).length);
            }
        }
        catch (error) {
            console.error("Error loading account deletion requests:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load account deletion requests",
                variant: "destructive",
            });
        }
        finally {
            setAccountDeletionLoading(false);
        }
    };
    const handleReviewStatusUpdate = async (reviewId, status) => {
        try {
            await reviewsApi.updateReviewStatus(reviewId, status);
            toast({
                title: "Success",
                description: `Review ${status === "approved" ? "approved" : "rejected"} successfully`,
            });
            loadReviews();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update review status",
                variant: "destructive",
            });
        }
    };
    const handleAccountDeletionStatusUpdate = async (requestId, status) => {
        try {
            await accountDeletionsApi.updateStatus(requestId, status);
            toast({
                title: "Success",
                description: `Account deletion request ${status === "approved" ? "approved" : "rejected"} successfully`,
            });
            await loadAccountDeletionRequests();
            await refreshPendingAccountDeletionCount();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to update account deletion request",
                variant: "destructive",
            });
        }
    };
    const handleDeleteUser = async (id, options = {}) => {
        const { confirmMessage, onSuccess } = options;
        const message = confirmMessage || (language === "ar"
            ? "هل أنت متأكد من حذف هذا المستخدم؟"
            : "Are you sure you want to delete this user?");
        if (!confirm(message))
            return;
        try {
            await adminApi.deleteUser(id);
            toast({ title: "Success", description: "User deleted successfully" });
            if (typeof onSuccess === "function") {
                onSuccess();
            }
            else if (activeTab === "customers") {
                loadCustomers();
            }
            else if (activeTab === "staff") {
                loadStaff();
            }
            else {
                loadDashboardData();
            }
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete user",
                variant: "destructive",
            });
        }
    };
    const salesByDay = Array.isArray(salesReport?.salesByDay) ? salesReport.salesByDay : [];
    const sumSalesByRange = (startDate, endDate) => {
        if (!startDate || !endDate)
            return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return salesByDay.reduce((total, day) => {
            if (!day?._id)
                return total;
            const dayDate = new Date(`${day._id}T00:00:00`);
            if (dayDate >= start && dayDate <= end) {
                return total + (Number(day.totalSales) || 0);
            }
            return total;
        }, 0);
    };
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const revenueChartData = stats ? [
        { name: language === "ar" ? "اليوم" : "Today", revenue: sumSalesByRange(startOfToday, now) },
        { name: language === "ar" ? "هذا الأسبوع" : "This Week", revenue: sumSalesByRange(startOfWeek, now) },
        { name: language === "ar" ? "هذا الشهر" : "This Month", revenue: sumSalesByRange(startOfMonth, now) },
        { name: language === "ar" ? "هذا العام" : "This Year", revenue: sumSalesByRange(startOfYear, now) },
    ] : [];
    const ordersChartData = stats ? [
        { name: language === "ar" ? "قيد الانتظار" : "Pending", value: stats.ordersByStatus.pending },
        { name: language === "ar" ? "قيد المعالجة" : "Processing", value: stats.ordersByStatus.processing },
        { name: language === "ar" ? "تم الشحن" : "Shipped", value: stats.ordersByStatus.shipped },
        { name: language === "ar" ? "تم التسليم" : "Delivered", value: stats.ordersByStatus.delivered },
    ] : [];
    if (authLoading || loading) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoader label="Loading dashboard..." size="lg"/>
      </div>);
    }
    if (!user || user.role !== "admin") {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <AppLoader label="Loading..." />
      </div>);
    }
    const previewProduct = designPreviewItem?.baseProductId
        ? studioPreviewProducts[designPreviewItem.baseProductId]
        : null;
    const previewSideData = designPreviewItem?.designMetadata?.studio?.data?.designBySide?.[designPreviewSide] || {};
    const previewArea = resolvePreviewArea(previewProduct, designPreviewSide);
    const previewBaseImage = resolvePreviewBaseImage(designPreviewItem, previewProduct, designPreviewSide);
    return (<>
      <AdminLayout activeTab={activeTab} pendingReviewsCount={reviews.filter((r) => r.status === "pending").length} pendingAccountDeletionCount={pendingAccountDeletionCount}>
        <div className="animate-in fade-in duration-500">
        {loading ? (<div className="flex items-center justify-center min-h-[60vh]">
            <AppLoader label="Loading dashboard..." size="lg"/>
          </div>) : (<>
        
            {activeTab === "overview" && stats && (<div className="space-y-8">
            <div>
                  <h1 className="text-3xl font-bold mb-2">{t("dashboard", language)} {t("overview", language)}</h1>
                  <p className="text-muted-foreground">
                    {t("welcome", language)} {user.firstName}! {language === "ar" ? "إليك ما يحدث في متجرك." : "Here's what's happening with your store."}
                  </p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                          <DollarSign className="h-6 w-6 text-primary"/>
                      </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse"/>
                    </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalRevenue", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">${stats.overview.totalRevenue.toFixed(2)}</p>
                  </CardContent>
                </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center shadow-sm">
                          <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse"/>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalOrders", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{stats.overview.totalOrders}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center shadow-sm">
                          <Package className="h-6 w-6 text-purple-600 dark:text-purple-400"/>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse"/>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalProducts", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{stats.overview.totalProducts}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center shadow-sm">
                          <Users className="h-6 w-6 text-green-600 dark:text-green-400"/>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse"/>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalCustomers", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">{stats.overview.totalUsers}</p>
                    </CardContent>
                  </Card>
                </div>

                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{t("totalRevenue", language)}</CardTitle>
                      <Select value={chartSettings.revenueChartType} onValueChange={(value) => {
                    setChartSettings({ ...chartSettings, revenueChartType: value });
                }}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">{language === "ar" ? "عمودي" : "Bar"}</SelectItem>
                          <SelectItem value="line">{language === "ar" ? "خطي" : "Line"}</SelectItem>
                          <SelectItem value="area">{language === "ar" ? "منطقة" : "Area"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        {chartSettings.revenueChartType === 'line' ? (<LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2}/>
                          </LineChart>) : chartSettings.revenueChartType === 'area' ? (<LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} fill="#8884d8" fillOpacity={0.6}/>
                          </LineChart>) : (<BarChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="#8884d8"/>
                          </BarChart>)}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{t("orders", language)} {language === "ar" ? "حسب الحالة" : "by Status"}</CardTitle>
                      <Select value={chartSettings.ordersChartType} onValueChange={(value) => {
                    setChartSettings({ ...chartSettings, ordersChartType: value });
                }}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pie">{language === "ar" ? "دائري" : "Pie"}</SelectItem>
                          <SelectItem value="bar">{language === "ar" ? "عمودي" : "Bar"}</SelectItem>
                          <SelectItem value="line">{language === "ar" ? "خطي" : "Line"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        {chartSettings.ordersChartType === 'pie' ? (<PieChart>
                            <Pie data={ordersChartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                              {ordersChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                            </Pie>
                            <Tooltip />
                          </PieChart>) : chartSettings.ordersChartType === 'line' ? (<LineChart data={ordersChartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2}/>
                          </LineChart>) : (<BarChart data={ordersChartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8"/>
                          </BarChart>)}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
            </div>

            
            <Card>
              <CardHeader>
                    <CardTitle>{language === "ar" ? "الطلبات الأخيرة" : "Recent Orders"}</CardTitle>
              </CardHeader>
              <CardContent>
                    {orders.length > 0 ? (<Table>
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
                          {orders
                        .filter((order, index, self) => {
                        const orderId = order._id?.toString();
                        return orderId && index === self.findIndex(o => o._id?.toString() === orderId);
                    })
                        .slice(0, 5)
                        .map((order, idx) => {
                        const orderId = order._id?.toString() || `order-${idx}`;
                        return (<TableRow key={orderId}>
                              <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={order.status === "delivered" ? "default" :
                                order.status === "processing" ? "secondary" : "outline"}>
                                  {t(order.status, language)}
                          </Badge>
                        </TableCell>
                              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order._id)} title={language === "ar" ? "عرض التفاصيل" : "View Details"}>
                                    <Eye className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openEditOrder(order._id)} title={language === "ar" ? "تعديل" : "Edit"}>
                                    <Edit className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order._id)} title={language === "ar" ? "حذف" : "Delete"}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>);
                    })}
                  </TableBody>
                </Table>) : (<p className="text-center text-muted-foreground py-8">{language === "ar" ? "لا توجد طلبات" : "No orders yet"}</p>)}
              </CardContent>
            </Card>
          </div>)}

        
        {activeTab === "orders" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("orders", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "إدارة وتتبع جميع طلبات العملاء" : "Manage and track all customer orders"}
                    </p>
              </div>
                  <Button onClick={exportOrders} className="bg-blue-500 text-white hover:bg-blue-600">
                    <Download className="h-4 w-4 mr-2"/>
                    {language === "ar" ? "تصدير" : "Export"}
                  </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                    {orders.length > 0 ? (<Table>
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
                          {orders
                        .filter((order, index, self) => {
                        const orderId = order._id?.toString();
                        return orderId && index === self.findIndex(o => o._id?.toString() === orderId);
                    })
                        .map((order, idx) => {
                        const orderId = order._id?.toString() || `order-${idx}`;
                        return (<TableRow key={orderId}>
                              <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={order.status === "delivered" ? "default" :
                                order.status === "processing" ? "secondary" : "outline"}>
                                  {t(order.status, language)}
                          </Badge>
                        </TableCell>
                              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order._id)} title={language === "ar" ? "عرض التفاصيل" : "View Details"}>
                              <Eye className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                                setSelectedOrder(order);
                                setEditOrderStatus(order.status);
                                setEditTrackingNumber(order.trackingNumber || "");
                                setEditCarrier(order.carrier || "");
                                setEditEstimatedDelivery(order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : "");
                                setEditLocation("");
                                setEditNote("");
                                setShowEditOrder(true);
                            }} title={language === "ar" ? "تحديث التتبع" : "Update Tracking"}>
                              <Edit className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order._id)} title={language === "ar" ? "حذف" : "Delete"}>
                              <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>);
                    })}
                  </TableBody>
                </Table>) : (<p className="text-center text-muted-foreground py-8">{language === "ar" ? "لا توجد طلبات" : "No orders yet"}</p>)}
              </CardContent>
            </Card>
          </div>)}

        
        {activeTab === "products" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("products", language)}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "إدارة مخزون المنتجات" : "Manage your product inventory"}
                </p>
              </div>
              <Button onClick={() => {
                    setIsEditingProduct(false);
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
                        inCollection: false,
                    });
                    setNewImageUrl("");
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
                
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input type="text" placeholder={language === "ar" ? "ابحث عن منتج بالاسم أو الفئة..." : "Search products by name or category..."} value={productSearchQuery} onChange={(e) => setProductSearchQuery(e.target.value)} className="pl-10 pr-4"/>
                    {productSearchQuery && (<Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8" onClick={() => setProductSearchQuery("")}>
                        <X className="h-4 w-4"/>
                      </Button>)}
                  </div>
                </div>
                {filteredProducts.length > 0 ? (<Table>
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
                                        <Image src={sanitizeExternalUrl(product.image || "") || "/placeholder-logo.png"} alt={product.name || "Product"} fill className="object-cover" sizes="64px" loading="lazy" quality={75} onError={(e) => {
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
                                        inCollection: product.inCollection || false,
                                    });
                                    setNewImageUrl("");
                                    setNewSize("");
                                    setNewColor("");
                                    setMainImageFile(null);
                                    setAdditionalImageFiles([]);
                                    setShowProductModal(true);
                                }}>
                                        <Edit className="h-4 w-4"/>
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={async () => {
                                    if (confirm(language === "ar" ? "هل أنت متأكد من حذف هذا المنتج؟" : "Are you sure you want to delete this product?")) {
                                        try {
                                            await productsAdminApi.deleteProduct(product._id || product.id?.toString() || "");
                                            toast({
                                                title: language === "ar" ? "تم الحذف" : "Deleted",
                                                description: language === "ar" ? "تم حذف المنتج بنجاح" : "Product deleted successfully",
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
                                {language === "ar" ? "لا توجد منتجات في هذا القسم" : "No products in this section"}
                              </TableCell>
                            </TableRow>)}
                        </Fragment>))}
                    </TableBody>
                  </Table>) : productsLoading ? (<div className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl"></span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-foreground">
                          {language === "ar" ? "جاري تحميل المنتجات..." : "Loading products..."}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "يرجى الانتظار قليلاً" : "Please wait a moment"}
                        </p>
                      </div>
                    </div>
                  </div>) : productSearchQuery ? (<p className="text-center text-muted-foreground py-8">
                    {language === "ar"
                        ? `لا توجد منتجات تطابق "${productSearchQuery}"`
                        : `No products found matching "${productSearchQuery}"`}
                  </p>) : (<p className="text-center text-muted-foreground py-8">
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
                    ? language === "ar"
                        ? "تعديل المنتج"
                        : "Edit Product"
                    : language === "ar"
                        ? "إضافة منتج جديد"
                        : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "ar"
                    ? "املأ المعلومات أدناه لإضافة منتج جديد"
                    : "Fill in the information below to add a new product"}
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
                    <input type="checkbox" id="inCollection" checked={productForm.inCollection} onChange={(e) => setProductForm({ ...productForm, inCollection: e.target.checked })} className="rounded"/>
                    <Label htmlFor="inCollection" className="cursor-pointer">
                      {language === "ar" ? "إضافة للمجموعة" : "Add to Collection"}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="active" checked={productForm.active} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} className="rounded"/>
                    <Label htmlFor="active" className="cursor-pointer">
                      {language === "ar" ? "نشط" : "Active"}
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
                                image: mainImageFile || productForm.image || undefined,
                                images: additionalImageFiles.length > 0
                                    ? additionalImageFiles
                                    : (productForm.images.length > 0 ? productForm.images : undefined),
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
                                inCollection: productForm.inCollection,
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
                                image: mainImageFile || productForm.image || undefined,
                                images: additionalImageFiles.length > 0
                                    ? additionalImageFiles
                                    : (productForm.images.length > 0 ? productForm.images : undefined),
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
                                inCollection: productForm.inCollection,
                            });
                            toast({
                                title: language === "ar" ? "تمت الإضافة" : "Added",
                                description: language === "ar" ? "تم إضافة المنتج بنجاح" : "Product added successfully",
                            });
                        }
                        setShowProductModal(false);
                        loadProducts();
                        loadDashboardData();
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

        
        {activeTab === "customers" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("customers", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "عرض وإدارة حسابات العملاء من قاعدة البيانات" : "View and manage customer accounts from database"}
                    </p>
              </div>
                  <Button onClick={loadCustomers} variant="outline">
                    <Download className="h-4 w-4 mr-2"/>
                    {language === "ar" ? "تحديث" : "Refresh"}
                  </Button>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                    {users.length > 0 ? (<Table>
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
                          {users.map((user) => (<TableRow key={user._id}>
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
                            await handleDeleteUser(user._id, {
                                confirmMessage: language === "ar"
                                    ? `هل أنت متأكد من حذف العميل ${user.firstName} ${user.lastName}؟`
                                    : `Are you sure you want to delete customer ${user.firstName} ${user.lastName}?`,
                            });
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

        
            {activeTab === "analytics" && stats && (<div className="space-y-6">
            <div>
                  <h1 className="text-3xl font-bold mb-2">{t("analytics", language)}</h1>
                  <p className="text-muted-foreground">
                    {language === "ar" ? "مقاييس الأداء والاتجاهات التفصيلية" : "Detailed performance metrics and trends"}
                  </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                      <CardTitle>{t("totalRevenue", language)} {language === "ar" ? "الاتجاهات" : "Trends"}</CardTitle>
                </CardHeader>
                <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <XAxis dataKey="name"/>
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2}/>
                        </LineChart>
                      </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "المبيعات حسب الفئة" : "Sales by Category"}</CardTitle>
                </CardHeader>
                <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={ordersChartData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                            {ordersChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>)}

            
        {activeTab === "staff" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("staff", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "إدارة الموظفين والمديرين" : "Manage employees and administrators"}
                    </p>
              </div>
                  <Button onClick={() => {
                    setShowEmployeeModal(true);
                    setEmployeeForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        password: "",
                        phone: "",
                    });
                }} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200">
                    <UserPlus className="h-4 w-4 mr-2"/>
                    {language === "ar" ? "إضافة موظف" : "Add Employee"}
                  </Button>
            </div>

            
            <div className="flex justify-end mb-4">
              <Button onClick={loadStaff} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2"/>
                {language === "ar" ? "تحديث" : "Refresh"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "المديرون" : "Administrators"}</CardTitle>
                      <CardDescription>
                        {language === "ar"
                    ? `إجمالي المديرين: ${users.filter(u => u.role === "admin").length}`
                    : `Total Administrators: ${users.filter(u => u.role === "admin").length}`}
                      </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                        {users.filter(u => u.role === "admin").length > 0 ? (users.filter(u => u.role === "admin").map((user) => (<div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.phone && (<p className="text-xs text-muted-foreground mt-1">{user.phone}</p>)}
                      </div>
                      <Badge variant="destructive">Admin</Badge>
                    </div>))) : (<p className="text-center text-muted-foreground py-8">
                            {language === "ar" ? "لا يوجد مديرون" : "No administrators found"}
                          </p>)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "الموظفون" : "Employees"}</CardTitle>
                      <CardDescription>
                        {language === "ar"
                    ? `إجمالي الموظفين: ${users.filter(u => u.role === "employee").length}`
                    : `Total Employees: ${users.filter(u => u.role === "employee").length}`}
                      </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                        {users.filter(u => u.role === "employee").length > 0 ? (users.filter(u => u.role === "employee").map((user) => (<div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.phone && (<p className="text-xs text-muted-foreground mt-1">{user.phone}</p>)}
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === "ar" ? "تاريخ التسجيل: " : "Joined: "}
                                {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>Employee</Badge>
                        <Button variant="ghost" size="icon" onClick={async () => {
                        await handleDeleteUser(user._id, {
                            confirmMessage: language === "ar"
                                ? `هل أنت متأكد من حذف الموظف ${user.firstName} ${user.lastName}؟`
                                : `Are you sure you want to delete employee ${user.firstName} ${user.lastName}?`,
                        });
                    }} title={language === "ar" ? "حذف" : "Delete"}>
                          <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </div>
                    </div>))) : (<p className="text-center text-muted-foreground py-8">
                            {language === "ar" ? "لا يوجد موظفون" : "No employees yet"}
                          </p>)}
                  </div>
                </CardContent>
              </Card>
            </div>

            
            <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
              <DialogContent className="max-h-[80vh] overflow-y-auto border-2 shadow-2xl">
                <DialogHeader>
                  <DialogTitle>{language === "ar" ? "إضافة موظف جديد" : "Add New Employee"}</DialogTitle>
                  <DialogDescription>
                    {language === "ar"
                    ? "املأ المعلومات أدناه لإضافة موظف جديد. سيتمكن الموظف من تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور المحددة."
                    : "Fill in the information below to add a new employee. The employee will be able to log in using the email and password provided."}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="empFirstName">{language === "ar" ? "الاسم الأول" : "First Name"} *</Label>
                      <Input id="empFirstName" value={employeeForm.firstName} onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })} placeholder={language === "ar" ? "الاسم الأول" : "First name"}/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empLastName">{language === "ar" ? "اسم العائلة" : "Last Name"} *</Label>
                      <Input id="empLastName" value={employeeForm.lastName} onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })} placeholder={language === "ar" ? "اسم العائلة" : "Last name"}/>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empEmail">{language === "ar" ? "البريد الإلكتروني" : "Email"} *</Label>
                    <Input id="empEmail" type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} placeholder="employee@example.com"/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empPassword">{language === "ar" ? "كلمة المرور" : "Password"} *</Label>
                    <Input id="empPassword" type="password" value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} placeholder={language === "ar" ? "كلمة المرور" : "Password"}/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empPhone">{language === "ar" ? "رقم الهاتف" : "Phone"} (اختياري)</Label>
                    <Input id="empPhone" value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} placeholder="+1 (555) 000-0000"/>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEmployeeModal(false)}>
                    {t("cancel", language)}
                  </Button>
                  <Button onClick={async () => {
                    if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.email || !employeeForm.password) {
                        toast({
                            title: "Error",
                            description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
                            variant: "destructive",
                        });
                        return;
                    }
                    try {
                        await adminApi.createEmployee(employeeForm);
                        toast({
                            title: language === "ar" ? "تمت الإضافة" : "Success",
                            description: language === "ar" ? "تم إضافة الموظف بنجاح" : "Employee created successfully",
                        });
                        setShowEmployeeModal(false);
                        loadStaff();
                        loadDashboardData();
                    }
                    catch (error) {
                        toast({
                            title: "Error",
                            description: error.message || "Failed to create employee",
                            variant: "destructive",
                        });
                    }
                }}>
                    {language === "ar" ? "إضافة موظف" : "Add Employee"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>)}

        
        {activeTab === "reviews" && (<div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "الآراء" : "Reviews"}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "إدارة آراء العملاء والموافقة عليها" : "Manage and approve customer reviews"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={reviewStatusFilter} onValueChange={setReviewStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                    <SelectItem value="approved">{language === "ar" ? "موافق عليها" : "Approved"}</SelectItem>
                    <SelectItem value="rejected">{language === "ar" ? "مرفوضة" : "Rejected"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadReviews} variant="outline" size="icon">
                  <Eye className="h-4 w-4"/>
                </Button>
              </div>
            </div>

            {reviewsLoading ? (<div className="py-12">
                <AppLoader label={language === "ar" ? "Loading reviews..." : "Loading reviews..."} />
              </div>) : reviews.length === 0 ? (<Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {language === "ar" ? "لا توجد آراء" : "No reviews found"}
                  </p>
                </CardContent>
              </Card>) : (<div className="space-y-4">
                {reviews.map((review) => {
                        const userName = review.user
                            ? `${review.user.firstName} ${review.user.lastName}`
                            : "Anonymous";
                        return (<Card key={review._id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className={`h-4 w-4 ${star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"}`}/>))}
                              </div>
                              <Badge variant={review.status === "approved"
                                ? "default"
                                : review.status === "rejected"
                                    ? "destructive"
                                    : "secondary"}>
                                {review.status === "approved"
                                ? language === "ar" ? "موافق عليها" : "Approved"
                                : review.status === "rejected"
                                    ? language === "ar" ? "مرفوضة" : "Rejected"
                                    : language === "ar" ? "قيد الانتظار" : "Pending"}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{review.title}</h3>
                            <p className="text-muted-foreground mb-4">{review.comment}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{userName}</span>
                              <span>•</span>
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {review.status === "pending" && (<div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => handleReviewStatusUpdate(review._id, "approved")} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2"/>
                                {language === "ar" ? "موافقة" : "Approve"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReviewStatusUpdate(review._id, "rejected")}>
                                <XCircle className="h-4 w-4 mr-2"/>
                                {language === "ar" ? "رفض" : "Reject"}
                              </Button>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>);
                    })}
              </div>)}
          </div>)}

        
        {activeTab === "accountDeletions" && (<div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "Account Deletions" : "Account Deletions"}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "Review account deletion requests from customers" : "Review account deletion requests from customers"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={accountDeletionStatusFilter} onValueChange={setAccountDeletionStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "All" : "All"}</SelectItem>
                    <SelectItem value="pending">{language === "ar" ? "Pending" : "Pending"}</SelectItem>
                    <SelectItem value="approved">{language === "ar" ? "Approved" : "Approved"}</SelectItem>
                    <SelectItem value="rejected">{language === "ar" ? "Rejected" : "Rejected"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadAccountDeletionRequests} variant="outline" size="icon">
                  <Eye className="h-4 w-4"/>
                </Button>
              </div>
            </div>

            {accountDeletionLoading ? (<div className="py-12">
                <AppLoader label={language === "ar" ? "Loading requests..." : "Loading requests..."} />
              </div>) : accountDeletionRequests.length === 0 ? (<Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {language === "ar" ? "No account deletion requests" : "No account deletion requests"}
                  </p>
                </CardContent>
              </Card>) : (<div className="space-y-4">
                {accountDeletionRequests.map((request) => {
                        const userName = request.user
                            ? `${request.user.firstName} ${request.user.lastName}`
                            : "Unknown User";
                        const userEmail = request.user?.email || "—";
                        return (<Card key={request._id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant={request.status === "approved"
                                ? "default"
                                : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"}>
                                {request.status === "approved"
                                ? language === "ar" ? "Approved" : "Approved"
                                : request.status === "rejected"
                                    ? language === "ar" ? "Rejected" : "Rejected"
                                    : language === "ar" ? "Pending" : "Pending"}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold mb-1">{userName}</h3>
                            <p className="text-sm text-muted-foreground">{userEmail}</p>
                            {request.reason && (<p className="text-sm text-muted-foreground mt-3">
                                {language === "ar" ? "Reason:" : "Reason:"} {request.reason}
                              </p>)}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                              {request.reviewedAt && (<>
                                  <span>•</span>
                                  <span>{new Date(request.reviewedAt).toLocaleDateString()}</span>
                                </>)}
                            </div>
                          </div>
                          {request.status === "pending" && (<div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => handleAccountDeletionStatusUpdate(request._id, "approved")} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2"/>
                                {language === "ar" ? "Approve" : "Approve"}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAccountDeletionStatusUpdate(request._id, "rejected")}>
                                <XCircle className="h-4 w-4 mr-2"/>
                                {language === "ar" ? "Reject" : "Reject"}
                              </Button>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>);
                    })}
              </div>)}
          </div>)}

        
        {activeTab === "messages" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "الرسائل" : "Messages"}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "إدارة رسائل التواصل من العملاء" : "Manage contact messages from customers"}
                </p>
              </div>
              <Button onClick={loadContactMessages} variant="outline">
                <Download className="h-4 w-4 mr-2"/>
                {language === "ar" ? "تحديث" : "Refresh"}
              </Button>
            </div>

            
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2 flex-wrap">
                  <Button variant={messageStatusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setMessageStatusFilter("all")}>
                    {language === "ar" ? "الكل" : "All"}
                  </Button>
                  <Button variant={messageStatusFilter === "new" ? "default" : "outline"} size="sm" onClick={() => setMessageStatusFilter("new")}>
                    {language === "ar" ? "جديدة" : "New"}
                    {contactMessages.filter(m => m.status === "new").length > 0 && (<Badge className="ml-2 bg-red-500 text-white">
                        {contactMessages.filter(m => m.status === "new").length}
                      </Badge>)}
                  </Button>
                  <Button variant={messageStatusFilter === "read" ? "default" : "outline"} size="sm" onClick={() => setMessageStatusFilter("read")}>
                    {language === "ar" ? "مقروءة" : "Read"}
                  </Button>
                  <Button variant={messageStatusFilter === "replied" ? "default" : "outline"} size="sm" onClick={() => setMessageStatusFilter("replied")}>
                    {language === "ar" ? "تم الرد" : "Replied"}
                  </Button>
                  <Button variant={messageStatusFilter === "archived" ? "default" : "outline"} size="sm" onClick={() => setMessageStatusFilter("archived")}>
                    {language === "ar" ? "مؤرشفة" : "Archived"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            
            <Card>
              <CardContent className="p-6">
                {messagesLoading ? (<div className="py-8">
                    <AppLoader label={language === "ar" ? "Loading messages..." : "Loading messages..."} />
                  </div>) : contactMessages.length > 0 ? (<div className="space-y-4">
                    {contactMessages.map((message) => (<Card key={message._id} className={`cursor-pointer transition-all hover:shadow-md ${message.status === "new" ? "border-2 border-primary" : ""}`} onClick={() => {
                            setSelectedMessage(message);
                            setShowMessageDetails(true);
                        }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant={message.status === "new"
                            ? "default"
                            : message.status === "replied"
                                ? "secondary"
                                : "outline"}>
                                  {message.status === "new"
                            ? language === "ar" ? "جديدة" : "New"
                            : message.status === "replied"
                                ? language === "ar" ? "تم الرد" : "Replied"
                                : message.status === "read"
                                    ? language === "ar" ? "مقروءة" : "Read"
                                    : language === "ar" ? "مؤرشفة" : "Archived"}
                                </Badge>
                                <h3 className="font-semibold text-lg">{message.subject}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-4 w-4"/>
                                  {message.email}
                                </span>
                                <span>•</span>
                                <span>{message.name}</span>
                                <span>•</span>
                                <span>{new Date(message.createdAt || "").toLocaleDateString()}</span>
                              </div>
                              <p className="text-muted-foreground line-clamp-2">{message.message}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessage(message);
                            setShowMessageDetails(true);
                        }}>
                                <Eye className="h-4 w-4"/>
                              </Button>
                              {user?.role === "admin" && (<Button variant="ghost" size="icon" onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(language === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
                                    try {
                                        await deleteContactMessage(message._id);
                                        toast({
                                            title: language === "ar" ? "تم الحذف" : "Deleted",
                                            description: language === "ar" ? "تم حذف الرسالة بنجاح" : "Message deleted successfully",
                                        });
                                        loadContactMessages();
                                    }
                                    catch (error) {
                                        toast({
                                            title: language === "ar" ? "خطأ" : "Error",
                                            description: error.message || (language === "ar" ? "فشل حذف الرسالة" : "Failed to delete message"),
                                            variant: "destructive",
                                        });
                                    }
                                }
                            }}>
                                  <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>))}
                  </div>) : (<div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "لا توجد رسائل" : "No messages found"}
                    </p>
                  </div>)}
              </CardContent>
            </Card>
          </div>)}

        
        <Dialog open={showMessageDetails} onOpenChange={setShowMessageDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
              <DialogDescription>
                {language === "ar" ? "تفاصيل الرسالة" : "Message Details"}
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (<div className="space-y-4">
                <div>
                  <Label>{language === "ar" ? "من" : "From"}</Label>
                  <p className="font-medium">{selectedMessage.name} ({selectedMessage.email})</p>
                </div>
                <div>
                  <Label>{language === "ar" ? "التاريخ" : "Date"}</Label>
                  <p>{new Date(selectedMessage.createdAt || "").toLocaleString()}</p>
                </div>
                <div>
                  <Label>{language === "ar" ? "الرسالة" : "Message"}</Label>
                  <p className="whitespace-pre-wrap bg-muted p-4 rounded-lg">{selectedMessage.message}</p>
                </div>
                {selectedMessage.replyMessage && (<div>
                    <Label>{language === "ar" ? "الرد" : "Reply"}</Label>
                    <p className="whitespace-pre-wrap bg-primary/10 p-4 rounded-lg">{selectedMessage.replyMessage}</p>
                    {selectedMessage.repliedBy && (<p className="text-sm text-muted-foreground mt-2">
                        {language === "ar" ? "رد بواسطة:" : "Replied by:"}{" "}
                        {typeof selectedMessage.repliedBy === "object"
                            ? `${selectedMessage.repliedBy.firstName} ${selectedMessage.repliedBy.lastName}`
                            : ""}
                        {" "}
                        {selectedMessage.repliedAt
                            ? `(${new Date(selectedMessage.repliedAt).toLocaleString()})`
                            : ""}
                      </p>)}
                  </div>)}
                {!selectedMessage.replyMessage && (<div>
                    <Label>{language === "ar" ? "الرد" : "Reply"}</Label>
                    <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={language === "ar" ? "اكتب ردك هنا..." : "Write your reply here..."} className="min-h-[150px]"/>
                  </div>)}
                <div className="flex gap-2">
                  <Select value={selectedMessage.status} onValueChange={async (value) => {
                    try {
                        await updateContactMessage(selectedMessage._id, { status: value });
                        toast({
                            title: language === "ar" ? "تم التحديث" : "Updated",
                            description: language === "ar" ? "تم تحديث حالة الرسالة" : "Message status updated",
                        });
                        loadContactMessages();
                        setShowMessageDetails(false);
                    }
                    catch (error) {
                        toast({
                            title: language === "ar" ? "خطأ" : "Error",
                            description: error.message || (language === "ar" ? "فشل التحديث" : "Failed to update"),
                            variant: "destructive",
                        });
                    }
                }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{language === "ar" ? "جديدة" : "New"}</SelectItem>
                      <SelectItem value="read">{language === "ar" ? "مقروءة" : "Read"}</SelectItem>
                      <SelectItem value="replied">{language === "ar" ? "تم الرد" : "Replied"}</SelectItem>
                      <SelectItem value="archived">{language === "ar" ? "مؤرشفة" : "Archived"}</SelectItem>
                    </SelectContent>
                  </Select>
                  {!selectedMessage.replyMessage && replyText && (<Button onClick={async () => {
                        try {
                            await updateContactMessage(selectedMessage._id, {
                                status: "replied",
                                replyMessage: replyText,
                            });
                            toast({
                                title: language === "ar" ? "تم الإرسال" : "Sent",
                                description: language === "ar" ? "تم إرسال الرد بنجاح" : "Reply sent successfully",
                            });
                            setReplyText("");
                            loadContactMessages();
                            setShowMessageDetails(false);
                        }
                        catch (error) {
                            toast({
                                title: language === "ar" ? "خطأ" : "Error",
                                description: error.message || (language === "ar" ? "فشل إرسال الرد" : "Failed to send reply"),
                                variant: "destructive",
                            });
                        }
                    }}>
                      <Send className="h-4 w-4 mr-2"/>
                      {language === "ar" ? "إرسال الرد" : "Send Reply"}
                    </Button>)}
                </div>
              </div>)}
          </DialogContent>
        </Dialog>

        
        {activeTab === "tracking" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "تتبع الطلبات" : "Order Tracking"}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "تتبع حالة الطلبات وتاريخ التحديثات" : "Track order status and update history"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={orderStatusFilter} onValueChange={(value) => {
                    setOrderStatusFilter(value);
                    setTimeout(() => loadOrderTracking(), 100);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={language === "ar" ? "فلتر حسب الحالة" : "Filter by status"}/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                    <SelectItem value="processing">{language === "ar" ? "قيد المعالجة" : "Processing"}</SelectItem>
                    <SelectItem value="shipped">{language === "ar" ? "تم الشحن" : "Shipped"}</SelectItem>
                    <SelectItem value="delivered">{language === "ar" ? "تم التسليم" : "Delivered"}</SelectItem>
                    <SelectItem value="cancelled">{language === "ar" ? "ملغي" : "Cancelled"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadOrderTracking} variant="outline">
                  <Download className="h-4 w-4 mr-2"/>
                  {language === "ar" ? "تحديث" : "Refresh"}
                </Button>
              </div>
            </div>

            
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "قائمة الطلبات" : "Orders List"}</CardTitle>
                <CardDescription>
                  {language === "ar" ? "عرض جميع الطلبات مع تفاصيل التتبع" : "View all orders with tracking details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orderTrackingLoading ? (<div className="py-8">
                    <AppLoader label={language === "ar" ? "Loading tracking..." : "Loading tracking..."} />
                  </div>) : orders.length > 0 ? (<div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === "ar" ? "رقم الطلب" : "Order Number"}</TableHead>
                          <TableHead>{language === "ar" ? "العميل" : "Customer"}</TableHead>
                          <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                          <TableHead>{language === "ar" ? "رقم التتبع" : "Tracking Number"}</TableHead>
                          <TableHead>{language === "ar" ? "الناقل" : "Carrier"}</TableHead>
                          <TableHead>{language === "ar" ? "الإجمالي" : "Total"}</TableHead>
                          <TableHead>{language === "ar" ? "تاريخ الإنشاء" : "Created At"}</TableHead>
                          <TableHead>{language === "ar" ? "آخر تحديث" : "Last Update"}</TableHead>
                          <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                        .filter((order, index, self) => {
                        const orderId = order._id?.toString();
                        return orderId && index === self.findIndex(o => o._id?.toString() === orderId);
                    })
                        .map((order, index) => {
                        const statusConfig = {
                            pending: {
                                label: { en: "Pending", ar: "قيد الانتظار" },
                                color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                            },
                            processing: {
                                label: { en: "Processing", ar: "قيد المعالجة" },
                                color: "bg-blue-100 text-blue-800 border-blue-300",
                            },
                            shipped: {
                                label: { en: "Shipped", ar: "تم الشحن" },
                                color: "bg-cyan-100 text-cyan-800 border-cyan-300",
                            },
                            delivered: {
                                label: { en: "Delivered", ar: "تم التسليم" },
                                color: "bg-green-100 text-green-800 border-green-300",
                            },
                            cancelled: {
                                label: { en: "Cancelled", ar: "ملغي" },
                                color: "bg-red-100 text-red-800 border-red-300",
                            },
                        };
                        const status = statusConfig[order.status] || statusConfig.pending;
                        const lastUpdate = order.trackingHistory && order.trackingHistory.length > 0
                            ? order.trackingHistory[order.trackingHistory.length - 1].updatedAt
                            : order.updatedAt;
                        return (<TableRow key={order._id}>
                              <TableCell className="font-medium">{order.orderNumber}</TableCell>
                              <TableCell>
                                {typeof order.user === "object" ? (<div>
                                    <p>{order.user.firstName} {order.user.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{order.user.email}</p>
                                  </div>) : ("N/A")}
                              </TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  {status.label[language]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {order.trackingNumber || (<span className="text-muted-foreground text-sm">
                                    {language === "ar" ? "غير متوفر" : "N/A"}
                                  </span>)}
                              </TableCell>
                              <TableCell>
                                {order.carrier || (<span className="text-muted-foreground text-sm">
                                    {language === "ar" ? "غير متوفر" : "N/A"}
                                  </span>)}
                              </TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                              <TableCell>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {new Date(lastUpdate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => viewOrderDetails(order._id)}>
                                    <Eye className="h-4 w-4"/>
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => openEditOrder(order._id)}>
                                    <Edit className="h-4 w-4"/>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>);
                    })}
                      </TableBody>
                    </Table>
                  </div>) : (<div className="text-center py-8">
                    <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "لا توجد طلبات متاحة" : "No orders available"}
                    </p>
                  </div>)}
              </CardContent>
            </Card>

            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "قيد الانتظار" : "Pending"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => o.status === "pending").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "قيد المعالجة" : "Processing"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => o.status === "processing").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "تم الشحن" : "Shipped"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => o.status === "shipped").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "تم التسليم" : "Delivered"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => o.status === "delivered").length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>)}

        
        {activeTab === "reports" && (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("reports", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "إنشاء وتحميل تقارير الأعمال" : "Generate and download business reports"}
                    </p>
              </div>
                <Button onClick={async () => {
                    try {
                        setLoading(true);
                        const [salesReport, productsData, customersData] = await Promise.all([
                            adminApi.getSalesReport().catch(() => ({ salesByDay: [], summary: { total: 0, count: 0 } })),
                            productsAdminApi.getAllProducts({ limit: 1000 }).catch(() => ({ data: [] })),
                            adminApi.getAllUsers({ role: 'customer', limit: 1000 }).catch(() => ({ data: [] })),
                        ]);
                        const allData = {
                            sales: salesReport,
                            inventory: Array.isArray(productsData.data) ? productsData.data : productsData,
                            customers: customersData.data || [],
                            exportDate: new Date().toISOString(),
                        };
                        const jsonContent = JSON.stringify(allData, null, 2);
                        const blob = new Blob([jsonContent], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `all-reports-${new Date().toISOString().split('T')[0]}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                        toast({
                            title: "Success",
                            description: language === "ar" ? "تم تصدير جميع التقارير" : "All reports exported",
                        });
                    }
                    catch (error) {
                        toast({
                            title: "Error",
                            description: error.message || "Failed to export reports",
                            variant: "destructive",
                        });
                    }
                    finally {
                        setLoading(false);
                    }
                }} className="bg-blue-500 text-white hover:bg-blue-600">
                  <Download className="h-4 w-4 mr-2"/>
                  {language === "ar" ? "تصدير الكل" : "Export All"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "تقرير المبيعات" : "Sales Report"}</CardTitle>
                </CardHeader>
                <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === "ar" ? "بيانات المبيعات والاتجاهات الشاملة" : "Comprehensive sales data and trends"}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={async () => {
                    try {
                        const report = await adminApi.getSalesReport();
                        const salesData = report.salesByDay?.map((day) => ({
                            Date: day._id,
                            'Total Sales': `$${day.totalSales?.toFixed(2) || 0}`,
                            'Order Count': day.orderCount || 0,
                        })) || [];
                        exportToExcel(salesData, 'sales-report', language);
                        toast({
                            title: "Success",
                            description: language === "ar" ? "تم تصدير تقرير المبيعات" : "Sales report exported",
                        });
                    }
                    catch (error) {
                        toast({
                            title: "Error",
                            description: error.message || "Failed to export report",
                            variant: "destructive",
                        });
                    }
                }}>
                          <Download className="h-4 w-4 mr-2"/>
                          {language === "ar" ? "Excel" : "Excel"}
                        </Button>
                      </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "تقرير المخزون" : "Inventory Report"}</CardTitle>
                </CardHeader>
                <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === "ar" ? "مستويات المخزون الحالية والتنبيهات" : "Current stock levels and alerts"}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={async () => {
                    try {
                        await loadProducts();
                        const inventoryData = products.map(p => ({
                            name: p.name,
                            stock: p.stock,
                            category: p.category,
                            price: p.price,
                        }));
                        exportToExcel(inventoryData, 'inventory-report', language);
                        toast({
                            title: "Success",
                            description: language === "ar" ? "تم تصدير تقرير المخزون" : "Inventory report exported",
                        });
                    }
                    catch (error) {
                        toast({
                            title: "Error",
                            description: error.message || "Failed to export report",
                            variant: "destructive",
                        });
                    }
                }}>
                          <Download className="h-4 w-4 mr-2"/>
                          {language === "ar" ? "Excel" : "Excel"}
                        </Button>
                      </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "تقرير العملاء" : "Customer Report"}</CardTitle>
                </CardHeader>
                <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === "ar" ? "سلوك العملاء والديموغرافيا" : "Customer behavior and demographics"}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={async () => {
                    try {
                        await loadCustomers();
                        const customerData = users.map(u => ({
                            name: `${u.firstName} ${u.lastName}`,
                            email: u.email,
                            phone: u.phone || 'N/A',
                            createdAt: new Date(u.createdAt).toLocaleDateString(),
                        }));
                        exportToExcel(customerData, 'customer-report', language);
                        toast({
                            title: "Success",
                            description: language === "ar" ? "تم تصدير تقرير العملاء" : "Customer report exported",
                        });
                    }
                    catch (error) {
                        toast({
                            title: "Error",
                            description: error.message || "Failed to export report",
                            variant: "destructive",
                        });
                    }
                }}>
                          <Download className="h-4 w-4 mr-2"/>
                          {language === "ar" ? "Excel" : "Excel"}
                        </Button>
                      </div>
                </CardContent>
              </Card>
            </div>
          </div>)}

        
        {activeTab === "settings" && (<div className="space-y-6">
            <div>
                  <h1 className="text-3xl font-bold mb-2">{t("settings", language)}</h1>
                  <p className="text-muted-foreground">
                    {language === "ar" ? "تكوين إعدادات المنصة والتفضيلات" : "Configure platform settings and preferences"}
                  </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "الإعدادات العامة" : "General Settings"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                        <Label>{language === "ar" ? "اسم المتجر" : "Store Name"}</Label>
                    <Input defaultValue="Fashion Hub"/>
                  </div>
                  <div>
                        <Label>{language === "ar" ? "البريد الإلكتروني للتواصل" : "Contact Email"}</Label>
                    <Input defaultValue="admin@fashionhub.com"/>
                  </div>
                  <div>
                        <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
                    <Input defaultValue="USD"/>
                  </div>
                      <Button>{t("save", language)}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                      <CardTitle>{language === "ar" ? "إعدادات الأمان" : "Security Settings"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                        <span>{language === "ar" ? "المصادقة الثنائية" : "Two-Factor Authentication"}</span>
                        <Badge variant="secondary">{language === "ar" ? "مفعل" : "Enabled"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                        <span>{language === "ar" ? "انتهاء الجلسة" : "Session Timeout"}</span>
                        <span className="text-sm">30 {language === "ar" ? "دقيقة" : "minutes"}</span>
                  </div>
                      <Button variant="outline">{language === "ar" ? "إعدادات الأمان" : "Security Settings"}</Button>
                </CardContent>
              </Card>
            </div>
          </div>)}
          </>)}

        
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "تفاصيل الطلب" : "Order Details"}</DialogTitle>
              <DialogDescription>
                {selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (<div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{language === "ar" ? "العميل" : "Customer"}</Label>
                    <p className="text-sm">
                      {typeof selectedOrder.user === "object"
                ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}`
                : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeof selectedOrder.user === "object" ? selectedOrder.user.email : ""}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{language === "ar" ? "الحالة" : "Status"}</Label>
                    <Badge variant={selectedOrder.status === "delivered" ? "default" :
                selectedOrder.status === "processing" ? "secondary" : "outline"}>
                      {t(selectedOrder.status, language)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{language === "ar" ? "التاريخ" : "Date"}</Label>
                    <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{language === "ar" ? "رقم التتبع" : "Tracking Number"}</Label>
                    <p className="text-sm">{selectedOrder.trackingNumber || "N/A"}</p>
                  </div>
                </div>

                
                <div>
                  <Label className="text-sm font-medium mb-2 block">{language === "ar" ? "المنتجات" : "Items"}</Label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (<div key={index} className="flex items-center gap-4 p-3 border rounded">
                        <img src={sanitizeExternalUrl(item.image || "")} alt={item.name} className="w-16 h-16 object-cover rounded"/>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
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
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>))}
                  </div>
                </div>

                
                <div>
                  <Label className="text-sm font-medium mb-2 block">{language === "ar" ? "عنوان الشحن" : "Shipping Address"}</Label>
                  <div className="p-3 border rounded text-sm">
                    <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    <p className="mt-2">{selectedOrder.shippingAddress.phone}</p>
                  </div>
                </div>

                
                <div>
                  <Label className="text-sm font-medium mb-2 block">{language === "ar" ? "معلومات الدفع" : "Payment Information"}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "الطريقة" : "Method"}</p>
                      <p className="font-medium">{selectedOrder.paymentInfo.method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                      <Badge variant={selectedOrder.paymentInfo.status === "completed" ? "default" : "secondary"}>
                        {selectedOrder.paymentInfo.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span className="font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{language === "ar" ? "الضريبة" : "Tax"}</span>
                    <span className="font-medium">${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{language === "ar" ? "الشحن" : "Shipping"}</span>
                    <span className="font-medium">${selectedOrder.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                {language === "ar" ? "إغلاق" : "Close"}
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

        
        <Dialog open={showEditOrder} onOpenChange={setShowEditOrder}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "تحديث حالة الطلب والتتبع" : "Update Order Status & Tracking"}</DialogTitle>
              <DialogDescription>
                {selectedOrder && `${language === "ar" ? "رقم الطلب" : "Order"}: ${selectedOrder.orderNumber}`}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (<div className="space-y-4">
                <div>
                  <Label>{language === "ar" ? "حالة الطلب" : "Order Status"}</Label>
                  <Select value={editOrderStatus} onValueChange={(value) => setEditOrderStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                      <SelectItem value="processing">{language === "ar" ? "قيد المعالجة" : "Processing"}</SelectItem>
                      <SelectItem value="shipped">{language === "ar" ? "تم الشحن" : "Shipped"}</SelectItem>
                      <SelectItem value="delivered">{language === "ar" ? "تم التسليم" : "Delivered"}</SelectItem>
                      <SelectItem value="cancelled">{language === "ar" ? "ملغي" : "Cancelled"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{language === "ar" ? "رقم التتبع" : "Tracking Number"}</Label>
                  <Input value={editTrackingNumber} onChange={(e) => setEditTrackingNumber(e.target.value)} placeholder={language === "ar" ? "أدخل رقم التتبع" : "Enter tracking number"}/>
                </div>

                <div>
                  <Label>{language === "ar" ? "شركة الشحن" : "Carrier"}</Label>
                  <Input value={editCarrier} onChange={(e) => setEditCarrier(e.target.value)} placeholder={language === "ar" ? "مثال: DHL, FedEx, UPS" : "e.g., DHL, FedEx, UPS"}/>
                </div>

                <div>
                  <Label>{language === "ar" ? "تاريخ التسليم المتوقع" : "Estimated Delivery Date"}</Label>
                  <Input type="date" value={editEstimatedDelivery} onChange={(e) => setEditEstimatedDelivery(e.target.value)}/>
                </div>

                <div>
                  <Label>{language === "ar" ? "الموقع الحالي" : "Current Location"}</Label>
                  <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder={language === "ar" ? "Nablus - Rafidia" : "e.g., Nablus - Rafidia"}/>
                </div>

                <div>
                  <Label>{language === "ar" ? "ملاحظة" : "Note"}</Label>
                  <Textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder={language === "ar" ? "أضف ملاحظة حول حالة الطلب..." : "Add a note about the order status..."} className="min-h-[100px]"/>
                </div>

                
                {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (<div>
                    <Label>{language === "ar" ? "سجل التتبع" : "Tracking History"}</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                      {selectedOrder.trackingHistory.map((entry, index) => (<div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">{entry.status}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(entry.updatedAt).toLocaleString()}
                              </span>
                            </div>
                            {entry.location && (<p className="text-sm text-muted-foreground">
                                <strong>{language === "ar" ? "الموقع:" : "Location:"}</strong> {entry.location}
                              </p>)}
                            {entry.note && (<p className="text-sm text-muted-foreground">
                                <strong>{language === "ar" ? "ملاحظة:" : "Note:"}</strong> {entry.note}
                              </p>)}
                            {entry.updatedBy && typeof entry.updatedBy === "object" && (<p className="text-xs text-muted-foreground mt-1">
                                {language === "ar" ? "تم التحديث بواسطة:" : "Updated by:"} {entry.updatedBy.firstName} {entry.updatedBy.lastName}
                              </p>)}
                          </div>
                        </div>))}
                    </div>
                  </div>)}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditOrder(false)}>
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={handleUpdateOrderStatus}>
                    {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
                  </Button>
                </DialogFooter>
              </div>)}
          </DialogContent>
        </Dialog>
          </div>
        </AdminLayout>
      <StaffChatWidget mode="admin" />
    </>);
}

export default function AdminDashboard() {
    return (<Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminDashboardContent />
    </Suspense>);
}
