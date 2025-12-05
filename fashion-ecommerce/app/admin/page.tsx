"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Settings,
  BarChart3,
  FileText,
  UserCog,
  Shield,
  Database,
  Bell,
  Download,
  Plus,
  Star,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Moon,
  Sun,
  Languages,
  X,
  UserPlus,
  LogOut,
  Menu,
  ChevronLeft,
  Activity,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Logo } from "@/components/logo"
import { productsAdminApi } from "@/lib/api/productsAdmin"
import type { Product } from "@/lib/api/products"
import { useAuth } from "@/lib/auth"
import { adminApi, type DashboardStats, type User } from "@/lib/api/admin"
import { ordersApi, type Order } from "@/lib/api/orders"
import { userPreferencesApi, type UserPreferences } from "@/lib/api/userPreferences"
import { reviewsApi, type Review } from "@/lib/api/reviews"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useLanguage } from "@/lib/language"
import { t } from "@/lib/i18n"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

// FIXED: Helper functions for report generation
const generateSalesPDF = (report: any, language: string): string => {
  const title = language === "ar" ? "تقرير المبيعات" : "Sales Report"
  const date = new Date().toLocaleDateString()
  let content = `${title}\n${date}\n\n`
  
  if (report.salesByDay && Array.isArray(report.salesByDay)) {
    content += (language === "ar" ? "المبيعات حسب اليوم:\n" : "Sales by Day:\n")
    report.salesByDay.forEach((day: any) => {
      content += `${day._id}: $${day.totalSales?.toFixed(2) || 0} (${day.orderCount || 0} orders)\n`
    })
  }
  
  if (report.summary) {
    content += `\n${language === "ar" ? "الإجمالي" : "Total"}: $${report.summary.total?.toFixed(2) || 0}\n`
    content += `${language === "ar" ? "عدد الطلبات" : "Total Orders"}: ${report.summary.count || 0}\n`
  }
  
  return content
}

const generateInventoryPDF = (data: any[], language: string): string => {
  const title = language === "ar" ? "تقرير المخزون" : "Inventory Report"
  const date = new Date().toLocaleDateString()
  let content = `${title}\n${date}\n\n`
  
  data.forEach((item: any) => {
    content += `${item.name}: ${item.stock} ${language === "ar" ? "وحدة" : "units"} (${item.category})\n`
  })
  
  return content
}

const generateCustomerPDF = (data: any[], language: string): string => {
  const title = language === "ar" ? "تقرير العملاء" : "Customer Report"
  const date = new Date().toLocaleDateString()
  let content = `${title}\n${date}\n\n`
  
  data.forEach((customer: any) => {
    content += `${customer.name} (${customer.email}) - ${customer.phone}\n`
  })
  
  return content
}

