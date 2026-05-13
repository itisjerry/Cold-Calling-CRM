"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, User, Sparkles } from "lucide-react";

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!HAS_SUPABASE) {
      // No real signup in demo mode — bounce to the picker after a beat.
      const t = setTimeout(() => router.replace("/login"), 1500);
      return () => clearTimeout(t);
    }
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
      toast.success("Account created — check your email to confirm ✨");
      router.push("/login");
    } catch (e: any) {
      toast.error(e?.message || "Sign-up failed");
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
            No signup needed — pick a seat at the door instead.
          </p>
        </div>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
          Take me to the picker <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Welcome
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Let's get you set up.</h2>
        <p className="text-sm text-muted-foreground mt-1.5">Takes 30 seconds. No credit card.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="name" required autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9 h-11" placeholder="Sara Iqbal" />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" placeholder="you@agency.com" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11" placeholder="At least 8 characters" />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : <>Create account <ArrowRight className="h-4 w-4 ml-1.5" /></>}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </div>
    </div>
  );
}
