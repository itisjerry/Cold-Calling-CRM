"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleQuestion, ChevronDown, ChevronUp, Send } from "lucide-react";
import { toast } from "sonner";
import { relativeTime } from "@/lib/utils";

export function UpdateRequestBanner() {
  const currentUserId = useStore((s) => s.currentUserId);
  const updateRequests = useStore((s) => s.updateRequests);
  const leads = useStore((s) => s.leads);
  const users = useStore((s) => s.users);
  const reply = useStore((s) => s.replyUpdateRequest);

  const pending = updateRequests
    .filter((u) => u.agent_id === currentUserId && u.status === "pending")
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  const [expanded, setExpanded] = React.useState(true);
  const [replies, setReplies] = React.useState<Record<string, string>>({});

  if (pending.length === 0) return null;

  const submit = (id: string) => {
    const text = replies[id]?.trim();
    if (!text) {
      toast.error("Type a reply first");
      return;
    }
    reply(id, text);
    setReplies((p) => ({ ...p, [id]: "" }));
    toast.success("Reply sent");
  };

  return (
    <div className="border-b bg-amber-50/60 dark:bg-amber-900/10">
      <div className="px-4 lg:px-6 py-2 max-w-[1600px] mx-auto">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-2 text-sm py-1"
        >
          <MessageCircleQuestion className="h-4 w-4 text-amber-600" />
          <span className="font-medium">
            {pending.length} update {pending.length === 1 ? "request" : "requests"} waiting on you
          </span>
          {expanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
        </button>

        {expanded && (
          <div className="space-y-2 py-2">
            {pending.map((ur) => {
              const requester = users.find((u) => u.id === ur.requester_id);
              const lead = leads.find((l) => l.id === ur.lead_id);
              return (
                <div key={ur.id} className="rounded-md bg-background border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{requester?.full_name ?? "Admin"} asks:</span>
                    <span className="text-muted-foreground">{relativeTime(ur.created_at)}</span>
                    {lead && (
                      <Link href={`/leads/${lead.id}`} className="ml-auto text-primary hover:underline">
                        about {lead.name}
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
        )}
      </div>
    </div>
  );
}
