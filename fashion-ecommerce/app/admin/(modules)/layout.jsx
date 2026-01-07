"use client";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { StaffChatWidget } from "@/components/staff-chat-widget";
export default function AdminModulesLayout({ children }) {
    return (<div className="min-h-screen bg-background" dir="ltr">
      <div className="flex min-h-screen">
        <aside className="w-64 h-screen sticky top-0 shrink-0 border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/30">
          <Suspense fallback={<div className="h-full" />}>
            <AdminSidebar />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
            <Suspense fallback={<div className="h-16" />}>
              <AdminTopbar />
            </Suspense>
          </div>
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
      <StaffChatWidget mode="admin" />
    </div>);
}
