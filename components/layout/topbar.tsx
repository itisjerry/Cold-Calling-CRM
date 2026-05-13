"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, Plus, Moon, Sun, Phone, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandPalette } from "./command-palette";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";

export function Topbar() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur px-4 lg:px-6">
        {/* Mobile sidebar trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <button
          onClick={() => setCmdOpen(true)}
          className="flex items-center gap-2 h-9 flex-1 max-w-md rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search leads, companies, anything…</span>
          <kbd className="hidden sm:inline-flex items-center rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘ K</kbd>
        </button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4 mr-1" /> Quick add
          </Button>
          <Button size="sm" onClick={() => router.push("/call-mode")} className="bg-gradient-to-r from-primary to-indigo-500 hover:opacity-90">
            <Phone className="h-4 w-4 mr-1.5" /> Start Calling
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
