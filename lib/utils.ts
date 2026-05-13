import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.slice(-10) || null;
}

export function formatPhone(raw?: string | null): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

export function formatMoney(n?: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function daysSince(iso?: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function isTueOrThu(d = new Date()): boolean {
  const day = d.getDay();
  return day === 2 || day === 4;
}

export const TEMP_COLORS: Record<string, string> = {
  Hot: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  Warm: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Cold: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
};

export const STATUS_COLORS: Record<string, string> = {
  New: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  Attempting: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Connected: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "In Discussion": "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  "Follow-up": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Qualified: "bg-green-500/15 text-green-600 dark:text-green-400",
  "Not Interested": "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  Dead: "bg-zinc-500/15 text-zinc-500",
};
