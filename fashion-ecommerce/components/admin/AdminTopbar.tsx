"use client"

import { useRouter } from "next/navigation"
import { Eye, Home, Languages, LogOut, Moon, Settings, Sun } from "lucide-react"
import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import { useTheme } from "next-themes"
import { useLanguage } from "@/lib/language"
import { t } from "@/lib/i18n"

export function AdminTopbar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const router = useRouter()

  const handleViewAsGuest = () => {
    if (typeof window !== "undefined") {
      window.open("/", "_blank")
    }
  }

  const handleBackToStore = () => {
    router.push("/")
  }

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleToggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar")
  }

  return (
    <div className="flex h-16 items-center justify-end gap-3 px-4 lg:px-6">
      <Badge variant="destructive" className="hidden sm:inline-flex text-xs font-semibold">
        ADMIN
      </Badge>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">
          {user ? `${user.firstName} ${user.lastName}` : "Admin"}
        </p>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Logo className="h-4 w-auto" />
          <span className="max-w-[180px] truncate">{user?.email || "admin@fashionhub.com"}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border/60"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleToggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? t("lightMode", language) : t("darkMode", language)}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleToggleLanguage}>
                <Languages className="h-4 w-4" />
                {language === "ar" ? "English" : "Arabic"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleViewAsGuest}>
                <Eye className="h-4 w-4" />
                View as Guest
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleBackToStore}>
                <Home className="h-4 w-4" />
                Back to Store
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={logout}>
                <LogOut className="h-4 w-4" />
                {t("logout", language)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
