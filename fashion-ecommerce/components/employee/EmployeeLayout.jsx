"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Home, Languages, LogOut, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { useTheme } from "next-themes";

export function EmployeeLayout({ children, sidebar, title = "Employee Dashboard" }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleViewAsGuest = () => {
    if (typeof window !== "undefined") {
      window.open("/", "_blank");
    }
  };

  const handleBackToStore = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="lg:flex lg:min-h-screen">
        <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-64 lg:shrink-0 lg:border-r lg:border-border lg:bg-background">
          {sidebar}
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur lg:hidden">
            <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 pb-2 app-safe-top">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open employee navigation"
                  className="flex-shrink-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-base"
                  aria-label="Toggle theme"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <span aria-hidden="true">{theme === "dark" ? "" : ""}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Settings">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onSelect={() => setLanguage(language === "ar" ? "en" : "ar")}>
                      <Languages className="h-4 w-4" />
                      {language === "ar" ? "English" : "Arabic"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleViewAsGuest}>
                      <Eye className="h-4 w-4" />
                      {language === "ar" ? "عرض كضيف" : "View as Guest"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleBackToStore}>
                      <Home className="h-4 w-4" />
                      {language === "ar" ? "العودة للمتجر" : "Back to Store"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Logout" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="left">
        <DrawerContent className="p-0">
          <DrawerHeader className="border-b">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            {sidebar}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
