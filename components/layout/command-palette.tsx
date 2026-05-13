"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard, Phone, Users, RotateCcw, GitBranch, Briefcase, CheckSquare,
  Calendar, BarChart3, Upload, Settings, Search, UserRound,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const leads = useStore((s) => s.leads);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search leads, companies, navigation…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/call-mode")}>  <Phone           className="mr-2 h-4 w-4" /> Call Mode</CommandItem>
          <CommandItem onSelect={() => go("/leads")}>      <Users           className="mr-2 h-4 w-4" /> Leads</CommandItem>
          <CommandItem onSelect={() => go("/follow-ups")}> <RotateCcw       className="mr-2 h-4 w-4" /> Follow-ups</CommandItem>
          <CommandItem onSelect={() => go("/pipeline")}>   <GitBranch       className="mr-2 h-4 w-4" /> Pipeline</CommandItem>
          <CommandItem onSelect={() => go("/projects")}>   <Briefcase       className="mr-2 h-4 w-4" /> Projects</CommandItem>
          <CommandItem onSelect={() => go("/tasks")}>      <CheckSquare     className="mr-2 h-4 w-4" /> Tasks</CommandItem>
          <CommandItem onSelect={() => go("/calendar")}>   <Calendar        className="mr-2 h-4 w-4" /> Calendar</CommandItem>
          <CommandItem onSelect={() => go("/analytics")}>  <BarChart3       className="mr-2 h-4 w-4" /> Analytics</CommandItem>
          <CommandItem onSelect={() => go("/import")}>     <Upload          className="mr-2 h-4 w-4" /> Import Leads</CommandItem>
          <CommandItem onSelect={() => go("/settings")}>   <Settings        className="mr-2 h-4 w-4" /> Settings</CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {leads.length > 0 && (
          <CommandGroup heading="Leads">
            {leads.slice(0, 20).map((l) => (
              <CommandItem key={l.id} onSelect={() => go(`/leads/${l.id}`)}>
                <UserRound className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{l.name}</span>
                  <span className="text-xs text-muted-foreground">{l.company} · {l.city}, {l.state}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
