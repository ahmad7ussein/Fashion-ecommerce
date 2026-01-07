"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { StaffChatPanel } from "@/components/staff-chat-panel";
import { Button } from "@/components/ui/button";

export function StaffChatWidget({ mode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return null;
  }

  const resolvedMode = mode || user.role;
  if (resolvedMode === "admin" && user.role !== "admin") {
    return null;
  }
  if (resolvedMode === "employee" && user.role !== "employee") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[380px] max-w-[92vw] max-h-[80vh] rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold">Staff Chat</div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 max-h-[72vh] overflow-y-auto">
            <StaffChatPanel
              mode={resolvedMode}
              compact
              showThreads={resolvedMode === "admin"}
            />
          </div>
        </div>
      )}
      <Button
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open staff chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    </div>
  );
}
