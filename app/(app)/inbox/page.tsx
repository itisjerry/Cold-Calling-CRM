"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import { Inbox as InboxIcon, MessageCircleQuestion, Bell, Send } from "lucide-react";
import { toast } from "sonner";

export default function InboxPage() {
  const currentUserId = useStore((s) => s.currentUserId);
  const updateRequests = useStore((s) => s.updateRequests);
  const notifications = useStore((s) => s.notifications);
  const users = useStore((s) => s.users);
  const leads = useStore((s) => s.leads);
  const reply = useStore((s) => s.replyUpdateRequest);

  const mine = updateRequests
    .filter((u) => u.agent_id === currentUserId)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  const pending = mine.filter((u) => u.status === "pending");
  const answered = mine.filter((u) => u.status !== "pending");

  const myNotifications = notifications
    .filter((n) => n.user_id === currentUserId)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 30);

  const [replies, setReplies] = React.useState<Record<string, string>>({});

  const submit = (id: string) => {
    const text = replies[id]?.trim();
    if (!text) return toast.error("Type a reply first");
    reply(id, text);
    setReplies((p) => ({ ...p, [id]: "" }));
    toast.success("Reply sent");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"><InboxIcon className="h-5 w-5 sm:h-6 sm:w-6" /> Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length} pending · {answered.length} answered · {myNotifications.filter((n) => !n.read_at).length} unread notifications
        </p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            <MessageCircleQuestion className="h-3.5 w-3.5 mr-1.5" /> Update requests {pending.length > 0 && <Badge className="ml-1.5 px-1.5 text-[10px]">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3">
          {pending.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base text-amber-600">Pending</CardTitle></CardHeader>
              <div className="px-4 pb-4 space-y-3">
                {pending.map((ur) => {
                  const requester = users.find((u) => u.id === ur.requester_id);
                  const lead = leads.find((l) => l.id === ur.lead_id);
                  return (
                    <div key={ur.id} className="rounded-md border p-3 space-y-2 bg-amber-50/40 dark:bg-amber-900/10">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{requester?.full_name ?? "Admin"}</span>
                        <span className="text-muted-foreground">asked {relativeTime(ur.created_at)}</span>
                        {lead && (
                          <Link href={`/leads/${lead.id}`} className="ml-auto text-primary hover:underline">
                            re: {lead.name}
                          </Link>
                        )}
                      </div>
                      <div className="text-sm">{ur.question}</div>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={replies[ur.id] ?? ""}
                          onChange={(e) => setReplies((p) => ({ ...p, [ur.id]: e.target.value }))}
                          rows={2}
                          placeholder="Type your update…"
                          className="text-sm flex-1"
                        />
                        <Button size="sm" onClick={() => submit(ur.id)} className="shrink-0">
                          <Send className="h-3.5 w-3.5 mr-1" /> Send
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {answered.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">History</CardTitle></CardHeader>
              <div className="px-4 pb-4 space-y-2">
                {answered.map((ur) => {
                  const requester = users.find((u) => u.id === ur.requester_id);
                  const lead = leads.find((l) => l.id === ur.lead_id);
                  return (
                    <div key={ur.id} className="rounded-md border p-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">{ur.status}</Badge>
                        <span className="font-medium">{requester?.full_name}</span>
                        {lead && <Link href={`/leads/${lead.id}`} className="text-primary hover:underline">re: {lead.name}</Link>}
                        <span className="ml-auto text-muted-foreground">{relativeTime(ur.answered_at ?? ur.created_at)}</span>
                      </div>
                      <div className="text-sm font-medium">{ur.question}</div>
                      {ur.reply && (
                        <div className="text-sm pl-3 border-l-2 border-emerald-500 italic text-muted-foreground">"{ur.reply}"</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {mine.length === 0 && (
            <Card>
              <div className="p-12 text-center text-muted-foreground">
                <MessageCircleQuestion className="h-10 w-10 mx-auto mb-2 opacity-30" />
                No update requests. You're all clear.
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <div className="divide-y">
              {myNotifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No notifications yet.</div>
              ) : (
                myNotifications.map((n) => (
                  <div key={n.id} className={cn("flex items-start gap-3 p-3", !n.read_at && "bg-primary/5")}>
                    <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", !n.read_at ? "bg-primary" : "bg-muted")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="uppercase tracking-wider">{n.kind.replace(/_/g, " ")}</span>
                        <span>·</span>
                        <span>{relativeTime(n.created_at)}</span>
                        {n.link && (
                          <Link href={n.link} className="ml-auto text-primary hover:underline">
                            Open
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
