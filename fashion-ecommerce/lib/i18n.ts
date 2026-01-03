




export type Language = "ar" | "en"

export interface TranslationData {
  [key: string]: string | TranslationData
}


export const translations: Record<Language, Record<string, string>> = {
  en: {
    
    dashboard: "Dashboard",
    overview: "Overview",
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    analytics: "Analytics",
    staff: "Staff Management",
    reports: "Reports",
    settings: "Settings",
    
    
    totalRevenue: "Total Revenue",
    totalOrders: "Orders",
    totalProducts: "Products",
    totalCustomers: "Customers",
    pendingOrders: "Pending Orders",
    completedToday: "Completed Today",
    lowStockItems: "Low Stock Items",
    activeProducts: "Active Products",
    
    
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    save: "Save",
    cancel: "Cancel",
    update: "Update",
    search: "Search",
    
    
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    completed: "Completed",
    active: "Active",
    inactive: "Inactive",
    
    
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
    
    dashboard: "لوحة التحكم",
    overview: "نظرة عامة",
    orders: "الطلبات",
    products: "المنتجات",
    customers: "العملاء",
    analytics: "التحليلات",
    staff: "إدارة الموظفين",
    reports: "التقارير",
    settings: "الإعدادات",
    
    
    totalRevenue: "إجمالي الإيرادات",
    totalOrders: "الطلبات",
    totalProducts: "المنتجات",
    totalCustomers: "العملاء",
    pendingOrders: "الطلبات المعلقة",
    completedToday: "المكتملة اليوم",
    lowStockItems: "عناصر قليلة المخزون",
    activeProducts: "المنتجات النشطة",
    
    
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    save: "حفظ",
    cancel: "إلغاء",
    update: "تحديث",
    search: "بحث",
    
    
    pending: "معلق",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    completed: "مكتمل",
    active: "نشط",
    inactive: "غير نشط",
    
    
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


export function t(key: string, lang: Language = "en"): string {
  return translations[lang][key] || key
}


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

