"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, useIsSignedIn, useCurrentUser } from "@/lib/store";
import { initials } from "@/lib/utils";
import { toast } from "sonner";
import { playChime } from "@/lib/sound";
import { ArrowRight, Mail, Lock, Sparkles, Shield, User as UserIcon, Check } from "lucide-react";

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GREETINGS = [
  "Welcome back, closer.",
  "Ready to dial?",
  "Your queue is calling.",
  "Let's make it rain.",
  "Time to print revenue.",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [greeting] = React.useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const signedIn = useIsSignedIn();
  const currentUser = useCurrentUser();
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  // If a session already exists, skip the picker.
  React.useEffect(() => {
    if (hydrated && signedIn && currentUser) {
      router.replace(currentUser.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [hydrated, signedIn, currentUser, router]);

  if (hydrated && signedIn) return null;

  // Demo mode: show a dummy-user picker — anyone landing on the page chooses who to be.
  if (!HAS_SUPABASE) return <DemoLogin greeting={greeting} />;

  // Real auth path
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supa = createSupabaseBrowserClient();
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      playChime("success");
      toast.success("Welcome back ✨");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Hello again
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">{greeting}</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Sign in to pick up where you left off.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" required autoComplete="email" autoFocus value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" className="pl-9 h-11" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/login" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">Forgot?</Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11" />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : <>Sign in <ArrowRight className="h-4 w-4 ml-1.5" /></>}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        New here? <Link href="/signup" className="text-primary font-medium hover:underline">Make an account</Link>
      </div>
    </div>
  );
}

function DemoLogin({ greeting }: { greeting: string }) {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const signIn = useStore((s) => s.signIn);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const admins = users.filter((u) => u.role === "admin" && u.active);
  const agents = users.filter((u) => u.role === "agent" && u.active);

  const onPick = (userId: string, role: "admin" | "agent") => {
    setPendingId(userId);
    signIn(userId);
    playChime("success");
    const next = users.find((u) => u.id === userId);
    toast.success(`Welcome, ${next?.full_name?.split(" ")[0] ?? "friend"} 👋`, {
      description: role === "admin" ? "Heading to your command center." : "Loading your call queue.",
    });
    setTimeout(() => router.push(role === "admin" ? "/admin" : "/dashboard"), 350);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Demo workspace
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">{greeting}</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Pick a seat. Each user has their own leads, dashboard, and inbox.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Admin
            <span className="text-muted-foreground/50 font-normal normal-case">— monitoring & oversight</span>
          </div>
          <div className="space-y-2">
            {admins.map((u) => (
              <UserSeat key={u.id} user={u} role="admin" onPick={onPick} pending={pendingId === u.id} />
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserIcon className="h-3 w-3" /> Agents
            <span className="text-muted-foreground/50 font-normal normal-case">— calling, follow-ups, pipeline</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {agents.map((u) => (
              <UserSeat key={u.id} user={u} role="agent" onPick={onPick} pending={pendingId === u.id} compact />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">Tip:</span> you can hop between seats anytime from the user picker in the top-right.
        Try logging in as <b>Yahya</b> to see admin oversight, then switch to <b>Sara</b> to make a call.
      </div>
    </div>
  );
}

function UserSeat({
  user, role, onPick, pending, compact = false,
}: {
  user: { id: string; full_name: string; email: string; avatar_color: string };
  role: "admin" | "agent";
  onPick: (id: string, role: "admin" | "agent") => void;
  pending: boolean;
  compact?: boolean;
}) {
  return (
    <motion.button
      onClick={() => onPick(user.id, role)}
      whileTap={{ scale: 0.97 }}
      disabled={pending}
      className={[
        "group w-full flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40",
        "px-3 py-2.5 text-left transition-all duration-base ease-ios shadow-elevation-1 hover:shadow-elevation-3",
        pending ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
    >
      <span
        className="relative h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-elevation-2 shadow-inner-hl"
        style={{ background: user.avatar_color }}
      >
        {initials(user.full_name)}
        {pending && (
          <motion.span
            className="absolute -inset-0.5 rounded-full border-2 border-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{user.full_name}</div>
        {!compact && (
          <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
        )}
      </div>
      {pending ? (
        <Check className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      )}
    </motion.button>
  );
}
