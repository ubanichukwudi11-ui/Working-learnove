"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import { CardSkeleton, EmptyState, PageHeader } from "@/components/ui";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute roles={["STUDENT", "PARENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]}>
      <AppLayout>
        <NotificationsContent />
      </AppLayout>
    </ProtectedRoute>
  );
}

function NotificationsContent() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/lms/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/lms/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_ALL_READ" }),
    }).catch(() => {});
  };

  const markOneRead = async (notificationId: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/lms/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_READ", notificationId }),
    }).catch(() => {});
  };

  const filtered = filter === "unread" ? items.filter((n) => !n.isRead) : items;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        kicker="Notification Center"
        title="Alerts & Updates"
        description="Classroom schedule alerts, approvals, payment confirmations, and academic updates in one place."
        breadcrumbs={[{ label: "Notifications" }]}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition whitespace-nowrap"
            >
              <CheckCheck size={15} />
              Mark all read ({unreadCount})
            </button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "all"
                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "unread"
                ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <Link
          href="/profile?tab=notifications"
          className="text-xs font-bold text-[#4F46E5] dark:text-[#A5B4FC] hover:underline"
        >
          Notification Preferences →
        </Link>
      </div>

      {loading ? (
        <CardSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "All caught up!" : "No notifications yet"}
          description={
            filter === "unread"
              ? "You have read every notification in your workspace."
              : "Timetable updates, classroom alerts, and account notices will appear here."
          }
        />
      ) : (
        <div className="learnova-card divide-y divide-[var(--border)] overflow-hidden">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                !n.isRead ? "bg-[#4F46E5]/5 dark:bg-[#4F46E5]/10" : ""
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" />
                  )}
                  <h2 className="text-sm font-bold text-[var(--foreground)]">
                    {n.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                  {n.message}
                </p>
                <p className="text-[11px] text-[var(--foreground-subtle)] tabular-nums">
                  {new Date(n.createdAt).toLocaleString("en-NG", {
                    timeZone: "Africa/Lagos",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => markOneRead(n.id)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-lavender)] text-xs font-semibold text-[var(--foreground)] transition whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
                {n.href && n.href !== "#" && (
                  <Link
                    href={n.href}
                    onClick={() => {
                      if (!n.isRead) markOneRead(n.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-bold transition whitespace-nowrap"
                  >
                    Open
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
