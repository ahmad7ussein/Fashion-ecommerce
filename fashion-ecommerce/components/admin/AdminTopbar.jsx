"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Eye, Home, Languages, LogOut, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { t } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { getNotifications, markAllAsRead } from "@/lib/api/notifications";
import { staffChatApi } from "@/lib/api/staffChat";
export function AdminTopbar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
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
    return (<div className="flex min-h-16 flex-wrap items-center gap-3 px-4 pb-2 app-safe-top lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="sr-only">{adminEmail}</span>
        <nav className="hidden items-center gap-2 overflow-x-auto md:flex" aria-label="Admin sections">
          {topbarTabs.map((tab) => {
            const isActive = isAdminRoot && currentTab === tab.key;
            return (<Link key={tab.key} href={`/admin?tab=${tab.key}`} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? activeTabClasses : inactiveTabClasses}`}>
                {t(tab.labelKey, language)}
              </Link>);
        })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-8 w-8 border-border/60" aria-label="Notifications">
              <Bell className="h-4 w-4"/>
              {unreadNotifications > 0 && (<span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (<div className="px-3 py-4 text-sm text-muted-foreground">
                No notifications yet.
              </div>) : (notifications.map((notification) => (<div key={notification._id} className="px-3 py-3 text-sm">
                <div className="font-medium">{notification.title || "Notification"}</div>
                <div className="text-muted-foreground">{notification.message}</div>
              </div>)))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={async () => {
            await markAllAsRead();
            setUnreadNotifications(0);
        }}>
              Mark all as read
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" className="relative h-8 w-8 border-border/60" aria-label="Staff chat" onClick={() => router.push("/admin/staff-chat")}>
          <MessageSquare className="h-4 w-4"/>
          {unreadMessages > 0 && (<span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
            {unreadMessages > 99 ? "99+" : unreadMessages}
          </span>)}
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border/60 text-base" aria-label="Toggle theme" onClick={handleToggleTheme}>
          <span aria-hidden="true">{theme === "dark" ? "" : ""}</span>
        </Button>
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
        <Button variant="default" size="sm" className="h-8 px-2 sm:px-3 bg-blue-500 text-white hover:bg-blue-600" onClick={logout}>
          <LogOut className="h-4 w-4"/>
          <span className="hidden text-sm font-semibold sm:inline">{t("logout", language)}</span>
        </Button>
      </div>
    </div>);
}
