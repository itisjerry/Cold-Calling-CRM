"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { playChime } from "@/lib/sound";
import { ArrowRight, Mail, Lock, Sparkles } from "lucide-react";

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
  const [greeting] = React.useState(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
  );

  const users = useStore((s) => s.users);
  const signIn = useStore((s) => s.signIn);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supa = createSupabaseBrowserClient();

      const { data: authData, error } = await supa.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!authData.user) throw new Error("No user returned from auth");

      // Pull role from profiles so we know where to route.
      const { data: profile } = await supa
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", authData.user.id)
        .single();

      const isAdmin = profile?.role === "admin";

      // Map this Supabase user onto a local-store seat so the UI shell
      // (avatar, name, role-aware widgets) has something to render.
      const normalizedEmail = (profile?.email ?? authData.user.email ?? "")
        .trim()
        .toLowerCase();
      const matched =
        users.find((u) => u.email.toLowerCase() === normalizedEmail) ??
        users.find((u) => (isAdmin ? u.role === "admin" : u.role === "agent"));

      if (matched) signIn(matched.id);

      playChime("success");
      const firstName = (profile?.full_name ?? authData.user.email ?? "there")
        .split(" ")[0];
      toast.success(`Welcome, ${firstName} ✨`, {
        description: isAdmin ? "Heading to command center." : "Loading your queue.",
      });

      router.replace(isAdmin ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Sign-in failed");
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
        <p className="text-sm text-muted-foreground mt-1.5">
          Sign in to pick up where you left off.
        </p>
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
              placeholder="you@helio.crm"
              className="pl-9 h-11"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
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
              disabled={loading}
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : <>Sign in <ArrowRight className="h-4 w-4 ml-1.5" /></>}
        </Button>
      </form>

      <p className="text-center text-[11px] text-muted-foreground/80">
        Internal tool. Accounts are provisioned by an admin.
      </p>
    </div>
  );
}