// FIXED: Proper PDF download with correct MIME type
const downloadPDF = (content: string, filename: string) => {
  // Use text/plain for now (simple text-based PDF)
  // For proper PDF generation, would need a library like jsPDF or pdfkit
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  // FIXED: Ensure proper download attribute
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const exportToExcel = (data: any[], reportType: string, language: string) => {
  if (!data || data.length === 0) {
    return
  }
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${reportType}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>("pending")
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    image: "",
    images: [] as string[],
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
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newSize, setNewSize] = useState("")
  const [newColor, setNewColor] = useState("")
  const [isViewingAsGuest, setIsViewingAsGuest] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [sidebarManuallyClosed, setSidebarManuallyClosed] = useState(false)
  const sidebarTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [chartSettings, setChartSettings] = useState({
    revenueChartType: 'bar' as 'line' | 'bar' | 'area',
    ordersChartType: 'pie' as 'pie' | 'bar' | 'line',
    dateRange: '30d',
  })
  const [employeeForm, setEmployeeForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showEditOrder, setShowEditOrder] = useState(false)
  const [editOrderStatus, setEditOrderStatus] = useState<Order["status"]>("pending")
  const [editTrackingNumber, setEditTrackingNumber] = useState("")
  // FIXED: Employee tracking state variables
  const [employeeActivities, setEmployeeActivities] = useState<any[]>([])
  const [employeeStats, setEmployeeStats] = useState<any[]>([])
  const [trackingLoading, setTrackingLoading] = useState(false)
  const { user, logout, isLoading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()

  // Redirect if not admin (only check once)
  const hasCheckedAuth = useRef(false)
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return
    }
    
    // Only check once
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true
    
    console.log("🔍 Admin page - Auth loaded. User:", user?.email)
    console.log("🔍 Admin page - User role:", user?.role)
    
    if (user && user.role !== "admin") {
      console.log("⚠️ User is not admin, redirecting to home. Role:", user.role)
      window.location.href = "/"
      return
    }
    
    // If no user and auth finished loading, redirect to login
    if (!user && !authLoading) {
      console.log("⚠️ No user found, redirecting to login")
      window.location.href = "/login"
      return
    }
    
    // If user is admin, everything is good
    if (user && user.role === "admin") {
      console.log("✅ Admin user confirmed, showing dashboard")
    }
  }, [user, authLoading, router])

  // FIXED: Load dashboard data and preferences - also load staff immediately
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboardData()
      loadProducts()
      loadUserPreferences()
      // FIXED: Load staff immediately on page load
      loadStaff()
    }
  }, [user])

  // FIXED: Load user preferences from database with proper validation
  const loadUserPreferences = async () => {
    try {
      const preferences = await userPreferencesApi.getPreferences()
      if (preferences) {
        // FIXED: Validate and restore active tab with safe defaults
        if (preferences.dashboardPreferences?.activeTab) {
          setActiveTab(preferences.dashboardPreferences.activeTab)
        }
        // FIXED: Validate and restore sidebar state
        if (preferences.sidebarPreferences?.collapsed !== undefined) {
          setSidebarOpen(!preferences.sidebarPreferences.collapsed)
        }
        // FIXED: Validate chartSettings exists and has required properties
        const chartSettings = preferences.dashboardPreferences?.chartSettings
        if (chartSettings && typeof chartSettings === 'object') {
          setChartSettings({
            revenueChartType: (chartSettings.revenueChartType && ['line', 'bar', 'area'].includes(chartSettings.revenueChartType)) 
              ? chartSettings.revenueChartType as 'line' | 'bar' | 'area'
              : 'bar',
            ordersChartType: (chartSettings.ordersChartType && ['pie', 'bar', 'line'].includes(chartSettings.ordersChartType))
              ? chartSettings.ordersChartType as 'pie' | 'bar' | 'line'
              : 'pie',
            dateRange: chartSettings.dateRange || '30d',
          })
        }
        // Restore theme
        if (preferences.theme && preferences.theme !== 'system') {
          const themeValue = preferences.theme as 'light' | 'dark' | 'system'
          if (themeValue === 'light' || themeValue === 'dark' || themeValue === 'system') {
            setTheme(themeValue)
          }
        }
        // Restore language
        if (preferences.language) {
          setLanguage(preferences.language)
        }
      }
    } catch (error: any) {
      console.error("Failed to load user preferences:", error)
      // Continue with default values - preferences are not critical
    }
  }

  // Load customers when customers tab is opened
  useEffect(() => {
    if (activeTab === "customers" && user) {
      loadCustomers()
    }
  }, [activeTab, user])

  // FIXED: Load staff (admins and employees) when staff tab is opened
  useEffect(() => {
    if (activeTab === "staff" && user) {
      loadStaff()
    }
  }, [activeTab, user])

  // FIXED: Load employee tracking when tracking tab is opened
  useEffect(() => {
    if (activeTab === "tracking" && user) {
      loadEmployeeTracking()
    }
  }, [activeTab, user])

  // FIXED: Function to load employee tracking data from database
  const loadEmployeeTracking = async () => {
    try {
      setTrackingLoading(true)
      console.log("🔄 Loading employee tracking data from database...")
      
      // FIXED: Fetch data from backend API
      const trackingData = await adminApi.getEmployeeActivities({ limit: 100 })
      
      console.log("✅ Employee tracking loaded from database:", {
        activities: Array.isArray(trackingData.data) ? trackingData.data.length : 0,
        statistics: Array.isArray(trackingData.statistics) ? trackingData.statistics.length : 0,
        fullResponse: trackingData,
      })
      
      // FIXED: Ensure we have arrays
      setEmployeeActivities(Array.isArray(trackingData.data) ? trackingData.data : [])
      setEmployeeStats(Array.isArray(trackingData.statistics) ? trackingData.statistics : [])
      
      // Show success message if data loaded
      if (trackingData.data && trackingData.data.length > 0) {
        console.log("✅ Tracking data loaded successfully from database")
      }
    } catch (error: any) {
      console.error("❌ Error loading employee tracking from database:", error)
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || (language === "ar" ? "فشل تحميل بيانات التتبع" : "Failed to load employee tracking"),
        variant: "destructive",
      })
      // Set empty arrays on error
      setEmployeeActivities([])
      setEmployeeStats([])
    } finally {
      setTrackingLoading(false)
    }
  }

  // FIXED: Function to load staff (admins and employees) from database
  const loadStaff = async () => {
    try {
      setLoading(true)
      console.log("🔄 Loading staff from database...")
      
      // Load all users with admin or employee role
      const staffData = await adminApi.getAllUsers({ role: 'all', limit: 100 })
      
      // Filter to only admins and employees
      const staff = (staffData.data || []).filter((u: User) => 
        u.role === 'admin' || u.role === 'employee'
      )
      
      console.log("✅ Staff loaded:", {
        total: staff.length,
        admins: staff.filter((u: User) => u.role === 'admin').length,
        employees: staff.filter((u: User) => u.role === 'employee').length,
      })
      
      // Update users state with staff data
      setUsers(staff)
    } catch (error: any) {
      console.error("❌ Error loading staff:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load staff",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load reviews when reviews tab is opened
  useEffect(() => {
    if (activeTab === "reviews" && user) {
      loadReviews()
    }
  }, [activeTab, reviewStatusFilter, user])

  // FIXED: Save preferences to database when they change with proper validation
  useEffect(() => {
    if (!user) return
    
    const savePreferences = async () => {
      try {
        // FIXED: Ensure all objects exist and are valid before saving - no undefined values
        // FIXED: Type-safe preferences object
        const preferencesToSave: Partial<UserPreferences> = {
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
            collapsed: !sidebarOpen,
            width: 256,
          },
          theme: (theme === 'light' || theme === 'dark' || theme === 'system') 
            ? (theme as 'light' | 'dark' | 'system')
            : ('system' as 'light' | 'dark' | 'system'),
          language: (language && ['en', 'ar'].includes(language)) ? (language as 'en' | 'ar') : ('en' as 'en' | 'ar'),
        }
        
        await userPreferencesApi.updatePreferences(preferencesToSave)
      } catch (error: any) {
        // Silently fail - preferences saving is not critical
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to save preferences:", error?.message || error)
        }
      }
    }

    // Debounce saving preferences
    const timeoutId = setTimeout(savePreferences, 1000)
    return () => clearTimeout(timeoutId)
  }, [activeTab, sidebarOpen, theme, language, chartSettings, user])

  // Auto open/close sidebar on hover (desktop only)
  useEffect(() => {
    if (window.innerWidth >= 1024 && !sidebarManuallyClosed) {
      if (sidebarHovered) {
        // Clear any existing timeout
        if (sidebarTimeoutRef.current) {
          clearTimeout(sidebarTimeoutRef.current)
        }
        // Open sidebar after delay
        sidebarTimeoutRef.current = setTimeout(() => {
          setSidebarOpen(true)
        }, 200) // 200ms delay
      } else if (!sidebarHovered && sidebarOpen) {
        // Clear any existing timeout
        if (sidebarTimeoutRef.current) {
          clearTimeout(sidebarTimeoutRef.current)
        }
        // Close sidebar after delay only if not manually closed
        sidebarTimeoutRef.current = setTimeout(() => {
          if (!sidebarManuallyClosed) {
            setSidebarOpen(false)
          }
        }, 500) // 500ms delay before closing
      }
    }

    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current)
      }
    }
  }, [sidebarHovered, sidebarManuallyClosed, sidebarOpen])

  // Handle mouse enter/leave for sidebar area
  const handleSidebarMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setSidebarHovered(true)
    }
  }

  const handleSidebarMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      setSidebarHovered(false)
    }
  }

  // Handle mouse enter/leave for left edge trigger zone
  const handleEdgeMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setSidebarHovered(true)
      setSidebarManuallyClosed(false) // Reset manual close when hovering
    }
  }

  const handleEdgeMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      setSidebarHovered(false)
    }
  }

  const loadProducts = async () => {
    try {
      console.log("🔄 Loading products...")
      const response = await productsAdminApi.getAllProducts({ limit: 100 })
      const productsList = Array.isArray(response.data) ? response.data : []
      console.log("✅ Products loaded:", productsList.length)
      setProducts(productsList)
    } catch (error: any) {
      console.error("❌ Error loading products:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      })
    }
  }


  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log("🔄 Loading dashboard data...")
      
      const [statsData, ordersData, usersData] = await Promise.all([
        adminApi.getDashboardStats(),
        ordersApi.getAllOrders({ limit: 50 }),
        adminApi.getAllUsers({ role: 'all', limit: 100 }), // Load all users (customers, employees, admins)
      ])
      
      console.log("✅ Dashboard data loaded:", {
        stats: statsData,
        ordersCount: Array.isArray(ordersData) ? ordersData.length : 0,
        usersCount: usersData.data?.length || 0,
        customersCount: usersData.data?.filter((u: User) => u.role === 'customer').length || 0,
      })
      
      setStats(statsData)
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setUsers(usersData.data || [])
    } catch (error: any) {
      console.error("❌ Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // View Order Details
  const viewOrderDetails = async (orderId: string) => {
    try {
      const order = await ordersApi.getOrder(orderId)
      setSelectedOrder(order)
      setShowOrderDetails(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load order details",
        variant: "destructive",
      })
    }
  }

  // Edit Order (Open dialog)
  const openEditOrder = async (orderId: string) => {
    try {
      const order = await ordersApi.getOrder(orderId)
      setSelectedOrder(order)
      setEditOrderStatus(order.status)
      setEditTrackingNumber(order.trackingNumber || "")
      setShowEditOrder(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load order",
        variant: "destructive",
      })
    }
  }

  // Update Order Status
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return
    
    try {
      await ordersApi.updateOrderStatus(selectedOrder._id, editOrderStatus, editTrackingNumber || undefined)
      toast({
        title: "Success",
        description: language === "ar" ? "تم تحديث حالة الطلب بنجاح" : "Order status updated successfully",
      })
      setShowEditOrder(false)
      setSelectedOrder(null)
      loadDashboardData() // Reload orders
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الطلب؟" : "Are you sure you want to delete this order?")) {
      return
    }
    
    try {
      await ordersApi.deleteOrder(orderId)
      toast({
        title: "Success",
        description: language === "ar" ? "تم حذف الطلب بنجاح" : "Order deleted successfully",
      })
      loadDashboardData() // Reload orders
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  // Export Orders to CSV/Excel
  const exportOrders = () => {
    if (orders.length === 0) {
      toast({
        title: "Warning",
        description: language === "ar" ? "لا توجد طلبات للتصدير" : "No orders to export",
        variant: "default",
      })
      return
    }

    // Create CSV content
    const headers = [
      language === "ar" ? "رقم الطلب" : "Order ID",
      language === "ar" ? "العميل" : "Customer",
      language === "ar" ? "الإجمالي" : "Total",
      language === "ar" ? "الحالة" : "Status",
      language === "ar" ? "التاريخ" : "Date",
      language === "ar" ? "طريقة الدفع" : "Payment Method",
      language === "ar" ? "حالة الدفع" : "Payment Status",
    ]
    
    const rows = orders.map(order => [
      order.orderNumber,
      typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A",
      `$${order.total.toFixed(2)}`,
      order.status,
      new Date(order.createdAt).toLocaleDateString(),
      order.paymentInfo.method || "N/A",
      order.paymentInfo.status || "N/A",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `orders_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Success",
      description: language === "ar" ? "تم تصدير الطلبات بنجاح" : "Orders exported successfully",
    })
  }

  const loadCustomers = async () => {
    try {
      setLoading(true)
      console.log("🔄 Loading customers from database...")
      console.log("📡 API Call: getAllUsers({ role: 'customer', limit: 100 })")
      
      const customersData = await adminApi.getAllUsers({ role: 'customer', limit: 100 })
      
      console.log("📦 Full response from getAllUsers:", JSON.stringify(customersData, null, 2))
      console.log("✅ Customers loaded:", {
        total: customersData.total,
        page: customersData.page,
        pages: customersData.pages,
        customersCount: customersData.data?.length || 0,
        customers: customersData.data,
      })
      
      if (!customersData.data || customersData.data.length === 0) {
        console.warn("⚠️ No customers found in response!")
        toast({
          title: language === "ar" ? "تحذير" : "Warning",
          description: language === "ar" ? "لم يتم العثور على عملاء في قاعدة البيانات" : "No customers found in database",
          variant: "default",
        })
      }
      
      // Update users state with customers only
      setUsers(customersData.data || [])
    } catch (error: any) {
      console.error("❌ Error loading customers:", error)
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
      toast({
        title: "Error",
        description: error.message || "Failed to load customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    setReviewsLoading(true)
    try {
      console.log("🔄 Loading reviews...", { status: reviewStatusFilter })
      const response = await reviewsApi.getAllReviews({ 
        status: reviewStatusFilter === "all" ? undefined : reviewStatusFilter,
        limit: 50 
      })
      console.log("✅ Reviews loaded:", response.data.length)
      setReviews(response.data)
    } catch (error: any) {
      console.error("❌ Error loading reviews:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleReviewStatusUpdate = async (reviewId: string, status: "approved" | "rejected") => {
    try {
      await reviewsApi.updateReviewStatus(reviewId, status)
      toast({
        title: "Success",
        description: `Review ${status === "approved" ? "approved" : "rejected"} successfully`,
      })
      loadReviews()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update review status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      await adminApi.deleteUser(id)
      toast({ title: "Success", description: "User deleted successfully" })
      // Reload customers if we're on customers tab, otherwise reload dashboard
      if (activeTab === "customers") {
        loadCustomers()
      } else {
      loadDashboardData()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }


  // Prepare chart data from stats
  const revenueChartData = stats ? [
    { name: language === "ar" ? "اليوم" : "Today", revenue: stats.overview.totalRevenue * 0.1 },
    { name: language === "ar" ? "هذا الأسبوع" : "This Week", revenue: stats.overview.totalRevenue * 0.3 },
    { name: language === "ar" ? "هذا الشهر" : "This Month", revenue: stats.overview.totalRevenue * 0.6 },
    { name: language === "ar" ? "هذا العام" : "This Year", revenue: stats.overview.totalRevenue },
  ] : []

  const ordersChartData = stats ? [
    { name: language === "ar" ? "قيد الانتظار" : "Pending", value: stats.ordersByStatus.pending },
    { name: language === "ar" ? "قيد المعالجة" : "Processing", value: stats.ordersByStatus.processing },
    { name: language === "ar" ? "تم الشحن" : "Shipped", value: stats.ordersByStatus.shipped },
    { name: language === "ar" ? "تم التسليم" : "Delivered", value: stats.ordersByStatus.delivered },
  ] : []

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

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-[60] lg:hidden shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Edge Trigger Zone (for auto-open on hover) */}
      <div
        className="hidden lg:block fixed left-0 top-0 h-full w-4 z-[54] hover:z-[56] transition-all"
        onMouseEnter={handleEdgeMouseEnter}
        onMouseLeave={handleEdgeMouseLeave}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-background via-background to-muted/30 border-r border-border/50 backdrop-blur-sm z-[55] shadow-xl transition-all duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* Header Section */}
        <div className="p-6 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="block">
              <Logo />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs font-semibold shadow-sm">
                <Shield className="h-3 w-3 mr-1" />
                ADMIN
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                const newState = !sidebarOpen
                setSidebarOpen(newState)
                setSidebarHovered(false)
                setSidebarManuallyClosed(!newState) // Mark as manually closed if closing
                // Clear any pending timeouts
                if (sidebarTimeoutRef.current) {
                  clearTimeout(sidebarTimeoutRef.current)
                }
              }}
              title={sidebarOpen ? (language === "ar" ? "إغلاق القائمة" : "Close Menu") : (language === "ar" ? "فتح القائمة" : "Open Menu")}
            >
              <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`} />
            </Button>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
          </div>
        </div>

        {/* Navigation Section - Scrollable */}
        <nav className="px-3 lg:px-4 space-y-1 pt-4 pb-4 flex-1 overflow-y-auto">
          <button
            onClick={() => {
              setActiveTab("overview")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 group ${
              activeTab === "overview" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <LayoutDashboard className={`h-5 w-5 flex-shrink-0 ${activeTab === "overview" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("overview", language)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("orders")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "orders" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <ShoppingCart className={`h-5 w-5 flex-shrink-0 ${activeTab === "orders" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("orders", language)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("products")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "products" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <Package className={`h-5 w-5 flex-shrink-0 ${activeTab === "products" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("products", language)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("customers")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "customers" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <Users className={`h-5 w-5 flex-shrink-0 ${activeTab === "customers" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("customers", language)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("reviews")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 relative ${
              activeTab === "reviews" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <Star className={`h-5 w-5 flex-shrink-0 ${activeTab === "reviews" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{language === "ar" ? "الآراء" : "Reviews"}</span>
            {reviews.filter(r => r.status === "pending").length > 0 && (
              <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {reviews.filter(r => r.status === "pending").length}
              </Badge>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "analytics" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <BarChart3 className={`h-5 w-5 flex-shrink-0 ${activeTab === "analytics" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("analytics", language)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("staff")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "staff" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <UserCog className={`h-5 w-5 flex-shrink-0 ${activeTab === "staff" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("staff", language)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("tracking")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "tracking" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <Activity className={`h-5 w-5 flex-shrink-0 ${activeTab === "tracking" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{language === "ar" ? "تتبع الموظفين" : "Employee Tracking"}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("reports")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "reports" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <FileText className={`h-5 w-5 flex-shrink-0 ${activeTab === "reports" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("reports", language)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("settings")
              if (window.innerWidth < 1024) setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 ${
              activeTab === "settings" 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20" 
                : "hover:bg-muted/50 hover:translate-x-1"
            }`}
          >
            <Settings className={`h-5 w-5 flex-shrink-0 ${activeTab === "settings" ? "scale-110" : ""} transition-transform`} />
            <span className="font-medium text-sm lg:text-base truncate">{t("settings", language)}</span>
          </button>
        </nav>

        {/* Footer Section - Fixed at bottom */}
        <div className="p-3 lg:p-4 space-y-2 border-t border-border/50 bg-background/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex-1 hover:bg-primary/10 hover:border-primary/20 transition-all h-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="flex-1 hover:bg-primary/10 hover:border-primary/20 transition-all h-9"
            >
              <Languages className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full bg-transparent hover:bg-primary/10 hover:border-primary/20 transition-all text-xs lg:text-sm h-9 justify-start"
            onClick={() => {
              setIsViewingAsGuest(true)
              window.open("/", "_blank")
            }}
          >
            <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{language === "ar" ? "عرض كزائر" : "View as Guest"}</span>
          </Button>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full bg-transparent hover:bg-primary/10 hover:border-primary/20 transition-all text-xs lg:text-sm h-9 justify-start">
              <span className="truncate">{language === "ar" ? "العودة للمتجر" : "Back to Store"}</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full bg-transparent hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive transition-all text-xs lg:text-sm h-9 justify-start" 
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{t("logout", language)}</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out p-4 lg:p-8 animate-in fade-in duration-500 ${
        sidebarOpen ? "lg:ml-64" : "lg:ml-0"
      } min-h-screen`}>
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Overview Tab */}
            {activeTab === "overview" && stats && (
          <div className="space-y-8">
            <div>
                  <h1 className="text-3xl font-bold mb-2">{t("dashboard", language)} {t("overview", language)}</h1>
                  <p className="text-muted-foreground">
                    {t("welcome", language)} {user.firstName}! {language === "ar" ? "إليك ما يحدث في متجرك." : "Here's what's happening with your store."}
                  </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                          <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse" />
                    </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalRevenue", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">${stats.overview.totalRevenue.toFixed(2)}</p>
                  </CardContent>
                </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center shadow-sm">
                          <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalOrders", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{stats.overview.totalOrders}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center shadow-sm">
                          <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalProducts", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{stats.overview.totalProducts}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center shadow-sm">
                          <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-600 animate-pulse" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">{t("totalCustomers", language)}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">{stats.overview.totalUsers}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{t("totalRevenue", language)}</CardTitle>
                      <Select
                        value={chartSettings.revenueChartType}
                        onValueChange={(value: 'line' | 'bar' | 'area') => {
                          setChartSettings({ ...chartSettings, revenueChartType: value })
                        }}
                      >
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
                        {chartSettings.revenueChartType === 'line' ? (
                          <LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        ) : chartSettings.revenueChartType === 'area' ? (
                          <LineChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} fill="#8884d8" fillOpacity={0.6} />
                          </LineChart>
                        ) : (
                          <BarChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="#8884d8" />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-2 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{t("orders", language)} {language === "ar" ? "حسب الحالة" : "by Status"}</CardTitle>
                      <Select
                        value={chartSettings.ordersChartType}
                        onValueChange={(value: 'pie' | 'bar' | 'line') => {
                          setChartSettings({ ...chartSettings, ordersChartType: value })
                        }}
                      >
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
                        {chartSettings.ordersChartType === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={ordersChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {ordersChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        ) : chartSettings.ordersChartType === 'line' ? (
                          <LineChart data={ordersChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        ) : (
                          <BarChart data={ordersChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                    <CardTitle>{language === "ar" ? "الطلبات الأخيرة" : "Recent Orders"}</CardTitle>
              </CardHeader>
              <CardContent>
                    {orders.length > 0 ? (
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
                          {orders.slice(0, 5).map((order) => (
                            <TableRow key={order._id}>
                              <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                                {typeof order.user === "object" ? `${order.user.firstName} ${order.user.lastName}` : "N/A"}
                              </TableCell>
                              <TableCell>${order.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  order.status === "delivered" ? "default" :
                                  order.status === "processing" ? "secondary" : "outline"
                                }>
                                  {t(order.status, language)}
                          </Badge>
                        </TableCell>
                              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order._id)} title={language === "ar" ? "عرض التفاصيل" : "View Details"}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openEditOrder(order._id)} title={language === "ar" ? "تعديل" : "Edit"}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order._id)} title={language === "ar" ? "حذف" : "Delete"}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">{language === "ar" ? "لا توجد طلبات" : "No orders yet"}</p>
                    )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("orders", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "إدارة وتتبع جميع طلبات العملاء" : "Manage and track all customer orders"}
                    </p>
              </div>
                  <Button onClick={exportOrders}>
                    <Download className="h-4 w-4 mr-2" />
                    {language === "ar" ? "تصدير" : "Export"}
                  </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                    {orders.length > 0 ? (
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
                                <Badge variant={
                                  order.status === "delivered" ? "default" :
                                  order.status === "processing" ? "secondary" : "outline"
                                }>
                                  {t(order.status, language)}
                          </Badge>
                        </TableCell>
                              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order._id)} title={language === "ar" ? "عرض التفاصيل" : "View Details"}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditOrder(order._id)} title={language === "ar" ? "تعديل" : "Edit"}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order._id)} title={language === "ar" ? "حذف" : "Delete"}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">{language === "ar" ? "لا توجد طلبات" : "No orders yet"}</p>
                    )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("products", language)}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "إدارة مخزون المنتجات" : "Manage your product inventory"}
                </p>
              </div>
              <Button 
                onClick={() => {
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
                  setNewImageUrl("")
                  setNewSize("")
                  setNewColor("")
                  setShowProductModal(true)
                }}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("add", language)} {t("products", language)}
              </Button>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                {products.length > 0 ? (
                  <Table>
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
                              {product.active !== false ? t("active", language) : t("inactive", language)}
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
                                  setNewImageUrl("")
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
                      <Label htmlFor="price">{t("price", language)} *</Label>
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
                      <Label htmlFor="stock">{t("stock", language)}</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">{language === "ar" ? "رابط الصورة الرئيسية" : "Main Image URL"} *</Label>
                    <Input
                      id="image"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="/product-image.jpg"
                    />
                    {productForm.image && (
                      <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-border relative">
                        <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ar" ? "صور إضافية" : "Additional Images"}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder={language === "ar" ? "أدخل رابط الصورة" : "Enter image URL"}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newImageUrl.trim()) {
                            setProductForm({ ...productForm, images: [...productForm.images, newImageUrl.trim()] })
                            setNewImageUrl("")
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newImageUrl.trim()) {
                            setProductForm({ ...productForm, images: [...productForm.images, newImageUrl.trim()] })
                            setNewImageUrl("")
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {productForm.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {productForm.images.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                            <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-0 right-0 h-6 w-6"
                              onClick={() => {
                                setProductForm({ ...productForm, images: productForm.images.filter((_, i) => i !== idx) })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{t("category", language)} *</Label>
                      <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر الفئة" : "Select category"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="T-Shirts">T-Shirts</SelectItem>
                          <SelectItem value="Hoodies">Hoodies</SelectItem>
                          <SelectItem value="Sweatshirts">Sweatshirts</SelectItem>
                          <SelectItem value="Pants">Pants</SelectItem>
                          <SelectItem value="Shorts">Shorts</SelectItem>
                          <SelectItem value="Jackets">Jackets</SelectItem>
                          <SelectItem value="Tank Tops">Tank Tops</SelectItem>
                          <SelectItem value="Polo Shirts">Polo Shirts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">{language === "ar" ? "الجنس" : "Gender"} *</Label>
                      <Select value={productForm.gender} onValueChange={(value) => setProductForm({ ...productForm, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ar" ? "اختر الجنس" : "Select gender"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Men">Men</SelectItem>
                          <SelectItem value="Women">Women</SelectItem>
                          <SelectItem value="Unisex">Unisex</SelectItem>
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
                          <SelectValue placeholder={language === "ar" ? "اختر النمط" : "Select style"} />
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
                        <SelectValue placeholder={language === "ar" ? "اختر المناسبة" : "Select occasion"} />
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
                    <input
                      type="checkbox"
                      id="featured"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="featured" className="cursor-pointer">
                      {language === "ar" ? "منتج مميز" : "Featured Product"}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={productForm.active}
                      onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="active" className="cursor-pointer">
                      {language === "ar" ? "نشط" : "Active"}
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الأحجام المتاحة" : "Available Sizes"}</Label>
                    <div className="flex gap-2">
                      <Select value={newSize} onValueChange={setNewSize}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={language === "ar" ? "اختر الحجم" : "Select size"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="XXL">XXL</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => {
                          if (newSize && !productForm.sizes.includes(newSize)) {
                            setProductForm({ ...productForm, sizes: [...productForm.sizes, newSize] })
                            setNewSize("")
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {productForm.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {productForm.sizes.map((size) => (
                          <Badge key={size} variant="secondary" className="flex items-center gap-1">
                            {size}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={() => {
                                setProductForm({ ...productForm, sizes: productForm.sizes.filter((s) => s !== size) })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ar" ? "الألوان المتاحة" : "Available Colors"}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder={language === "ar" ? "أدخل اللون" : "Enter color"}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newColor.trim() && !productForm.colors.includes(newColor.trim())) {
                            setProductForm({ ...productForm, colors: [...productForm.colors, newColor.trim()] })
                            setNewColor("")
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newColor.trim() && !productForm.colors.includes(newColor.trim())) {
                            setProductForm({ ...productForm, colors: [...productForm.colors, newColor.trim()] })
                            setNewColor("")
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {productForm.colors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {productForm.colors.map((color) => (
                          <Badge key={color} variant="secondary" className="flex items-center gap-1">
                            {color}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={() => {
                                setProductForm({ ...productForm, colors: productForm.colors.filter((c) => c !== color) })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowProductModal(false)}>
                    {t("cancel", language)}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!productForm.name || !productForm.price || !productForm.image || !productForm.category || !productForm.gender || !productForm.season || !productForm.style || !productForm.occasion) {
                        toast({
                          title: "Error",
                          description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
                          variant: "destructive",
                        })
                        return
                      }

                      try {
                        if (isEditingProduct && selectedProduct) {
                          // FIXED: Convert productForm to match Product type
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
                        loadDashboardData()
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to save product",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    {t("save", language)}
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
                  <Button onClick={loadCustomers} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {language === "ar" ? "تحديث" : "Refresh"}
                  </Button>
            </div>

            <Card className="border-2 shadow-lg">
              <CardContent className="p-6">
                    {users.length > 0 ? (
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
                          {users.map((user) => (
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

        {/* Analytics Tab */}
            {activeTab === "analytics" && stats && (
          <div className="space-y-6">
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
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
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
                          <Pie
                            data={ordersChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {ordersChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

            {/* Staff Tab */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("staff", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "إدارة الموظفين والمديرين" : "Manage employees and administrators"}
                    </p>
              </div>
                  <Button 
                    onClick={() => {
                      setShowEmployeeModal(true)
                      setEmployeeForm({
                        firstName: "",
                        lastName: "",
                        email: "",
                        password: "",
                        phone: "",
                      })
                    }}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إضافة موظف" : "Add Employee"}
                  </Button>
            </div>

            {/* FIXED: Add refresh button and ensure data persists */}
            <div className="flex justify-end mb-4">
              <Button onClick={loadStaff} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
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
                        {users.filter(u => u.role === "admin").length > 0 ? (
                          users.filter(u => u.role === "admin").map((user) => (
                            <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.phone && (
                                <p className="text-xs text-muted-foreground mt-1">{user.phone}</p>
                              )}
                      </div>
                      <Badge variant="destructive">Admin</Badge>
                    </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            {language === "ar" ? "لا يوجد مديرون" : "No administrators found"}
                          </p>
                        )}
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
                        {users.filter(u => u.role === "employee").length > 0 ? (
                          users.filter(u => u.role === "employee").map((user) => (
                            <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.phone && (
                                <p className="text-xs text-muted-foreground mt-1">{user.phone}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === "ar" ? "تاريخ التسجيل: " : "Joined: "}
                                {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                      </div>
                      <Badge>Employee</Badge>
                    </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            {language === "ar" ? "لا يوجد موظفون" : "No employees yet"}
                          </p>
                        )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Employee Modal */}
            <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
              <DialogContent className="border-2 shadow-2xl">
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
                      <Input
                        id="empFirstName"
                        value={employeeForm.firstName}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                        placeholder={language === "ar" ? "الاسم الأول" : "First name"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empLastName">{language === "ar" ? "اسم العائلة" : "Last Name"} *</Label>
                      <Input
                        id="empLastName"
                        value={employeeForm.lastName}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                        placeholder={language === "ar" ? "اسم العائلة" : "Last name"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empEmail">{language === "ar" ? "البريد الإلكتروني" : "Email"} *</Label>
                    <Input
                      id="empEmail"
                      type="email"
                      value={employeeForm.email}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                      placeholder="employee@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empPassword">{language === "ar" ? "كلمة المرور" : "Password"} *</Label>
                    <Input
                      id="empPassword"
                      type="password"
                      value={employeeForm.password}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                      placeholder={language === "ar" ? "كلمة المرور" : "Password"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empPhone">{language === "ar" ? "رقم الهاتف" : "Phone"} (اختياري)</Label>
                    <Input
                      id="empPhone"
                      value={employeeForm.phone}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEmployeeModal(false)}>
                    {t("cancel", language)}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.email || !employeeForm.password) {
                        toast({
                          title: "Error",
                          description: language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
                          variant: "destructive",
                        })
                        return
                      }

                      try {
                        await adminApi.createEmployee(employeeForm)
                        toast({
                          title: language === "ar" ? "تمت الإضافة" : "Success",
                          description: language === "ar" ? "تم إضافة الموظف بنجاح" : "Employee created successfully",
                        })
                        setShowEmployeeModal(false)
                        // FIXED: Reload staff data after creating employee
                        loadStaff()
                        loadDashboardData()
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to create employee",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    {language === "ar" ? "إضافة موظف" : "Add Employee"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
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
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {language === "ar" ? "لا توجد آراء" : "No reviews found"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const userName = review.user
                    ? `${review.user.firstName} ${review.user.lastName}`
                    : "Anonymous"
                  
                  return (
                    <Card key={review._id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <Badge
                                variant={
                                  review.status === "approved"
                                    ? "default"
                                    : review.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
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
                          {review.status === "pending" && (
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReviewStatusUpdate(review._id, "approved")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {language === "ar" ? "موافقة" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReviewStatusUpdate(review._id, "rejected")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {language === "ar" ? "رفض" : "Reject"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* FIXED: Employee Tracking Tab */}
        {activeTab === "tracking" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "تتبع الموظفين" : "Employee Tracking"}</h1>
                <p className="text-muted-foreground">
                  {language === "ar" ? "تتبع أنشطة الموظفين والإجراءات" : "Track employee activities and actions"}
                </p>
              </div>
              <Button onClick={loadEmployeeTracking} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {language === "ar" ? "تحديث" : "Refresh"}
              </Button>
            </div>

            {/* Employee Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "إحصائيات الموظفين" : "Employee Statistics"}</CardTitle>
                <CardDescription>
                  {language === "ar" ? "نظرة عامة على أنشطة الموظفين" : "Overview of employee activities"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trackingLoading ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
                    <p className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
                  </div>
                ) : employeeStats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                        <TableHead>{language === "ar" ? "إجمالي الإجراءات" : "Total Actions"}</TableHead>
                        <TableHead>{language === "ar" ? "المنتجات المضافة" : "Products Added"}</TableHead>
                        <TableHead>{language === "ar" ? "الطلبات المحدثة" : "Orders Updated"}</TableHead>
                        <TableHead>{language === "ar" ? "آخر نشاط" : "Last Activity"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeStats.map((stat: any) => (
                        <TableRow key={stat.employeeId}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{stat.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{stat.employeeEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{stat.totalActions}</TableCell>
                          <TableCell>{stat.productsAdded}</TableCell>
                          <TableCell>{stat.ordersUpdated}</TableCell>
                          <TableCell>
                            {stat.lastActivity ? new Date(stat.lastActivity).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {language === "ar" ? "لا توجد بيانات تتبع متاحة" : "No tracking data available"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "الأنشطة الأخيرة" : "Recent Activities"}</CardTitle>
                <CardDescription>
                  {language === "ar" ? "سجل أنشطة الموظفين" : "Employee activity log"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trackingLoading ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
                    <p className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
                  </div>
                ) : employeeActivities.length > 0 ? (
                  <div className="space-y-4">
                    {employeeActivities.map((activity: any) => (
                      <div key={activity._id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{activity.action}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {activity.employee?.firstName} {activity.employee?.lastName}
                            </span>
                          </div>
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {language === "ar" ? "لا توجد أنشطة مسجلة" : "No activities recorded"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                    <h1 className="text-3xl font-bold mb-2">{t("reports", language)}</h1>
                    <p className="text-muted-foreground">
                      {language === "ar" ? "إنشاء وتحميل تقارير الأعمال" : "Generate and download business reports"}
                    </p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    setLoading(true)
                    // Export all reports
                    const [salesReport, productsData, customersData] = await Promise.all([
                      adminApi.getSalesReport().catch(() => ({ salesByDay: [], summary: { total: 0, count: 0 } })),
                      productsAdminApi.getAllProducts({ limit: 1000 }).catch(() => ({ data: [] })),
                      adminApi.getAllUsers({ role: 'customer', limit: 1000 }).catch(() => ({ data: [] })),
                    ])
                    
                    // Combine all data
                    const allData = {
                      sales: salesReport,
                      inventory: Array.isArray(productsData.data) ? productsData.data : productsData,
                      customers: customersData.data || [],
                      exportDate: new Date().toISOString(),
                    }
                    
                    // Export as JSON
                    const jsonContent = JSON.stringify(allData, null, 2)
                    const blob = new Blob([jsonContent], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `all-reports-${new Date().toISOString().split('T')[0]}.json`
                    link.click()
                    URL.revokeObjectURL(url)
                    
                    toast({
                      title: "Success",
                      description: language === "ar" ? "تم تصدير جميع التقارير" : "All reports exported",
                    })
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to export reports",
                      variant: "destructive",
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
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
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              const report = await adminApi.getSalesReport()
                              // Generate PDF content
                              const pdfContent = generateSalesPDF(report, language)
                              downloadPDF(pdfContent, `sales-report-${new Date().toISOString().split('T')[0]}.pdf`)
                              toast({
                                title: "Success",
                                description: language === "ar" ? "تم تحميل تقرير المبيعات" : "Sales report downloaded",
                              })
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to generate report",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {language === "ar" ? "PDF" : "PDF"}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              const report = await adminApi.getSalesReport()
                              // FIXED: Convert SalesReport to array format for exportToExcel
                              const salesData = report.salesByDay?.map((day: any) => ({
                                Date: day._id,
                                'Total Sales': `$${day.totalSales?.toFixed(2) || 0}`,
                                'Order Count': day.orderCount || 0,
                              })) || []
                              exportToExcel(salesData, 'sales-report', language)
                              toast({
                                title: "Success",
                                description: language === "ar" ? "تم تصدير تقرير المبيعات" : "Sales report exported",
                              })
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to export report",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
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
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              await loadProducts()
                              const inventoryData = products.map(p => ({
                                name: p.name,
                                stock: p.stock,
                                category: p.category,
                                price: p.price,
                              }))
                              const pdfContent = generateInventoryPDF(inventoryData, language)
                              downloadPDF(pdfContent, `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`)
                              toast({
                                title: "Success",
                                description: language === "ar" ? "تم تحميل تقرير المخزون" : "Inventory report downloaded",
                              })
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to generate report",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {language === "ar" ? "PDF" : "PDF"}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              await loadProducts()
                              const inventoryData = products.map(p => ({
                                name: p.name,
                                stock: p.stock,
                                category: p.category,
                                price: p.price,
                              }))
                              exportToExcel(inventoryData, 'inventory-report', language)
                              toast({
                                title: "Success",
                                description: language === "ar" ? "تم تصدير تقرير المخزون" : "Inventory report exported",
                              })
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to export report",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
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
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              await loadCustomers()
                              const customerData = users.map(u => ({
                                name: `${u.firstName} ${u.lastName}`,
                                email: u.email,
                                phone: u.phone || 'N/A',
                                createdAt: new Date(u.createdAt).toLocaleDateString(),
                              }))
                              const pdfContent = generateCustomerPDF(customerData, language)
                              downloadPDF(pdfContent, `customer-report-${new Date().toISOString().split('T')[0]}.pdf`)
                              toast({
                                title: "Success",
                                description: language === "ar" ? "تم تحميل تقرير العملاء" : "Customer report downloaded",
                              })
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to generate report",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {language === "ar" ? "PDF" : "PDF"}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              await loadCustomers()
                              const customerData = users.map(u => ({
                                name: `${u.firstName} ${u.lastName}`,
                                email: u.email,
                                phone: u.phone || 'N/A',
                                createdAt: new Date(u.createdAt).toLocaleDateString(),
                              }))
                              exportToExcel(customerData, 'customer-report', language)
                              toast({
                                title: "Success",
                                description: language === "ar" ? "تم تصدير تقرير العملاء" : "Customer report exported",
                              })
                            } catch (error: any) {
                              toast({
                                title: "Error",
                                description: error.message || "Failed to export report",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {language === "ar" ? "Excel" : "Excel"}
                        </Button>
                      </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
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
                    <Input defaultValue="StyleCraft" />
                  </div>
                  <div>
                        <Label>{language === "ar" ? "البريد الإلكتروني للتواصل" : "Contact Email"}</Label>
                    <Input defaultValue="admin@stylecraft.com" />
                  </div>
                  <div>
                        <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
                    <Input defaultValue="USD" />
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
          </div>
            )}
          </>
        )}

        {/* Order Details Modal */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "تفاصيل الطلب" : "Order Details"}</DialogTitle>
              <DialogDescription>
                {selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
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
                    <Badge variant={
                      selectedOrder.status === "delivered" ? "default" :
                      selectedOrder.status === "processing" ? "secondary" : "outline"
                    }>
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

                {/* Items */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">{language === "ar" ? "المنتجات" : "Items"}</Label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" ? "الكمية" : "Quantity"}: {item.quantity} • {language === "ar" ? "الحجم" : "Size"}: {item.size} • {language === "ar" ? "اللون" : "Color"}: {item.color}
                          </p>
                        </div>
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
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

                {/* Payment Info */}
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

                {/* Totals */}
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
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Order Modal */}
        <Dialog open={showEditOrder} onOpenChange={setShowEditOrder}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "تعديل الطلب" : "Edit Order"}</DialogTitle>
              <DialogDescription>
                {selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <Label>{language === "ar" ? "حالة الطلب" : "Order Status"}</Label>
                  <Select value={editOrderStatus} onValueChange={(value) => setEditOrderStatus(value as Order["status"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                      <SelectItem value="processing">{language === "ar" ? "قيد المعالجة" : "Processing"}</SelectItem>
                      <SelectItem value="shipped">{language === "ar" ? "تم الشحن" : "Shipped"}</SelectItem>
                      <SelectItem value="delivered">{language === "ar" ? "تم التسليم" : "Delivered"}</SelectItem>
                      <SelectItem value="cancelled">{language === "ar" ? "ملغى" : "Cancelled"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === "ar" ? "رقم التتبع" : "Tracking Number"}</Label>
                  <Input
                    value={editTrackingNumber}
                    onChange={(e) => setEditTrackingNumber(e.target.value)}
                    placeholder={language === "ar" ? "أدخل رقم التتبع" : "Enter tracking number"}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditOrder(false)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleUpdateOrderStatus}>
                {language === "ar" ? "حفظ" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
