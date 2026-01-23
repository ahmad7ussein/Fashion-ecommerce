"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { staffChatApi } from "@/lib/api/staffChat";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const SOCKET_URL = API_BASE_URL().replace(/\/api\/?$/, "");

const getDisplayName = (user) => {
  if (!user) {
    return "Unknown";
  }
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Unknown";
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return date.toLocaleString();
};

const normalizeId = (value) => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return typeof value.toString === "function" ? value.toString() : "";
};

export function StaffChatPanel({ mode, compact = false, showThreads = true }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const selectedThreadRef = useRef(null);
  const threadsRef = useRef([]);
  const modeRef = useRef({ isAdminMode: false, isCounterpartMode: false });
  const bottomRef = useRef(null);

  const resolvedMode = mode || user?.role;
  const isAdminMode = resolvedMode === "admin";
  const isCounterpartMode =
    resolvedMode === "employee" ||
    resolvedMode === "partner";

  useEffect(() => {
    modeRef.current = { isAdminMode, isCounterpartMode };
  }, [isAdminMode, isCounterpartMode]);

  const selectedThread = useMemo(() => {
    if (!threads.length) {
      return null;
    }
    return threads.find((thread) => thread.id === selectedThreadId) || threads[0];
  }, [threads, selectedThreadId]);

  const threadsVisible = showThreads;
  const layoutCompact = compact || !threadsVisible;
  const threadListHeight = layoutCompact ? "h-[180px]" : "h-[420px]";
  const messageListHeight = layoutCompact
    ? threadsVisible
      ? "h-[240px]"
      : "h-[360px]"
    : "h-[420px]";

  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const loadThreads = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoadingThreads(true);
      }
      const data = await staffChatApi.getThreads();
      const nextThreads = Array.isArray(data) ? data : [];
      setThreads(nextThreads);
      if (nextThreads.length > 0) {
        setSelectedThreadId((prev) => {
          if (!prev || !nextThreads.find((thread) => thread.id === prev)) {
            return nextThreads[0].id;
          }
          return prev;
        });
      } else {
        setSelectedThreadId(null);
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error",
          description: error.message || "Failed to load staff chats",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) {
        setLoadingThreads(false);
      }
    }
  }, [toast]);

  const loadMessages = useCallback(async (thread, silent = false) => {
    if (!thread) {
      setMessages([]);
      return;
    }
    try {
      if (!silent) {
        setLoadingMessages(true);
      }
      const params = {};
      if (isAdminMode) {
        params.employeeId = thread.employee?._id;
      } else if (isCounterpartMode) {
        params.adminId = thread.admin?._id;
      }
      const data = await staffChatApi.getMessages(params);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error",
          description: error.message || "Failed to load messages",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  }, [isAdminMode, isCounterpartMode, toast]);

  const handleIncomingMessage = useCallback((message) => {
    const { isAdminMode: adminMode } = modeRef.current;
    const adminId = normalizeId(message.admin);
    const employeeId = normalizeId(message.employee);
    const threadId = adminMode ? employeeId : adminId;
    if (!threadId) {
      return;
    }
    const activeThreadId = selectedThreadRef.current?.id;
    const isActive = activeThreadId === threadId;
    const isFromOther = adminMode
      ? message.senderRole !== "admin"
      : message.senderRole === "admin";

    if (isActive) {
      setMessages((prev) => {
        if (prev.some((item) => item._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });

      if (isFromOther && socketRef.current) {
        socketRef.current.emit("staff-chat:mark-read", {
          adminId,
          employeeId,
        });
      }
    }

    setThreads((prev) => {
      if (!prev.length) {
        return prev;
      }
      return prev.map((thread) => {
        if (thread.id !== threadId) {
          if (isFromOther && !isActive) {
            return {
              ...thread,
              lastMessage: {
                message: message.message,
                createdAt: message.createdAt,
                senderRole: message.senderRole,
              },
              unreadCount: (thread.unreadCount || 0) + 1,
            };
          }
          return thread;
        }
        return {
          ...thread,
          lastMessage: {
            message: message.message,
            createdAt: message.createdAt,
            senderRole: message.senderRole,
          },
          unreadCount: isActive ? 0 : thread.unreadCount || 0,
        };
      });
    });

    if (!threadsRef.current.find((thread) => thread.id === threadId)) {
      loadThreads(true);
    }
  }, [loadThreads]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!user || (!isAdminMode && !isCounterpartMode)) {
      return;
    }
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return;
    }
    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });
    socketRef.current = socket;

    const handleConnect = () => {
      const thread = selectedThreadRef.current;
      if (!thread) {
        return;
      }
      const { isAdminMode: adminMode } = modeRef.current;
      const payload = adminMode
        ? { employeeId: thread.employee?._id }
        : { adminId: thread.admin?._id };
      socket.emit("staff-chat:join", payload);
    };

    const handleConnectError = (error) => {
      console.warn("Socket connection error:", error?.message || error);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("staff-chat:message", handleIncomingMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("staff-chat:message", handleIncomingMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, isAdminMode, isCounterpartMode, handleIncomingMessage]);

  useEffect(() => {
    if (!user) {
      return;
    }
    loadThreads();
  }, [user, loadThreads]);

  const selectedThreadIdValue = selectedThread?.id || null;

  useEffect(() => {
    if (!selectedThreadIdValue) {
      return;
    }
    const activeThread = selectedThreadRef.current;
    if (!activeThread || activeThread.id !== selectedThreadIdValue) {
      return;
    }
    loadMessages(activeThread);
    setThreads((prev) => {
      let hasChanges = false;
      const next = prev.map((thread) => {
        if (thread.id !== selectedThreadIdValue) {
          return thread;
        }
        if (!thread.unreadCount) {
          return thread;
        }
        hasChanges = true;
        return { ...thread, unreadCount: 0 };
      });
      return hasChanges ? next : prev;
    });
    if (socketRef.current) {
      const payload = isAdminMode
        ? { employeeId: activeThread.employee?._id }
        : { adminId: activeThread.admin?._id };
      socketRef.current.emit("staff-chat:join", payload);
    }
  }, [selectedThreadIdValue, loadMessages, isAdminMode, isCounterpartMode]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const messageText = draft.trim();
    if (!messageText || !selectedThread) {
      return;
    }
    setSending(true);
    const payload = { message: messageText };
    if (isAdminMode) {
      payload.employeeId = selectedThread.employee?._id;
    } else if (isCounterpartMode) {
      payload.adminId = selectedThread.admin?._id;
    }

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit("staff-chat:send", payload, (response) => {
        if (response?.error) {
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
        } else {
          setDraft("");
        }
        setSending(false);
      });
      return;
    }

    try {
      const created = await staffChatApi.sendMessage(payload);
      setDraft("");
      setMessages((prev) => [...prev, created]);
      loadThreads(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (<div className="text-muted-foreground">Loading...</div>);
  }

  if ((!isAdminMode && !isCounterpartMode) ||
      (isAdminMode && user.role !== "admin") ||
      (resolvedMode === "employee" && user.role !== "employee")) {
    return (<div className="text-muted-foreground">Access restricted.</div>);
  }

  return (
    <div className={layoutCompact ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
      {threadsVisible && (
        <Card className={layoutCompact ? "" : "lg:col-span-1"}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <Button variant="outline" size="sm" onClick={() => loadThreads()}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loadingThreads ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading chats...
              </div>
            ) : threads.length === 0 ? (
              <div className="text-sm text-muted-foreground">No staff chats yet.</div>
            ) : (
              <ScrollArea className={`${threadListHeight} pr-2`}>
                <div className="space-y-2">
                  {threads.map((thread) => {
                    const contact = isAdminMode ? thread.employee : thread.admin;
                    const isActive = thread.id === selectedThread?.id;
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{getDisplayName(contact)}</p>
                            <p className="text-xs text-muted-foreground truncate">{contact?.email || "—"}</p>
                          </div>
                          {thread.unreadCount > 0 && (
                            <Badge variant="destructive" className="shrink-0">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {thread.lastMessage && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                            {thread.lastMessage.message}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      <Card className={threadsVisible ? "lg:col-span-2" : ""}>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedThread
              ? `Chat with ${getDisplayName(isAdminMode ? selectedThread.employee : selectedThread.admin)}`
              : "Chat"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingMessages ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading messages...
            </div>
          ) : (
            <ScrollArea className={`${messageListHeight} pr-2`}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No messages yet.</div>
                ) : (
                  messages.map((message) => {
                    const isMine = isAdminMode
                      ? message.senderRole === "admin"
                      : message.senderRole === resolvedMode;
                    return (
                      <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                          <div className="text-xs opacity-70">
                            {message.sender?.firstName || (isMine ? "You" : "Staff")}
                          </div>
                          <div className="whitespace-pre-wrap">{message.message}</div>
                          <div className="text-[10px] opacity-60 mt-1">{formatTime(message.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          )}

          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message..."
              rows={3}
              disabled={!selectedThread || sending}
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={!draft.trim() || sending || !selectedThread}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
