"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Demo mode: auto-route to dashboard, no auth needed.
  React.useEffect(() => {
    if (!HAS_SUPABASE) router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supa = createSupabaseBrowserClient();
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  if (!HAS_SUPABASE) {
    return (
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold">Demo mode</h2>
        <p className="text-sm text-muted-foreground">No auth required. Loading the app…</p>
        <Button onClick={() => router.push("/dashboard")}>Open Helio →</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your Helio account.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        New to Helio? <Link href="/signup" className="text-primary hover:underline">Create an account</Link>
      </div>
    </div>
  );
}
