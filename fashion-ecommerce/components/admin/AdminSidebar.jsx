"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Package, ShoppingCart, Users, UserCog, Palette as PaletteIcon, Star, Truck, Shapes, Camera, SlidersHorizontal, BadgeCheck, MessageSquare, } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
const navigationSections = [
    {
        id: "products",
        title: { en: "Products & Orders", ar: "Products & Orders" },
        items: [
            { type: "tab", key: "products", icon: Package, labelKey: "products" },
            { type: "tab", key: "studioProducts", icon: PaletteIcon, label: { en: "Studio Products", ar: "U.U+O¦OªOO¦ OU,OO3O¦U^O_USU^" } },
            { type: "tab", key: "orders", icon: ShoppingCart, labelKey: "orders" },
            { type: "tab", key: "tracking", icon: Truck, label: { en: "Order Tracking", ar: "O¦O¦O\"1 OU,OúU,O\"O¦" } },
            { type: "tab", key: "customers", icon: Users, labelKey: "customers" },
            { type: "tab", key: "reviews", icon: Star, label: { en: "Reviews", ar: "OU,O›OñOO­" } },
        ],
    },
    {
        id: "employees",
        title: { en: "Employees", ar: "Employees" },
        items: [
            { type: "tab", key: "staff", icon: UserCog, labelKey: "staff" },
            { type: "module", href: "/admin/role-assignments", icon: UserCog, label: { en: "Role Assignments", ar: "OO_OOñOc OU,OœO_U^OOñ" } },
        ],
    },
    {
        id: "chat",
        title: { en: "Chat", ar: "Chat" },
        items: [
            { type: "module", href: "/admin/staff-chat", icon: MessageSquare, label: { en: "Staff Chat", ar: "Staff Chat" } },
        ],
    },
    {
        id: "suppliers",
        title: { en: "Suppliers", ar: "Suppliers" },
        items: [
            { type: "module", href: "/admin/suppliers", icon: Users, label: { en: "Suppliers", ar: "OO_OOñOc OU,U.U^OñO_USU+" } },
            { type: "module", href: "/admin/vendor-approvals", icon: UserCog, label: { en: "Vendor Approvals", ar: "OO1O¦U.OO_OO¦ OU,O\"OÝO1USU+" } },
        ],
    },
    {
        id: "features",
        title: { en: "Features", ar: "Features" },
        items: [
            { type: "module", href: "/admin/similar-products", icon: SlidersHorizontal, label: { en: "Similar Products", ar: "OU,U.U+O¦OªOO¦ OU,U.O'OO\"UØOc" } },
            { type: "module", href: "/admin/virtual-experience", icon: Camera, label: { en: "Virtual Experience", ar: "OU,O¦OªOñO\"Oc OU,OU?O¦OñOOUSOc" } },
            { type: "module", href: "/admin/custom-design", icon: BadgeCheck, label: { en: "Custom Design", ar: "OU,O¦OæU.USU. OU,U.OrOæOæ" } },
        ],
    },
    {
        id: "partners",
        title: { en: "Partner Stores", ar: "Partner Stores" },
        items: [
            { type: "module", href: "/admin/partners", icon: Shapes, label: { en: "Partner Stores", ar: "U.O¦OOªOñ OU,O'OñUŸOO­" } },
        ],
    },
];
const activeClasses = "bg-blue-800 text-white border border-blue-900 dark:bg-blue-900 dark:text-white dark:border-blue-950 shadow-md";
const inactiveClasses = "text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:translate-x-1";
const sectionClasses = {
    general: "bg-slate-100 text-slate-700 border-slate-200",
    products: "bg-rose-100 text-rose-700 border-rose-200",
    employees: "bg-sky-100 text-sky-700 border-sky-200",
    chat: "bg-cyan-100 text-cyan-700 border-cyan-200",
    suppliers: "bg-amber-100 text-amber-700 border-amber-200",
    features: "bg-emerald-100 text-emerald-700 border-emerald-200",
    partners: "bg-violet-100 text-violet-700 border-violet-200",
};
const isActiveItem = (item, pathname, isAdminRoot, currentTab) => {
    if (item.type === "tab") {
        return isAdminRoot && currentTab === item.key;
    }
    if (!item.href) {
        return false;
    }
    return pathname.startsWith(item.href);
};
const getActiveSectionId = (sections, pathname, isAdminRoot, currentTab) => {
    const activeSection = sections.find((section) => section.items.some((item) => isActiveItem(item, pathname, isAdminRoot, currentTab)));
    return activeSection?.id ?? null;
};
export function AdminSidebar({ activeTab, pendingReviewsCount }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { language } = useLanguage();
    const tabParam = searchParams.get("tab") || "overview";
    const currentTab = activeTab || tabParam;
    const isAdminRoot = pathname === "/admin";
    const [openSectionId, setOpenSectionId] = useState(() => getActiveSectionId(navigationSections, pathname, isAdminRoot, currentTab));
    useEffect(() => {
        const activeSectionId = getActiveSectionId(navigationSections, pathname, isAdminRoot, currentTab);
        if (activeSectionId) {
            setOpenSectionId(activeSectionId);
        }
    }, [pathname, isAdminRoot, currentTab]);
    const resolveLabel = (item) => {
        if (item.labelKey) {
            return t(item.labelKey, language);
        }
        if (item.label) {
            return language === "ar" ? item.label.ar : item.label.en;
        }
        return "";
    };
    const resolveSectionTitle = (section) => {
        if (section.titleKey) {
            return t(section.titleKey, language);
        }
        if (section.title) {
            return language === "ar" ? section.title.ar : section.title.en;
        }
        return "";
    };
    return (<div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/50 px-4 lg:px-6 py-6">
        <div className="flex justify-center">
          <Logo className="h-16 w-auto lg:h-20"/>
        </div>
      </div>
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center">
          <Badge variant="destructive" className="text-xs font-semibold uppercase">
            Admin
          </Badge>
        </div>
      </div>
      <nav className="px-3 lg:px-4 space-y-4 pt-4 pb-4 flex-1 overflow-y-auto">
        {navigationSections.map((section, sectionIndex) => (<div key={section.id} className={sectionIndex === 0
                ? "space-y-1.5"
                : "space-y-1.5 pt-4 mt-4 border-t border-border/50"}>
            <button type="button" onClick={() => setOpenSectionId((prev) => (prev === section.id ? null : section.id))} className={`w-full flex items-center justify-between gap-2 px-3 lg:px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${sectionClasses[section.id] || "bg-muted text-muted-foreground border-border"}`} aria-expanded={openSectionId === section.id} aria-controls={`admin-section-${section.id}`}>
              <span className="truncate">{resolveSectionTitle(section)}</span>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${openSectionId === section.id ? "rotate-180" : ""}`}/>
            </button>
            <div id={`admin-section-${section.id}`} className="space-y-1.5 pt-2 pl-2" hidden={openSectionId !== section.id}>
              {section.items.map((item) => {
                const href = item.type === "tab" ? `/admin?tab=${item.key}` : item.href;
                const isActive = isActiveItem(item, pathname, isAdminRoot, currentTab);
                const Icon = item.icon;
                const label = resolveLabel(item);
                return (<Link key={item.type === "tab" ? item.key : item.href} href={href || "/admin"} className={`w-full flex items-center justify-start gap-3 px-3 lg:px-4 py-3 lg:py-3.5 rounded-lg transition-all duration-200 group ${isActive ? activeClasses : inactiveClasses}`}>
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "scale-110" : ""} transition-transform`}/>
                    <span className="font-medium text-sm lg:text-base truncate">{label}</span>
                    {item.type === "tab" && item.key === "reviews" && (pendingReviewsCount || 0) > 0 && (<Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {pendingReviewsCount}
                      </Badge>)}
                  </Link>);
            })}
            </div>
          </div>))}
      </nav>
    </div>);
}
