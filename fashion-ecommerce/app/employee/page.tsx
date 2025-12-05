"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Printer,
  PackageCheck,
  Moon,
  Sun,
  Languages,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth"
import { ordersApi, type Order } from "@/lib/api/orders"
import { userPreferencesApi } from "@/lib/api/userPreferences"
import { adminApi, type User } from "@/lib/api/admin"
import { reviewsApi, type Review } from "@/lib/api/reviews"
import { listProducts, type Product } from "@/lib/api/products"
import { productsAdminApi } from "@/lib/api/productsAdmin"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useLanguage } from "@/lib/language"
import { t } from "@/lib/i18n"
import { Trash2, Plus, Upload, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

const getStatusColor = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "shipped":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    image: "", // Base64 string for main image
    images: [] as string[], // Base64 strings for additional images (max 2)
    category: "",
    gender: "",
    season: "",
    style: "",
    occasion: "",
    sizes: [] as string[],
    colors: [] as string[],
    stock: "100",
    featured: false,
    active: true,
  })
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([])
  const [newSize, setNewSize] = useState("")
  const [newColor, setNewColor] = useState("")
  const { user, logout, isLoading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()

  // Redirect if not employee (only check once)
  const hasCheckedAuth = useRef(false)
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return
    
    // Only check once
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true
    
    if (user && user.role !== "employee") {
      console.log("⚠️ User is not employee, redirecting. Role:", user.role)
      window.location.href = "/"
      return
    }
    
    // If no user and auth finished loading, redirect to login
    if (!user && !authLoading) {
      console.log("⚠️ No user found, redirecting to login")
      window.location.href = "/login"
      return
    }
  }, [user, authLoading, router])

  // Load orders, users, products, and preferences
  useEffect(() => {
    loadOrders()
    loadUsers()
    loadProducts()
    loadUserPreferences()
  }, [])

  // Load products when products tab is active
  useEffect(() => {
    if (activeTab === "products") {
      loadProducts()
    }
  }, [activeTab])

  // Load user preferences from database
  const loadUserPreferences = async () => {
    try {
      const preferences = await userPreferencesApi.getPreferences()
      if (preferences) {
        // Restore active tab
        if (preferences.dashboardPreferences?.activeTab) {
          setActiveTab(preferences.dashboardPreferences.activeTab)
        }
        // Restore sidebar state
        if (preferences.sidebarPreferences?.collapsed !== undefined) {
          // Employee page doesn't have sidebar state, but we can use it if needed
        }
        // Restore theme
        if (preferences.theme && preferences.theme !== 'system') {
          setTheme(preferences.theme)
        }
        // Restore language
        if (preferences.language) {
          setLanguage(preferences.language)
        }
      }
    } catch (error: any) {
      console.error("Failed to load user preferences:", error)
    }
  }

  // Save preferences to database when they change
  useEffect(() => {
    if (!user) return
    
    const savePreferences = async () => {
      try {
        // FIXED: Type-safe theme and language values
        await userPreferencesApi.updatePreferences({
          dashboardPreferences: {
            activeTab: activeTab,
          },
          theme: (theme === 'light' || theme === 'dark' || theme === 'system') 
            ? (theme as 'light' | 'dark' | 'system')
            : ('system' as 'light' | 'dark' | 'system'),
          language: (language === 'en' || language === 'ar') 
            ? (language as 'en' | 'ar')
            : ('en' as 'en' | 'ar'),
        })
      } catch (error: any) {
        console.error("Failed to save preferences:", error)
      }
    }

    // Debounce saving preferences
    const timeoutId = setTimeout(savePreferences, 1000)
    return () => clearTimeout(timeoutId)
  }, [activeTab, theme, language, user])

  const loadOrders = async () => {
    try {
      setLoading(true)
      console.log("🔄 Employee: Loading orders...")
      
      const ordersData = await ordersApi.getAllOrders({ limit: 100 })
      
      console.log("✅ Employee: Orders loaded:", {
        count: Array.isArray(ordersData) ? ordersData.length : 0,
        orders: ordersData,
      })
      
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (error: any) {
      console.error("❌ Employee: Error loading orders:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const usersData = await adminApi.getAllUsers({ limit: 100 })
      setUsers(usersData.data || [])
    } catch (error: any) {
      console.error("❌ Employee: Error loading users:", error)
    }
  }

  // Load products from database
  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await productsAdminApi.getAllProducts({ limit: 1000 })
      setProducts(response.data || [])
    } catch (error: any) {
      console.error("❌ Employee: Error loading products:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Convert file to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // Handle main image upload
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: language === "ar" ? "الملف يجب أن يكون صورة" : "File must be an image",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: language === "ar" ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setMainImageFile(file)
      const base64 = await fileToBase64(file)
      setProductForm({ ...productForm, image: base64 })
    } catch (error) {
      toast({
        title: "Error",
        description: language === "ar" ? "فشل تحميل الصورة" : "Failed to load image",
        variant: "destructive",
      })
    }
  }

  // Handle additional images upload (max 2)
  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if adding these files would exceed the limit of 2
    if (productForm.images.length + files.length > 2) {
      toast({
        title: "Error",
        description: language === "ar" ? "يمكنك إضافة صورتين فرعيتين فقط" : "You can only add 2 additional images",
        variant: "destructive",
      })
      return
    }

    try {
      const newFiles: File[] = []
      const newBase64Images: string[] = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Error",
            description: language === "ar" ? "الملف يجب أن يكون صورة" : "File must be an image",
            variant: "destructive",
          })
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: language === "ar" ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image size must be less than 5MB",
            variant: "destructive",
          })
          continue
        }

        newFiles.push(file)
        const base64 = await fileToBase64(file)
        newBase64Images.push(base64)
      }

      setAdditionalImageFiles([...additionalImageFiles, ...newFiles])
      setProductForm({ ...productForm, images: [...productForm.images, ...newBase64Images] })
    } catch (error) {
      toast({
        title: "Error",
        description: language === "ar" ? "فشل تحميل الصور" : "Failed to load images",
        variant: "destructive",
      })
    }
  }

  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    const newImages = productForm.images.filter((_, i) => i !== index)
    const newFiles = additionalImageFiles.filter((_, i) => i !== index)
    setProductForm({ ...productForm, images: newImages })
    setAdditionalImageFiles(newFiles)
  }

  const handleDeleteUser = async (id: string) => {
    try {
      await adminApi.deleteUser(id)
      toast({
        title: language === "ar" ? "تم الحذف" : "Deleted",
        description: language === "ar" ? "تم حذف العميل بنجاح" : "Customer deleted successfully",
      })
      loadUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"], trackingNumber?: string) => {
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus, trackingNumber)
      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
      loadOrders()
    if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, trackingNumber })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing")
  const inProgressOrders = orders.filter((o) => o.status === "processing")
  const completedOrders = orders.filter((o) => o.status === "shipped" || o.status === "delivered")

  // Stats
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
  ]

  // Show loading while checking auth or loading dashboard data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not employee
  if (!user || user.role !== "employee") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border overflow-y-auto z-50">
        <div className="p-6">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              EMPLOYEE
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{user.firstName} {user.lastName}</span>
          </div>
        </div>

        <nav className="px-4 space-y-1 pb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "overview" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">{t("overview", language)}</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">{t("orders", language)}</span>
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {pendingOrders.length}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab("progress")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "progress" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Printer className="h-5 w-5" />
            <span className="font-medium">{language === "ar" ? "تتبع التقدم" : "Progress Tracking"}</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "products" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="font-medium">{t("products", language)}</span>
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "customers" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">{t("customers", language)}</span>
          </button>
        </nav>

        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex-1"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="flex-1"
            >
              <Languages className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => {
              window.open("/", "_blank")
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            {language === "ar" ? "عرض كزائر" : "View as Guest"}
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full bg-transparent">
              {language === "ar" ? "العودة للمتجر" : "Back to Store"}
            </Button>
          </Link>
          <Button variant="outline" className="w-full bg-transparent" onClick={logout}>
            {t("logout", language)}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          </div>
        ) : (
          <>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {language === "ar" ? "لوحة تحكم الموظف" : "Employee Dashboard"}
                  </h1>
                  <p className="text-muted-foreground">
                    {language === "ar" ? "إدارة الطلبات والمخزون" : "Manage orders and inventory"}
                  </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                        {language === "ar" ? `الطلبات المعلقة (${pendingOrders.length})` : `Pending Orders (${pendingOrders.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                        {pendingOrders.slice(0, 5).map((order) => (
                          <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
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
                      </div>
                    ))}
                    {pendingOrders.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            {language === "ar" ? "لا توجد طلبات معلقة" : "No pending orders"}
                          </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                        {language === "ar" ? `قيد المعالجة (${inProgressOrders.length})` : `In Progress (${inProgressOrders.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                        {inProgressOrders.slice(0, 5).map((order) => (
                          <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {t(order.status, language)}
                              </Badge>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => viewOrderDetails(order)}>
                              {t("view", language)}
                        </Button>
                      </div>
                    ))}
                    {inProgressOrders.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            {language === "ar" ? "لا توجد طلبات قيد المعالجة" : "No orders in progress"}
                          </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
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
                        {orders.map((order) => (
                              <TableRow key={order._id}>
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
                                <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
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
                        {pendingOrders.map((order) => (
                              <TableRow key={order._id}>
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
                          </TableRow>
                        ))}
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
                        {inProgressOrders.map((order) => (
                              <TableRow key={order._id}>
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
                          </TableRow>
                        ))}
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
                        {completedOrders.map((order) => (
                              <TableRow key={order._id}>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

            {/* Progress Tab */}
        {activeTab === "progress" && (
          <div className="space-y-6">
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
                    <Printer className="h-5 w-5" />
                        {language === "ar" ? "قائمة الانتظار" : "Printing Queue"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders
                          .filter((o) => o.status === "pending")
                          .slice(0, 3)
                      .map((order) => (
                            <div key={order._id} className="p-3 border rounded-lg">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </p>
                          <Button
                            size="sm"
                            className="w-full"
                                onClick={() => updateOrderStatus(order._id, "processing")}
                          >
                                {language === "ar" ? "بدء المعالجة" : "Start Processing"}
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <PackageCheck className="h-5 w-5" />
                        {language === "ar" ? "جودة" : "Quality Check"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders
                          .filter((o) => o.status === "processing")
                          .slice(0, 3)
                      .map((order) => (
                            <div key={order._id} className="p-3 border rounded-lg">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                                  className="flex-1"
                                  onClick={() => updateOrderStatus(order._id, "pending")}
                            >
                                  {language === "ar" ? "رفض" : "Reject"}
                            </Button>
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => updateOrderStatus(order._id, "shipped")}
                                >
                                  {language === "ar" ? "موافقة" : "Approve"}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-600">
                    <Truck className="h-5 w-5" />
                        {language === "ar" ? "جاهز للشحن" : "Ready to Ship"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders
                          .filter((o) => o.status === "processing")
                          .slice(0, 3)
                      .map((order) => (
                            <div key={order._id} className="p-3 border rounded-lg">
                              <p className="font-medium mb-1">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </p>
                          <Button
                            size="sm"
                            className="w-full"
                                onClick={() => updateOrderStatus(order._id, "shipped")}
                          >
                                {language === "ar" ? "تم الشحن" : "Mark as Shipped"}
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {language === "ar" ? "إدارة المنتجات" : "Product Management"}
                </h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "إضافة وتعديل وحذف المنتجات من قاعدة البيانات" : "Add, edit, and delete products from database"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadProducts} variant="outline">
                  {language === "ar" ? "تحديث" : "Refresh"}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedProduct(null)
                    setIsEditingProduct(false)
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
                    })
                    setMainImageFile(null)
                    setAdditionalImageFiles([])
                    setNewSize("")
                    setNewColor("")
                    setShowProductModal(true)
                  }}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إضافة منتج" : "Add Product"}
                </Button>
              </div>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                {products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                        <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                        <TableHead>{language === "ar" ? "السعر" : "Price"}</TableHead>
                        <TableHead>{language === "ar" ? "المخزون" : "Stock"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product._id || product.id}>
                          <TableCell className="font-medium">
                            {language === "ar" && product.nameAr ? product.nameAr : product.name}
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>{product.stock || 0}</TableCell>
                          <TableCell>
                            <Badge variant={product.active !== false ? "default" : "secondary"}>
                              {product.active !== false ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedProduct(product)
                                  setIsEditingProduct(true)
                                  setProductForm({
                                    name: product.name || "",
                                    nameAr: (product as any).nameAr || "",
                                    description: product.description || "",
                                    descriptionAr: (product as any).descriptionAr || "",
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
                                  })
                                  setMainImageFile(null)
                                  setAdditionalImageFiles([])
                                  setNewSize("")
                                  setNewColor("")
                                  setShowProductModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (confirm(language === "ar" ? "هل أنت متأكد من حذف هذا المنتج؟" : "Are you sure you want to delete this product?")) {
                                    try {
                                      await productsAdminApi.deleteProduct(product._id || product.id?.toString() || "")
                                      toast({
                                        title: language === "ar" ? "تم الحذف" : "Deleted",
                                        description: language === "ar" ? "تم حذف المنتج بنجاح" : "Product deleted successfully",
                                      })
                                      loadProducts()
                                    } catch (error: any) {
                                      toast({
                                        title: "Error",
                                        description: error.message || "Failed to delete product",
                                        variant: "destructive",
                                      })
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "ar" ? "لا توجد منتجات" : "No products yet"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Add/Edit Product Modal */}
            <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 shadow-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingProduct
                      ? language === "ar" ? "تعديل المنتج" : "Edit Product"
                      : language === "ar" ? "إضافة منتج جديد" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {language === "ar" ? "املأ المعلومات أدناه" : "Fill in the information below"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder={language === "ar" ? "اسم المنتج بالإنجليزية" : "Product name in English"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameAr">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                      <Input
                        id="nameAr"
                        value={productForm.nameAr}
                        onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                        placeholder={language === "ar" ? "اسم المنتج بالعربية" : "Product name in Arabic"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                      <Textarea
                        id="description"
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder={language === "ar" ? "وصف المنتج بالإنجليزية" : "Product description in English"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionAr">{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                      <Textarea
                        id="descriptionAr"
                        value={productForm.descriptionAr}
                        onChange={(e) => setProductForm({ ...productForm, descriptionAr: e.target.value })}
                        placeholder={language === "ar" ? "وصف المنتج بالعربية" : "Product description in Arabic"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">{language === "ar" ? "السعر" : "Price"} *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">{language === "ar" ? "المخزون" : "Stock"}</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* Main Image Upload (Required) */}
                  <div className="space-y-2">
                    <Label htmlFor="main-image">{language === "ar" ? "الصورة الرئيسية" : "Main Image"} *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                      <Label htmlFor="main-image" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {language === "ar" ? "اضغط لرفع الصورة الرئيسية" : "Click to upload main image"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "ar" ? "PNG, JPG حتى 5 ميجابايت" : "PNG, JPG up to 5MB"}
                          </p>
                        </div>
                      </Label>
                      <input
                        id="main-image"
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        className="hidden"
                      />
                      {productForm.image && (
                        <div className="mt-4 relative w-full max-w-xs mx-auto">
                          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary">
                            <img 
                              src={productForm.image} 
                              alt={language === "ar" ? "معاينة الصورة الرئيسية" : "Main image preview"} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setProductForm({ ...productForm, image: "" })
                              setMainImageFile(null)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Images Upload (Optional, max 2) */}
                  <div className="space-y-2">
                    <Label htmlFor="additional-images">
                      {language === "ar" ? "الصور الفرعية (اختياري)" : "Additional Images (Optional)"}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({language === "ar" ? "حد أقصى صورتان" : "Max 2 images"})
                      </span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
                      <Label htmlFor="additional-images" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {language === "ar" ? "اضغط لرفع صور فرعية" : "Click to upload additional images"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "ar" ? "PNG, JPG حتى 5 ميجابايت لكل صورة" : "PNG, JPG up to 5MB per image"}
                          </p>
                        </div>
                      </Label>
                      <input
                        id="additional-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImageUpload}
                        className="hidden"
                        disabled={productForm.images.length >= 2}
                      />
                      {productForm.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {productForm.images.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                              <img 
                                src={img} 
                                alt={language === "ar" ? `صورة فرعية ${index + 1}` : `Additional image ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => removeAdditionalImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{language === "ar" ? "الفئة" : "Category"} *</Label>
                      <Input
                        id="category"
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        placeholder="T-Shirts"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">{language === "ar" ? "الجنس" : "Gender"} *</Label>
                      <Select value={productForm.gender} onValueChange={(value) => setProductForm({ ...productForm, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر الجنس" : "Select gender"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Men">{language === "ar" ? "رجال" : "Men"}</SelectItem>
                          <SelectItem value="Women">{language === "ar" ? "نساء" : "Women"}</SelectItem>
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
                          <SelectValue placeholder={language === "ar" ? "اختر الموسم" : "Select season"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Summer">{language === "ar" ? "صيف" : "Summer"}</SelectItem>
                          <SelectItem value="Winter">{language === "ar" ? "شتاء" : "Winter"}</SelectItem>
                          <SelectItem value="All Season">{language === "ar" ? "كل المواسم" : "All Season"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="style">{language === "ar" ? "النمط" : "Style"} *</Label>
                      <Select value={productForm.style} onValueChange={(value) => setProductForm({ ...productForm, style: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر النمط" : "Select style"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Plain">{language === "ar" ? "عادي" : "Plain"}</SelectItem>
                          <SelectItem value="Graphic">{language === "ar" ? "رسومي" : "Graphic"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occasion">{language === "ar" ? "المناسبة" : "Occasion"} *</Label>
                    <Select value={productForm.occasion} onValueChange={(value) => setProductForm({ ...productForm, occasion: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر المناسبة" : "Select occasion"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Casual">{language === "ar" ? "عادي" : "Casual"}</SelectItem>
                        <SelectItem value="Formal">{language === "ar" ? "رسمي" : "Formal"}</SelectItem>
                        <SelectItem value="Sports">{language === "ar" ? "رياضي" : "Sports"}</SelectItem>
                        <SelectItem value="Wedding">{language === "ar" ? "زفاف" : "Wedding"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowProductModal(false)}>
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!productForm.name || !productForm.price || !productForm.image || !productForm.category || !productForm.gender || !productForm.season || !productForm.style || !productForm.occasion) {
                        toast({
                          title: "Error",
                          description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة (بما في ذلك الصورة الرئيسية)" : "Please fill all required fields (including main image)",
                          variant: "destructive",
                        })
                        return
                      }

                      try {
                        if (isEditingProduct && selectedProduct) {
                          const updateData: Partial<Product> = {
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
                          }
                          await productsAdminApi.updateProduct(selectedProduct._id || selectedProduct.id?.toString() || "", updateData)
                          toast({
                            title: language === "ar" ? "تم التحديث" : "Updated",
                            description: language === "ar" ? "تم تحديث المنتج بنجاح" : "Product updated successfully",
                          })
                        } else {
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
                          })
                          toast({
                            title: language === "ar" ? "تمت الإضافة" : "Added",
                            description: language === "ar" ? "تم إضافة المنتج بنجاح" : "Product added successfully",
                          })
                        }
                        setShowProductModal(false)
                        loadProducts()
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to save product",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    {isEditingProduct ? (language === "ar" ? "تحديث" : "Update") : (language === "ar" ? "إضافة" : "Add")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div className="space-y-6">
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
                    {users.filter(u => u.role === "customer").length > 0 ? (
                <Table>
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
                          {users.filter(u => u.role === "customer").map((user) => (
                            <TableRow key={user._id}>
                              <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone || "-"}</TableCell>
                              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                toast({
                                  title: language === "ar" ? "معلومات العميل" : "Customer Info",
                                  description: `${user.firstName} ${user.lastName} - ${user.email}`,
                                })
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={async () => {
                                      if (confirm(language === "ar" ? `هل أنت متأكد من حذف العميل ${user.firstName} ${user.lastName}؟` : `Are you sure you want to delete customer ${user.firstName} ${user.lastName}?`)) {
                                        await handleDeleteUser(user._id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">{language === "ar" ? "لا يوجد عملاء في قاعدة البيانات" : "No customers in database yet"}</p>
                        <p className="text-sm text-muted-foreground mt-2">{language === "ar" ? "سيظهر العملاء هنا عند تسجيلهم في الموقع" : "Customers will appear here when they register on the website"}</p>
                      </div>
                    )}
              </CardContent>
            </Card>
          </div>
        )}

            {/* Products Tab - Limited access for employees */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("products", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "عرض وتحديث مخزون المنتجات" : "View and update product inventory"}
                    </p>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                    <p className="text-center text-muted-foreground py-8">
                      {language === "ar" ? "يمكنك عرض المنتجات فقط. لا يمكنك إضافة أو حذف المنتجات." : "You can only view products. You cannot add or delete products."}
                    </p>
              </CardContent>
            </Card>
          </div>
        )}
          </>
        )}

        {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                <Select
                  value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder._id, value as Order["status"])}
                >
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

              {selectedOrder.status === "shipped" && (
                <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      {language === "ar" ? "رقم التتبع" : "Tracking Number"}
                    </Label>
                    <Input
                      placeholder={language === "ar" ? "أدخل رقم التتبع" : "Enter tracking number"}
                      defaultValue={selectedOrder.trackingNumber}
                      onBlur={(e) => {
                        if (e.target.value) {
                          updateOrderStatus(selectedOrder._id, selectedOrder.status, e.target.value)
                        }
                      }}
                    />
                </div>
              )}

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
        </div>
      )}
      </div>
    </div>
  )
}
