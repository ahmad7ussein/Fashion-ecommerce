"use client"

import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <div className="flex">
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/30">
          <AdminSidebar />
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
