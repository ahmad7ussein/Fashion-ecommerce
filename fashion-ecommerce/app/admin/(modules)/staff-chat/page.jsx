"use client";

import { StaffChatPanel } from "@/components/staff-chat-panel";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StaffChatPage() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return <div className="p-6">Access restricted.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chat with employees. Employees cannot message each other.
          </p>
        </CardContent>
      </Card>
      <StaffChatPanel mode="admin" />
    </div>
  );
}
