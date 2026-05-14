"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Shield, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Header user menu. Shows the signed-in user's name + role and a single
 * "Sign out" action. (No impersonation — internal tool, real auth.)
 */
export function UserSwitcher() {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const localSignOut = useStore((s) => s.signOut);
  const current = users.find((u) => u.id === currentUserId);
  const [signingOut, setSigningOut] = React.useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      const { createSupabaseBrowserClient } = await import(
        "@/lib/supabase/client"
      );
      const supa = createSupabaseBrowserClient();
      await supa.auth.signOut();
    } catch {
      // swallow — we still want to clear local state and route to /login
    }
    localSignOut();
    router.replace("/login");
  };

  if (!current) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm hover:bg-accent transition-colors">
          <span
            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: current.avatar_color }}
          >
            {initials(current.full_name)}
          </span>
          <span className="hidden sm:flex flex-col text-left leading-tight">
            <span className="font-medium">{current.full_name}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {current.role}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          {current.role === "admin" ? (
            <Shield className="h-3 w-3" />
          ) : (
            <UserIcon className="h-3 w-3" />
          )}
          Signed in
        </DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <div className="text-sm font-medium truncate">{current.full_name}</div>
          <div className="text-[11px] text-muted-foreground truncate font-mono">
            {current.email}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSignOut}
          disabled={signingOut}
          className="gap-2 text-rose-600 focus:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
