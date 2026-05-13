"use client";
import * as React from "react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import type { Notification, NotificationKind } from "@/types";

const KIND_COLORS: Record<NotificationKind, string> = {
  lead_assigned: "bg-indigo-500",
  task_assigned: "bg-amber-500",
  reminder: "bg-sky-500",
  update_request: "bg-rose-500",
  update_reply: "bg-emerald-500",
  system: "bg-zinc-400",
};

const KIND_LABEL: Record<NotificationKind, string> = {
  lead_assigned: "Lead",
  task_assigned: "Task",
  reminder: "Reminder",
  update_request: "Update",
  update_reply: "Reply",
  system: "System",
};

export function NotificationBell() {
  const currentUserId = useStore((s) => s.currentUserId);
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAllRead = useStore((s) => s.markAllNotificationsRead);
  const clearOne = useStore((s) => s.clearNotification);

  const mine = React.useMemo(
    () =>
      notifications
        .filter((n) => n.user_id === currentUserId)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 30),
    [notifications, currentUserId]
  );

  const unread = mine.filter((n) => !n.read_at).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={unread === 0}
            onClick={() => markAllRead(currentUserId)}
          >
            <Check className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {mine.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">You're all caught up.</div>
          ) : (
            mine.map((n) => <Row key={n.id} n={n} onRead={markRead} onClear={clearOne} />)
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Row({
  n,
  onRead,
  onClear,
}: {
  n: Notification;
  onRead: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const content = (
    <div className="flex items-start gap-2.5 p-3 hover:bg-accent">
      <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", KIND_COLORS[n.kind])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {KIND_LABEL[n.kind]}
          </span>
          <span className="text-[10px] text-muted-foreground">{relativeTime(n.created_at)}</span>
          {!n.read_at && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
        <div className="text-sm font-medium mt-0.5">{n.title}</div>
        {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClear(n.id);
        }}
        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition"
        aria-label="Clear notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (n.link) {
    return (
      <Link
        href={n.link}
        className="block group"
        onClick={() => onRead(n.id)}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      onClick={() => onRead(n.id)}
      className="w-full text-left group"
    >
      {content}
    </button>
  );
}
