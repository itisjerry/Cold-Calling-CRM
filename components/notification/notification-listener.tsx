"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { playChime } from "@/lib/sound";
import { Bell, MessageSquare, Inbox, AlertTriangle } from "lucide-react";

/**
 * Single mounted listener (in app + admin layouts).
 *
 * Responsibilities:
 *  1. When a NEW notification appears for the current user → top-right toast + chime + (optional) browser notification.
 *  2. When a NEW message arrives for the current user → message-style toast + brighter chime.
 *  3. Every 30 s, check reminders; if any are due (fires_at <= now, not done, not yet shown) → reminder toast + bell chime.
 *
 * No render output.
 */
export function NotificationListener() {
  const router = useRouter();
  const currentUserId = useStore((s) => s.currentUserId);
  const notifications = useStore((s) => s.notifications);
  const messages = useStore((s) => s.messages);
  const reminders = useStore((s) => s.reminders);
  const users = useStore((s) => s.users);

  // Track what we've already announced so we never re-pop.
  const announcedNotifsRef = React.useRef<Set<string>>(new Set());
  const announcedMsgsRef = React.useRef<Set<string>>(new Set());
  const announcedRemindersRef = React.useRef<Set<string>>(new Set());
  // First-load flag: don't pop everything that already exists when the page loads.
  const armedRef = React.useRef(false);

  // Browser notification permission
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Don't auto-prompt — let the user opt in via the bell or settings.
    }
  }, []);

  // Arm after a small delay so initial-load entries are seeded into the "seen" sets.
  React.useEffect(() => {
    const seedTimer = setTimeout(() => {
      notifications.forEach((n) => announcedNotifsRef.current.add(n.id));
      messages.forEach((m) => announcedMsgsRef.current.add(m.id));
      armedRef.current = true;
    }, 600);
    return () => clearTimeout(seedTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1) New notifications for me
  React.useEffect(() => {
    if (!armedRef.current) return;
    for (const n of notifications) {
      if (n.user_id !== currentUserId) continue;
      if (announcedNotifsRef.current.has(n.id)) continue;
      announcedNotifsRef.current.add(n.id);
      // Pick chime + icon by kind
      const Icon =
        n.kind === "reminder" ? Bell :
        n.kind === "update_request" || n.kind === "update_reply" ? Inbox :
        Bell;
      playChime(n.kind === "reminder" ? "reminder" : "notification");
      toast.message(n.title, {
        description: n.body ?? undefined,
        icon: <Icon className="h-4 w-4 text-primary" />,
        action: n.link
          ? { label: "Open", onClick: () => router.push(n.link!) }
          : undefined,
      });
      tryBrowserNotification(n.title, n.body ?? "");
    }
  }, [notifications, currentUserId, router]);

  // 2) New messages for me
  React.useEffect(() => {
    if (!armedRef.current) return;
    for (const m of messages) {
      if (m.to_user !== currentUserId) continue;
      if (announcedMsgsRef.current.has(m.id)) continue;
      announcedMsgsRef.current.add(m.id);
      const sender = users.find((u) => u.id === m.from_user);
      const senderName = sender?.full_name ?? "Someone";
      playChime("message");
      toast.message(`${senderName} messaged you`, {
        description: m.body.slice(0, 140),
        icon: <MessageSquare className="h-4 w-4 text-primary" />,
        action: { label: "Reply", onClick: () => router.push("/messages") },
      });
      tryBrowserNotification(`${senderName}: new message`, m.body.slice(0, 140));
    }
  }, [messages, currentUserId, router, users]);

  // 3) Reminders due — poll every 30s
  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      for (const r of reminders) {
        if (r.user_id !== currentUserId) continue;
        if (r.done) continue;
        if (announcedRemindersRef.current.has(r.id)) continue;
        if (new Date(r.fires_at) <= now) {
          announcedRemindersRef.current.add(r.id);
          playChime("reminder");
          toast.warning("⏰ Reminder", {
            description: r.message,
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            duration: 10000,
            action: { label: "Open", onClick: () => router.push("/reminders") },
          });
          tryBrowserNotification("Reminder", r.message);
        }
      }
    };
    // Run once after arm + then every 30s
    const arm = setTimeout(tick, 1500);
    const interval = setInterval(tick, 30000);
    return () => { clearTimeout(arm); clearInterval(interval); };
  }, [reminders, currentUserId, router]);

  return null;
}

function tryBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  // Avoid native notifications if the document is currently visible — toast is enough.
  if (document.visibilityState === "visible") return;
  try {
    new Notification(title, { body, icon: "/favicon.svg", silent: false });
  } catch { /* noop */ }
}
