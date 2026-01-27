"use client";

import { Suspense, useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export function AdminLayout({ children, activeTab, pendingReviewsCount = 0, pendingAccountDeletionCount = 0 }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="lg:flex lg:min-h-screen">
        <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-64 lg:shrink-0 lg:border-r lg:border-border/50 lg:bg-gradient-to-b lg:from-background lg:via-background lg:to-muted/30">
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading navigation...</div>}>
            <AdminSidebar activeTab={activeTab} pendingReviewsCount={pendingReviewsCount} pendingAccountDeletionCount={pendingAccountDeletionCount} />
          </Suspense>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
            <div className="flex items-center gap-3 px-3 py-2 lg:px-0">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin navigation"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <Suspense fallback={<div className="h-8 w-full" />}>
                  <AdminTopbar />
                </Suspense>
              </div>
            </div>
          </div>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="left">
        <DrawerContent className="p-0">
          <DrawerHeader className="border-b">
            <DrawerTitle>Admin Menu</DrawerTitle>
          </DrawerHeader>
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading navigation...</div>}>
              <AdminSidebar activeTab={activeTab} pendingReviewsCount={pendingReviewsCount} pendingAccountDeletionCount={pendingAccountDeletionCount} />
            </Suspense>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
