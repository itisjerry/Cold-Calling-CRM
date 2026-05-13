"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { LayoutDashboard, Users, Phone, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home",   icon: LayoutDashboard },
  { href: "/leads",     label: "Leads",  icon: Users },
  { href: "/call-mode", label: "Call",   icon: Phone, primary: true },
];

/**
 * Mobile bottom-tab bar. Glass material, safe-area aware, only renders on small screens.
 * Replaces the hidden sidebar's nav with thumb-reach access to the three main flows.
 * "More" opens the full sidebar in a sheet.
 */
export function BottomTabs() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  // Close the "More" sheet automatically when the route changes.
  React.useEffect(() => { setMoreOpen(false); }, [pathname]);
  return (
    <nav
      className={cn(
        "lg:hidden fixed inset-x-0 bottom-0 z-40 glass border-t border-[hsl(var(--glass-border))]",
        "pb-[env(safe-area-inset-bottom)] shadow-elevation-3"
      )}
    >
      <LayoutGroup id="bottom-tabs">
        <div className="flex items-stretch h-14 max-w-2xl mx-auto px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = pathname === t.href || (t.href !== "/" && pathname?.startsWith(t.href + "/"));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  "transition-colors duration-base ease-ios",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="bottom-tabs-pill"
                    className="absolute inset-1 rounded-md bg-primary/10 shadow-inner-hl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={cn("relative h-5 w-5", t.primary && active && "scale-110 transition-transform")} />
                <span className="relative">{t.label}</span>
              </Link>
            );
          })}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  "text-muted-foreground hover:text-foreground transition-colors duration-base ease-ios"
                )}
                aria-label="More"
              >
                <Menu className="relative h-5 w-5" />
                <span className="relative">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </LayoutGroup>
    </nav>
  );
}
