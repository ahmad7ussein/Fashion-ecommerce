"use client"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"

export default function AdminModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/30">
          <AdminSidebar />
        </aside>
        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
            <AdminTopbar />
          </div>
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
