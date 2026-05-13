"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Sparkles, Zap, ShieldCheck, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* ── Animated background field ───────────────────────────── */}
      <BackgroundField />

      {/* Theme toggle floats top-right */}
      <ThemeToggle />

      {/* Pixel Architecture mark, top-left */}
      <Link
        href="https://www.pixelarchitecture.dev/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-5 left-5 z-20 flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground/5 backdrop-blur-md border border-border/40 group-hover:scale-105 transition-transform">
          <span className="font-display text-[11px] font-bold bg-gradient-to-br from-primary to-cold bg-clip-text text-transparent">PA</span>
        </span>
        <span className="hidden sm:inline">A product of <span className="font-medium">Pixel Architecture</span></span>
      </Link>

      <div className="relative z-10 grid lg:grid-cols-[1.1fr_1fr] min-h-screen">
        {/* ── Left hero ───────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex flex-col justify-between p-12 xl:p-16"
        >
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <div className="font-display text-xl font-bold tracking-tight">Helio CRM</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">a product of Pixel Architecture</div>
            </div>
          </div>

          <div className="space-y-7 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-md px-3 py-1 text-xs font-medium shadow-elevation-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                Built so no lead gets wasted.
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05]"
            >
              The calling{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-cold bg-clip-text text-transparent">
                command center
              </span>{" "}
              for modern agencies.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Timezone-aware queues. Behavior-driven scheduling. Sandboxes for dead ends.
              A clean handoff from qualified lead to active project — without a single soul slipping through.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid sm:grid-cols-3 gap-3 max-w-xl"
            >
              <Feature icon={Zap}        title="Auto-cadence"   sub="Best time, every time" />
              <Feature icon={Sparkles}   title="Smart sandbox"  sub="No lead wasted" />
              <Feature icon={ShieldCheck} title="Admin oversight" sub="See it all" />
            </motion.ul>
          </div>

          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Helio CRM. Built for closers — by{" "}
            <Link
              href="https://www.pixelarchitecture.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Pixel Architecture
            </Link>.
          </div>
        </motion.section>

        {/* ── Right form panel ────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center p-4 sm:p-6 lg:p-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
              <BrandMark />
              <div>
                <div className="font-display text-base font-bold">Helio CRM</div>
                <div className="text-[10px] text-muted-foreground -mt-0.5">by Pixel Architecture</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/85 backdrop-blur-xl shadow-elevation-5 p-5 sm:p-7 md:p-8 relative overflow-hidden">
              {/* shine */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              {children}
            </div>

            <p className="text-center text-[11px] text-muted-foreground/70 mt-6">
              Demo build · all accounts use the password{" "}
              <code className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">password</code>
            </p>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="relative h-10 w-10">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-indigo-500 to-cold shadow-elevation-3 shadow-inner-hl" />
      <div className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold text-white">H</div>
      <motion.div
        className="absolute -inset-1 rounded-2xl border-2 border-primary/40"
        animate={{ opacity: [0, 1, 0], scale: [0.95, 1.06, 1.1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
      />
    </div>
  );
}

function Feature({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <li className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-3 shadow-elevation-1">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </li>
  );
}

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="absolute top-5 right-5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md bg-foreground/5 backdrop-blur-md border border-border/40 hover:bg-foreground/10 transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/**
 * Animated background — soft gradient orbs + grid.
 * GPU-friendly; respects prefers-reduced-motion via global CSS guard.
 */
function BackgroundField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.5) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
        }}
      />
      {/* drifting orbs — sized down on mobile so they don't break layout / cause horizontal scroll */}
      <motion.div
        className="absolute -top-32 -left-32 h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] lg:h-[480px] lg:w-[480px] rounded-full blur-[100px] sm:blur-[120px]"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.45), transparent 70%)" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-[300px] w-[300px] sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px] rounded-full blur-[110px] sm:blur-[140px]"
        style={{ background: "radial-gradient(circle, hsl(var(--cold) / 0.40), transparent 70%)" }}
        animate={{ x: [0, -50, 30, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 h-[220px] w-[220px] sm:h-[300px] sm:w-[300px] lg:h-[380px] lg:w-[380px] -translate-x-1/2 rounded-full blur-[100px] sm:blur-[120px]"
        style={{ background: "radial-gradient(circle, hsl(280 90% 60% / 0.20), transparent 70%)" }}
        animate={{ x: [-40, 40, -40], y: [-20, 30, -20] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* phone icon, easter egg subtle */}
      <motion.div
        className="absolute bottom-12 right-12 hidden lg:block opacity-[0.04] dark:opacity-[0.06]"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Phone className="h-40 w-40" />
      </motion.div>
    </div>
  );
}
