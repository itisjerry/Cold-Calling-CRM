"use client";
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Shield, User as UserIcon, Check, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { cn, initials } from "@/lib/utils";

export function UserSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const signOut = useStore((s) => s.signOut);
  const current = users.find((u) => u.id === currentUserId);

  const admins = users.filter((u) => u.role === "admin");
  const agents = users.filter((u) => u.role === "agent");

  const onPick = (id: string) => {
    setCurrentUser(id);
    const next = users.find((u) => u.id === id);
    // route appropriately if switching role tier
    if (next?.role === "admin" && !pathname?.startsWith("/admin")) {
      router.push("/admin");
    }
    if (next?.role === "agent" && pathname?.startsWith("/admin")) {
      router.push("/dashboard");
    }
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
          <Shield className="h-3 w-3" /> Admins
        </DropdownMenuLabel>
        {admins.map((u) => (
          <DropdownMenuItem key={u.id} onClick={() => onPick(u.id)} className="gap-2">
            <span
              className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: u.avatar_color }}
            >
              {initials(u.full_name)}
            </span>
            <span className="flex-1 truncate">{u.full_name}</span>
            {u.id === currentUserId && <Check className="h-3 w-3" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserIcon className="h-3 w-3" /> Agents
        </DropdownMenuLabel>
        {agents.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => onPick(u.id)}
            className={cn("gap-2", !u.active && "opacity-50")}
          >
            <span
              className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: u.avatar_color }}
            >
              {initials(u.full_name)}
            </span>
            <span className="flex-1 truncate">{u.full_name}</span>
            {u.id === currentUserId && <Check className="h-3 w-3" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { signOut(); router.replace("/login"); }}
          className="gap-2 text-rose-600 focus:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
