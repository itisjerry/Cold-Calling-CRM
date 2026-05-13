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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!HAS_SUPABASE) router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supa = createSupabaseBrowserClient();
      const { error } = await supa.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      toast.success("Account created — check your email to confirm");
      router.push("/login");
    } catch (e: any) {
      toast.error(e?.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  if (!HAS_SUPABASE) {
    return (
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold">Demo mode</h2>
        <p className="text-sm text-muted-foreground">No signup needed. Loading the app…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">Start closing more deals today.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div><Label htmlFor="name">Full name</Label><Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" /></div>
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
        <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="mt-1.5" /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account…" : "Create account"}</Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </div>
    </div>
  );
}
