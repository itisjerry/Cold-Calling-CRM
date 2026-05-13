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
import { ArrowRight, Mail, Lock, Sparkles, Shield, User as UserIcon } from "lucide-react";

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
            <button
              type="button"
              onClick={() => toast.info("Password recovery isn't wired up in this demo. Use the demo accounts below or ping support.")}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot?
            </button>
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
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  const admins = users.filter((u) => u.role === "admin" && u.active);
  const agents = users.filter((u) => u.role === "agent" && u.active);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const match = users.find(
      (u) => u.active && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    const ok = match && (match.password ?? "password") === password;
    if (!ok) {
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error("Invalid email or password");
      return;
    }
    signIn(match!.id);
    playChime("success");
    toast.success(`Welcome, ${match!.full_name.split(" ")[0]} 👋`, {
      description: match!.role === "admin" ? "Heading to your command center." : "Loading your call queue.",
    });
    setTimeout(() => router.push(match!.role === "admin" ? "/admin" : "/dashboard"), 350);
  };

  const fillFrom = (u: { email: string; password?: string }) => {
    setEmail(u.email);
    setPassword(u.password ?? "password");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Demo workspace
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">{greeting}</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Sign in with one of the demo accounts below.</p>
      </div>

      <motion.form
        onSubmit={onSubmit}
        className="space-y-4"
        animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <Label htmlFor="demo-email">Email</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="demo-email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@pixelarchitecture.co"
              className="pl-9 h-11"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="demo-password">Password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="demo-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="pl-9 h-11"
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : <>Sign in <ArrowRight className="h-4 w-4 ml-1.5" /></>}
        </Button>
      </motion.form>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Demo accounts</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">Click any row to autofill — password is <code className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">password</code> for everyone.</p>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> Admin
          </div>
          <div className="space-y-2">
            {admins.map((u) => (
              <UserSeat key={u.id} user={u} onFill={fillFrom} />
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserIcon className="h-3 w-3" /> Agents
          </div>
          <div className="space-y-2">
            {agents.map((u) => (
              <UserSeat key={u.id} user={u} onFill={fillFrom} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserSeat({
  user,
  onFill,
}: {
  user: { id: string; full_name: string; email: string; avatar_color: string; password?: string };
  onFill: (u: { email: string; password?: string }) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onFill(user)}
      whileTap={{ scale: 0.97 }}
      className={[
        "group w-full flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40",
        "px-3 py-2.5 text-left transition-all duration-base ease-ios shadow-elevation-1 hover:shadow-elevation-3",
      ].join(" ")}
    >
      <span
        className="relative h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-elevation-2 shadow-inner-hl"
        style={{ background: user.avatar_color }}
      >
        {initials(user.full_name)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{user.full_name}</div>
        <div className="text-[11px] text-muted-foreground truncate font-mono">{user.email}</div>
      </div>
      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors shrink-0">
        Click to fill
      </span>
    </motion.button>
  );
}
