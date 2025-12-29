"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  FileText,
  UserCog,
  Palette as PaletteIcon,
  Star,
  Shield,
  Eye,
  LogOut,
  Languages,
  Moon,
  Sun,
  Truck,
  ChevronLeft,
  Shapes,
  Camera,
  SlidersHorizontal,
  BadgeCheck,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { useTheme } from "next-themes"
import { useLanguage } from "@/lib/language"
import { t } from "@/lib/i18n"

type AdminSidebarProps = {
  activeTab?: string
  pendingReviewsCount?: number
  sidebarOpen?: boolean
  onToggleCollapse?: () => void
  onMobileClose?: () => void
}

const tabItems = [
  { key: "overview", icon: LayoutDashboard, labelKey: "overview" },
  { key: "orders", icon: ShoppingCart, labelKey: "orders" },
  { key: "products", icon: Package, labelKey: "products" },
  { key: "studioProducts", icon: PaletteIcon, label: { en: "Studio Products", ar: "منتجات الاستوديو" } },
  { key: "customers", icon: Users, labelKey: "customers" },
  { key: "reviews", icon: Star, label: { en: "Reviews", ar: "الآراء" } },
  { key: "analytics", icon: BarChart3, labelKey: "analytics" },
  { key: "staff", icon: UserCog, labelKey: "staff" },
  { key: "tracking", icon: Truck, label: { en: "Order Tracking", ar: "تتبع الطلبات" } },
  { key: "reports", icon: FileText, labelKey: "reports" },
  { key: "settings", icon: Settings, labelKey: "settings" },
]

const moduleItems = [
  { href: "/admin/suppliers", icon: Users, label: { en: "Suppliers", ar: "إدارة الموردين" } },
  { href: "/admin/partners", icon: Shapes, label: { en: "Partner Stores", ar: "متاجر الشركاء" } },
  { href: "/admin/similar-products", icon: SlidersHorizontal, label: { en: "Similar Products", ar: "المنتجات المشابهة" } },
  { href: "/admin/virtual-experience", icon: Camera, label: { en: "Virtual Experience", ar: "التجربة الافتراضية" } },
  { href: "/admin/custom-design", icon: BadgeCheck, label: { en: "Custom Design", ar: "التصميم المخصص" } },
  { href: "/admin/vendor-approvals", icon: UserCog, label: { en: "Vendor Approvals", ar: "اعتمادات البائعين" } },
  { href: "/admin/role-assignments", icon: UserCog, label: { en: "Role Assignments", ar: "إدارة الأدوار" } },
]

const activeClasses =
  "bg-blue-800 text-white border border-blue-900 dark:bg-blue-900 dark:text-white dark:border-blue-950 shadow-md"
const inactiveClasses = "text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:translate-x-1"

export function AdminSidebar({
  activeTab,
  pendingReviewsCount,
  sidebarOpen = true,
  onToggleCollapse,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const tabParam = searchParams.get("tab") || "overview"
  const currentTab = activeTab || tabParam
  const isAdminRoot = pathname === "/admin"

  const resolveLabel = (item: { labelKey?: string; label?: { en: string; ar: string } }) => {
    if (item.labelKey) {
      return t(item.labelKey, language)
    }
    if (item.label) {
      return language === "ar" ? item.label.ar : item.label.en
    }
    return ""
  }

  const handleCloseIfMobile = () => {
    if (!onMobileClose || typeof window === "undefined") {
      return
    }
    if (window.innerWidth < 1024) {
      onMobileClose()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 lg:p-6 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="block">
            <Logo className="h-20 w-auto" />
          </Link>
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={onMobileClose}
            >
              <span className="sr-only">Close</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs font-semibold shadow-sm flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              ADMIN
            </Badge>
          </div>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse()
              }}
              title={
                sidebarOpen
                  ? language === "ar"
                    ? "إغلاق القائمة"
                    : "Close Menu"
                  : language === "ar"
                    ? "فتح القائمة"
                    : "Open Menu"
              }
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`}
              />
            </Button>
          )}
        </div>
        {user && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
          </div>
        )}
      </div>

      <nav className="px-3 lg:px-4 space-y-1.5 pt-4 pb-4 flex-1 overflow-y-auto">
        {tabItems.map((item) => {
          const isActive = isAdminRoot && currentTab === item.key
          const Icon = item.icon
          const label = resolveLabel(item)
          const href = `/admin?tab=${item.key}`
          return (
            <Link
              key={item.key}
              href={href}
              onClick={handleCloseIfMobile}
              className={`w-full flex items-center justify-start gap-3 px-3 lg:px-4 py-3 lg:py-3.5 rounded-lg transition-all duration-200 group ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="font-medium text-sm lg:text-base truncate">{label}</span>
              {item.key === "reviews" && (pendingReviewsCount || 0) > 0 && (
                <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingReviewsCount}
                </Badge>
              )}
            </Link>
          )
        })}

        <div className="pt-3 mt-3 border-t border-border/50 text-xs uppercase tracking-wide text-muted-foreground px-3 lg:px-4">
          {language === "ar" ? "الموديولات" : "Modules"}
        </div>

        {moduleItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleCloseIfMobile}
              className={`w-full flex items-center justify-start gap-3 px-3 lg:px-4 py-3 lg:py-3.5 rounded-lg transition-all duration-200 group ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="font-medium text-sm lg:text-base truncate">
                {language === "ar" ? item.label.ar : item.label.en}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 lg:p-4 space-y-2.5 border-t border-border/50 bg-background/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 hover:bg-primary/10 hover:border-primary/20 transition-all h-9"
            title={
              theme === "dark"
                ? language === "ar"
                  ? "الوضع الفاتح"
                  : "Light Mode"
                : language === "ar"
                  ? "الوضع الداكن"
                  : "Dark Mode"
            }
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="flex-1 hover:bg-primary/10 hover:border-primary/20 transition-all h-9"
            title={language === "ar" ? "English" : "العربية"}
          >
            <Languages className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full bg-transparent hover:bg-primary/10 hover:border-primary/20 transition-all text-sm h-10 justify-start flex items-center font-medium"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open("/", "_blank")
              }
            }}
          >
            <Eye className="h-4 w-4 flex-shrink-0 mr-2" />
            <span className="truncate">{language === "ar" ? "عرض كزائر" : "View as Guest"}</span>
          </Button>

          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full bg-transparent hover:bg-primary/10 hover:border-primary/20 transition-all text-sm h-10 justify-start font-medium"
            >
              <span className="truncate">{language === "ar" ? "العودة للمتجر" : "Back to Store"}</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full bg-transparent hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive transition-all text-sm h-10 justify-start flex items-center font-medium"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0 mr-2" />
            <span className="truncate">{t("logout", language)}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
