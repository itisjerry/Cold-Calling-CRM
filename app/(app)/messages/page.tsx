"use client";
import * as React from "react";
import Link from "next/link";
import { useStore, useCurrentUser, useIsAdmin } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, initials, relativeTime } from "@/lib/utils";
import { MessageSquare, Send, Tag, Search, X as XIcon, Briefcase, User as UserIcon, ArrowLeft } from "lucide-react";
import type { Message, User, Lead, Project } from "@/types";
import { Reveal } from "@/components/motion/reveal";

export default function MessagesPage() {
  const me = useCurrentUser();
  const isAdmin = useIsAdmin();
  const users = useStore((s) => s.users);
  const messages = useStore((s) => s.messages);
  const leads = useStore((s) => s.leads);
  const projects = useStore((s) => s.projects);
  const sendMessage = useStore((s) => s.sendMessage);
  const markThreadRead = useStore((s) => s.markThreadRead);

  // Conversation partners are the opposite role
  const partners = React.useMemo<User[]>(() => {
    if (!me) return [];
    return users.filter((u) => u.id !== me.id && (isAdmin ? u.role === "agent" : u.role === "admin") && u.active);
  }, [users, me, isAdmin]);

  const [activePartnerId, setActivePartnerId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  // Auto-select the first partner only on desktop so mobile lands on the inbox list.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop && !activePartnerId && partners[0]) setActivePartnerId(partners[0].id);
  }, [partners, activePartnerId]);

  const activePartner = partners.find((p) => p.id === activePartnerId);

  const thread = React.useMemo<Message[]>(() => {
    if (!me || !activePartnerId) return [];
    return messages
      .filter(
        (m) =>
          (m.from_user === me.id && m.to_user === activePartnerId) ||
          (m.from_user === activePartnerId && m.to_user === me.id),
      )
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  }, [messages, me, activePartnerId]);

  React.useEffect(() => {
    if (activePartnerId) markThreadRead(activePartnerId);
  }, [activePartnerId, markThreadRead, thread.length]);

  const filteredPartners = partners.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const unreadFor = (partnerId: string) => {
    if (!me) return 0;
    return messages.filter((m) => m.from_user === partnerId && m.to_user === me.id && !m.read_at).length;
  };

  const lastFor = (partnerId: string) => {
    if (!me) return null;
    const list = messages.filter(
      (m) =>
        (m.from_user === me.id && m.to_user === partnerId) ||
        (m.from_user === partnerId && m.to_user === me.id),
    );
    return list[0] ?? null;
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner-hl">
            <MessageSquare className="h-5 w-5" />
          </span>
          Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Direct chat with {isAdmin ? "your agents" : "your admin"}. Tag a lead or project to keep context.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-[70vh] md:min-h-[60vh]">
          {/* Threads — full width on mobile when no partner selected, hidden when one is active */}
          <aside
            className={cn(
              "border-r border-border/60 bg-muted/20 flex-col md:flex",
              activePartnerId ? "hidden md:flex" : "flex"
            )}
          >
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a teammate…" className="pl-9" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredPartners.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No teammates available.</p>
              ) : filteredPartners.map((p) => {
                const last = lastFor(p.id);
                const unread = unreadFor(p.id);
                const active = p.id === activePartnerId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePartnerId(p.id)}
                    className={cn(
                      "w-full text-left flex items-start gap-2.5 px-3 py-2.5 border-b border-border/40 transition-colors",
                      active ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-accent",
                    )}
                  >
                    <span
                      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 shadow-elevation-1 shadow-inner-hl"
                      style={{ background: p.avatar_color }}
                    >
                      {initials(p.full_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{p.full_name}</span>
                        {unread > 0 && (
                          <Badge className="bg-primary text-primary-foreground h-4 min-w-[16px] px-1 text-[10px] tabular-nums">{unread}</Badge>
                        )}
                      </div>
                      {last ? (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {last.from_user === me?.id ? "You: " : ""}
                          {last.body}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground/70 italic mt-0.5">No messages yet</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Active thread — hidden on mobile when no partner selected */}
          {activePartner ? (
            <div className={cn("flex flex-col min-w-0", "flex")}>
              <Thread
                me={me!}
                partner={activePartner}
                messages={thread}
                leads={leads}
                projects={projects}
                onBack={() => setActivePartnerId(null)}
                onSend={(body, lead_id, project_id) => {
                  if (!body.trim()) return;
                  sendMessage({ to_user: activePartner.id, body, lead_id, project_id });
                }}
              />
            </div>
          ) : (
            <div className="hidden md:flex items-center justify-center text-sm text-muted-foreground p-12">
              Pick a teammate to start chatting.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Thread({
  me, partner, messages, leads, projects, onSend, onBack,
}: {
  me: User;
  partner: User;
  messages: Message[];
  leads: Lead[];
  projects: Project[];
  onSend: (body: string, lead_id?: string | null, project_id?: string | null) => void;
  onBack?: () => void;
}) {
  const [body, setBody] = React.useState("");
  const [taggedLead, setTaggedLead] = React.useState<Lead | null>(null);
  const [taggedProject, setTaggedProject] = React.useState<Project | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Filter taggable items to partner's owned things (so admin can tag any of partner's leads/projects)
  const partnerLeads = React.useMemo(
    () => leads.filter((l) => l.owner_id === partner.id || l.owner_id === me.id),
    [leads, partner.id, me.id],
  );
  const partnerProjects = React.useMemo(
    () => projects.filter((p) => p.owner_id === partner.id || p.owner_id === me.id),
    [projects, partner.id, me.id],
  );

  const send = () => {
    if (!body.trim()) return;
    onSend(body, taggedLead?.id ?? null, taggedProject?.id ?? null);
    setBody("");
    setTaggedLead(null);
    setTaggedProject(null);
  };

  return (
    <section className="flex flex-col min-w-0 flex-1">
      <header className="flex items-center gap-3 p-3 border-b border-border/60 bg-card/40 backdrop-blur-sm">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden h-8 w-8 -ml-1"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <span
          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-elevation-1 shadow-inner-hl shrink-0"
          style={{ background: partner.avatar_color }}
        >
          {initials(partner.full_name)}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{partner.full_name}</div>
          <div className="text-xs text-muted-foreground capitalize">{partner.role}</div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            Start the conversation. Tag a lead or project for context. 👋
          </p>
        ) : messages.map((m) => {
          const mine = m.from_user === me.id;
          const lead = leads.find((l) => l.id === m.lead_id);
          const proj = projects.find((p) => p.id === m.project_id);
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-elevation-1",
                mine
                  ? "bg-gradient-to-b from-primary/95 to-primary text-primary-foreground rounded-br-md shadow-inner-hl"
                  : "bg-muted text-foreground rounded-bl-md"
              )}>
                {(lead || proj) && (
                  <div className={cn(
                    "flex items-center gap-1.5 mb-1.5 text-[11px] font-medium rounded-md px-2 py-1",
                    mine ? "bg-white/15" : "bg-background/60"
                  )}>
                    {lead && (
                      <Link href={`/leads/${lead.id}`} className="inline-flex items-center gap-1 hover:underline">
                        <UserIcon className="h-3 w-3" /> {lead.name}{lead.company ? ` · ${lead.company}` : ""}
                      </Link>
                    )}
                    {proj && (
                      <Link href={`/projects`} className="inline-flex items-center gap-1 hover:underline">
                        <Briefcase className="h-3 w-3" /> {proj.name}
                      </Link>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-snug">{m.body}</div>
                <div className={cn("text-[10px] mt-1 opacity-70", mine ? "text-white/70" : "text-muted-foreground")}>
                  {relativeTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/60 p-3 space-y-2">
        {(taggedLead || taggedProject) && (
          <div className="flex flex-wrap gap-1.5">
            {taggedLead && (
              <Badge className="gap-1 pl-1.5 pr-1">
                <UserIcon className="h-3 w-3" /> {taggedLead.name}
                <button onClick={() => setTaggedLead(null)} className="ml-1 hover:text-rose-500"><XIcon className="h-3 w-3" /></button>
              </Badge>
            )}
            {taggedProject && (
              <Badge className="gap-1 pl-1.5 pr-1">
                <Briefcase className="h-3 w-3" /> {taggedProject.name}
                <button onClick={() => setTaggedProject(null)} className="ml-1 hover:text-rose-500"><XIcon className="h-3 w-3" /></button>
              </Badge>
            )}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" title="Tag lead or project"><Tag className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
              <TagPicker
                leads={partnerLeads}
                projects={partnerProjects}
                onPickLead={setTaggedLead}
                onPickProject={setTaggedProject}
              />
            </PopoverContent>
          </Popover>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
            }}
            rows={1}
            placeholder={`Message ${partner.full_name.split(" ")[0]}…  (⌘↵ to send)`}
            className="resize-none min-h-[40px] max-h-[140px]"
          />
          <Button onClick={send} disabled={!body.trim()} size="icon" className="h-10 w-10 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function TagPicker({
  leads, projects, onPickLead, onPickProject,
}: {
  leads: Lead[];
  projects: Project[];
  onPickLead: (l: Lead) => void;
  onPickProject: (p: Project) => void;
}) {
  const [tab, setTab] = React.useState<"leads" | "projects">("leads");
  const [q, setQ] = React.useState("");
  const fLeads = leads.filter((l) =>
    [l.name, l.company].some((v) => v?.toLowerCase().includes(q.toLowerCase()))
  ).slice(0, 30);
  const fProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 30);
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button
          onClick={() => setTab("leads")}
          className={cn("flex-1 text-xs px-2 py-1 rounded transition-colors", tab === "leads" ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
        >Leads</button>
        <button
          onClick={() => setTab("projects")}
          className={cn("flex-1 text-xs px-2 py-1 rounded transition-colors", tab === "projects" ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
        >Projects</button>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-8 text-xs" />
      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {tab === "leads" && fLeads.map((l) => (
          <button key={l.id} onClick={() => onPickLead(l)} className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm flex items-center gap-1.5">
            <UserIcon className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{l.name}{l.company ? ` · ${l.company}` : ""}</span>
          </button>
        ))}
        {tab === "projects" && fProjects.map((p) => (
          <button key={p.id} onClick={() => onPickProject(p)} className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm flex items-center gap-1.5">
            <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
        {tab === "leads" && fLeads.length === 0 && <div className="text-xs text-muted-foreground p-2">No matching leads.</div>}
        {tab === "projects" && fProjects.length === 0 && <div className="text-xs text-muted-foreground p-2">No matching projects.</div>}
      </div>
    </div>
  );
}
