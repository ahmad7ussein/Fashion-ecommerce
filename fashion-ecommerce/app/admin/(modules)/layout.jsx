"use client";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StaffChatWidget } from "@/components/staff-chat-widget";
export default function AdminModulesLayout({ children }) {
    return (<div dir="ltr">
      <AdminLayout>
        <Suspense fallback={<div className="h-16" />}>
          {children}
        </Suspense>
      </AdminLayout>
      <StaffChatWidget mode="admin" />
    </div>);
}
