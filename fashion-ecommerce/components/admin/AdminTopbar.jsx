"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Home, Languages, LogOut, Moon, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
import { useTheme } from "next-themes";
export function AdminTopbar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const currentTab = searchParams.get("tab") || "overview";
    const isAdminRoot = pathname === "/admin";
    const adminEmail = user?.email || "admin@fashionhub.com";
    const topbarTabs = [
        { key: "overview", labelKey: "overview" },
        { key: "analytics", labelKey: "analytics" },
        { key: "reports", labelKey: "reports" },
    ];
    const activeTabClasses = "bg-blue-800 text-white border border-blue-900 dark:bg-blue-900 dark:text-white dark:border-blue-950";
    const inactiveTabClasses = "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent";
    const handleViewAsGuest = () => {
        if (typeof window !== "undefined") {
            window.open("/", "_blank");
        }
    };
    const handleBackToStore = () => {
        router.push("/");
    };
    const handleToggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };
    const handleToggleLanguage = () => {
        setLanguage(language === "ar" ? "en" : "ar");
    };
    const handleOpenSettings = () => {
        router.push("/admin?tab=settings");
    };
    return (<div className="flex h-16 items-center gap-4 px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-foreground shadow-sm">
            Admin FashionHub
          </span>
        </div>
        <nav className="flex items-center gap-2 overflow-x-auto" aria-label="Admin sections">
          {topbarTabs.map((tab) => {
            const isActive = isAdminRoot && currentTab === tab.key;
            return (<Link key={tab.key} href={`/admin?tab=${tab.key}`} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? activeTabClasses : inactiveTabClasses}`}>
                {t(tab.labelKey, language)}
              </Link>);
        })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 border-border/60" aria-label="Settings">
              <Settings className="h-4 w-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleOpenSettings}>
              <Settings className="h-4 w-4"/>
              {t("settings", language)}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
              {theme === "dark" ? t("lightMode", language) : t("darkMode", language)}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggleLanguage}>
              <Languages className="h-4 w-4"/>
              {language === "ar" ? "English" : "Arabic"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleViewAsGuest}>
              <Eye className="h-4 w-4"/>
              View as Guest
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleBackToStore}>
              <Home className="h-4 w-4"/>
              Back to Store
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={logout}>
              <LogOut className="h-4 w-4"/>
              {t("logout", language)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="destructive" size="sm" className="h-8 px-3" onClick={logout}>
          <LogOut className="h-4 w-4"/>
          <span className="text-sm font-semibold">{t("logout", language)}</span>
          <span className="inline-flex items-center rounded-full border border-white/40 bg-white/90 px-2 py-0.5 text-xs font-semibold text-destructive max-w-[160px] truncate sm:max-w-[220px]" title={adminEmail}>
            {adminEmail}
          </span>
        </Button>
      </div>
    </div>);
}
