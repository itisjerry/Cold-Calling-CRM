"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/**
 * Wraps the authenticated app shell. Source of truth for "is the user logged in"
 * is the Supabase session (HTTP-only cookie). On mount we ask Supabase for the
 * current session — if there isn't one, kick to /login.
 *
 * As a side effect we also hydrate the local-store identity (currentUserId +
 * signedIn flag) from the Supabase profile, so the rest of the app shell —
 * which still drives its UI from the local store — has something to render
 * even after a hard refresh.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const signIn = useStore((s) => s.signIn);
  const currentUserId = useStore((s) => s.currentUserId);
  const signedIn = useStore((s) => s.signedIn);
  const [status, setStatus] = React.useState<"checking" | "ok" | "denied">(
    "checking",
  );

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase/client"
        );
        const supa = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supa.auth.getSession();

        if (cancelled) return;
        if (!session) {
          setStatus("denied");
          router.replace("/login");
          return;
        }

        // Hydrate local store if it doesn't match (page refresh, new tab, etc).
        if (!signedIn || !currentUserId) {
          const { data: profile } = await supa
            .from("profiles")
            .select("role, email")
            .eq("id", session.user.id)
            .single();

          const normalizedEmail = (profile?.email ?? session.user.email ?? "")
            .toLowerCase();
          const matched =
            users.find((u) => u.email.toLowerCase() === normalizedEmail) ??
            users.find((u) =>
              profile?.role === "admin" ? u.role === "admin" : u.role === "agent",
            );
          if (matched) signIn(matched.id);
        }

        setStatus("ok");
      } catch {
        if (!cancelled) {
          setStatus("denied");
          router.replace("/login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-xs text-muted-foreground animate-pulse-soft">
          Loading…
        </div>
      </div>
    );
  }
  if (status === "denied") return null;
  return <>{children}</>;
}
