"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, Sparkles } from "lucide-react";

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

  React.useEffect(() => {
    if (!HAS_SUPABASE) {
      // demo mode — give a beat to admire the layout, then in
      const t = setTimeout(() => router.replace("/dashboard"), 1200);
      return () => clearTimeout(t);
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supa = createSupabaseBrowserClient();
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back ✨");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  if (!HAS_SUPABASE) {
    return (
      <div className="text-center space-y-5 py-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-indigo-500 to-cold text-white shadow-elevation-3 shadow-inner-hl mx-auto"
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Demo mode</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            No password to remember. Loading your workspace…
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard")} size="lg" className="w-full">
          Open Helio <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
          Auto-redirecting in a moment…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          {greeting.includes("?") ? "Hello there" : "Hello again"}
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">{greeting}</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Sign in to pick up where you left off.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
              className="pl-9 h-11"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/login" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : <>Sign in <ArrowRight className="h-4 w-4 ml-1.5" /></>}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Make an account
        </Link>
      </div>
    </div>
  );
}
