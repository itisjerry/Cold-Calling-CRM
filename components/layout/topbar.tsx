"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Plus, Moon, Sun, Phone, Menu, Volume2, VolumeX } from "lucide-react";
import { isSoundOn, setSoundOn, playChime } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./command-palette";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { NotificationBell } from "./notification-bell";
import { UserSwitcher } from "./user-switcher";

export function Topbar() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  // Reactive sound preference
  const [soundOn, setSoundOnLocal] = React.useState(true);
  React.useEffect(() => {
    setSoundOnLocal(isSoundOn());
    const handler = (e: Event) => setSoundOnLocal((e as CustomEvent<boolean>).detail);
    window.addEventListener("helio:sound-changed", handler as EventListener);
    return () => window.removeEventListener("helio:sound-changed", handler as EventListener);
  }, []);
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) playChime("success"); // gives the user audible confirmation
  };

  // Scroll-driven border + shadow on the glass topbar — only appears once you scroll.
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 8, 40], [0, 0.6, 1]);
  const shadowBox = useTransform(
    scrollY,
    [0, 40],
    ["0 0 0 hsl(0 0% 0% / 0)", "0 8px 24px -16px hsl(0 0% 0% / 0.18)"]
  );

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
      <motion.header
        className="sticky top-0 z-30 flex h-14 items-center gap-3 px-4 lg:px-6 glass border-b-0"
        style={{ boxShadow: shadowBox }}
      >
        {/* scroll-driven border bottom */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-px bg-border pointer-events-none"
          style={{ opacity: borderOpacity }}
        />

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
          className="flex items-center gap-2 h-9 flex-1 max-w-md rounded-md border border-input bg-background/40 px-3 text-sm text-muted-foreground shadow-elevation-1 hover:bg-background/70 hover:border-border transition-all duration-base ease-ios"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search leads, companies, anything…</span>
          <kbd className="hidden sm:inline-flex items-center rounded border bg-background/80 px-1.5 py-0.5 text-[10px] font-mono">⌘ K</kbd>
        </button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4 mr-1" /> Quick add
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/call-mode")}
            className="hidden md:inline-flex bg-gradient-to-b from-primary/95 to-primary hover:brightness-[1.05]"
          >
            <Phone className="h-4 w-4 mr-1.5" /> Start Calling
          </Button>
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            title={soundOn ? "Sound on — click to mute" : "Sound off — click to enable"}
            aria-label={soundOn ? "Mute notifications" : "Enable notification sounds"}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <UserSwitcher />
        </div>
      </motion.header>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
