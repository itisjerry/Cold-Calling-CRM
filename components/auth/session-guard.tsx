"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useIsSignedIn } from "@/lib/store";

/**
 * Wraps the authenticated app shell. If the persisted store says no one is
 * signed in, kick to /login. We wait for client-side hydration so we don't
 * bounce a refreshing user with an existing session.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => setHydrated(true), []);

  React.useEffect(() => {
    if (hydrated && !signedIn) {
      router.replace("/login");
    }
  }, [hydrated, signedIn, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-xs text-muted-foreground animate-pulse-soft">Loading…</div>
      </div>
    );
  }

  if (!signedIn) return null;

  return <>{children}</>;
}
