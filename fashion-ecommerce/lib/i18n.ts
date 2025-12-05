/**
 * نظام الترجمة المتقدم - دعم عربي/إنجليزي
 * يدعم الترجمة للنصوص والبيانات من قاعدة البيانات
 */

export type Language = "ar" | "en"

export interface TranslationData {
  [key: string]: string | TranslationData
}

// ترجمة النصوص الثابتة
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Dashboard
    dashboard: "Dashboard",
    overview: "Overview",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    analytics: "Analytics",
    staff: "Staff Management",
    reports: "Reports",
    settings: "Settings",
    
    // Stats
    totalRevenue: "Total Revenue",
    totalOrders: "Orders",
    totalProducts: "Products",
    totalCustomers: "Customers",
    pendingOrders: "Pending Orders",
    completedToday: "Completed Today",
    lowStockItems: "Low Stock Items",
    activeProducts: "Active Products",
    
    // Actions
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    save: "Save",
    cancel: "Cancel",
    update: "Update",
    search: "Search",
    
    // Status
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    completed: "Completed",
    active: "Active",
    inactive: "Inactive",
    
    // Common
    name: "Name",
    email: "Email",
    price: "Price",
    stock: "Stock",
    category: "Category",
    status: "Status",
    date: "Date",
    actions: "Actions",
    welcome: "Welcome",
    logout: "Logout",
    
    // Theme & Settings
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    region: "Region",
    autoDetect: "Auto-detect Region",
    selectRegion: "Select Region",
    currency: "Currency",
  },
  ar: {
    // Dashboard
    dashboard: "لوحة التحكم",
    overview: "نظرة عامة",
    orders: "الطلبات",
    products: "المنتجات",
    customers: "العملاء",
    analytics: "التحليلات",
    staff: "إدارة الموظفين",
    reports: "التقارير",
    settings: "الإعدادات",
    
    // Stats
    totalRevenue: "إجمالي الإيرادات",
    totalOrders: "الطلبات",
    totalProducts: "المنتجات",
    totalCustomers: "العملاء",
    pendingOrders: "الطلبات المعلقة",
    completedToday: "المكتملة اليوم",
    lowStockItems: "عناصر قليلة المخزون",
    activeProducts: "المنتجات النشطة",
    
    // Actions
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    save: "حفظ",
    cancel: "إلغاء",
    update: "تحديث",
    search: "بحث",
    
    // Status
    pending: "معلق",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    completed: "مكتمل",
    active: "نشط",
    inactive: "غير نشط",
    
    // Common
    name: "الاسم",
    email: "البريد الإلكتروني",
    price: "السعر",
    stock: "المخزون",
    category: "الفئة",
    status: "الحالة",
    date: "التاريخ",
    actions: "الإجراءات",
    welcome: "مرحباً",
    logout: "تسجيل الخروج",
    
    // Theme & Settings
    theme: "المظهر",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    language: "اللغة",
    region: "المنطقة",
    autoDetect: "اكتشاف المنطقة تلقائياً",
    selectRegion: "اختر المنطقة",
    currency: "العملة",
  },
}

// Helper function to get translated text
export function t(key: string, lang: Language = "en"): string {
  return translations[lang][key] || key
}

// Helper function to get translated data based on language preference
export function getTranslatedData<T extends { name?: string; nameAr?: string; nameEn?: string }>(
  item: T,
  lang: Language
): string {
  if (lang === "ar" && item.nameAr) {
    return item.nameAr
  }
  if (lang === "en" && item.nameEn) {
    return item.nameEn
  }
  return item.name || ""
}

// Helper for multilingual fields
export interface MultilingualField {
  ar?: string
  en?: string
}

export function getMultilingualValue(field: MultilingualField | string | undefined, lang: Language): string {
  if (!field) return ""
  
  if (typeof field === "string") {
    return field
  }
  
  if (lang === "ar" && field.ar) {
    return field.ar
  }
  
  if (lang === "en" && field.en) {
    return field.en
  }
  
  return field.ar || field.en || ""
}

