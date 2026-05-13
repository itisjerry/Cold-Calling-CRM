"use client";
import confetti from "canvas-confetti";

/**
 * Tasteful conversion celebration. ~40 particles, 800ms.
 * Skips entirely when the user prefers reduced motion.
 */
export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const defaults = {
    spread: 70,
    startVelocity: 32,
    ticks: 60,
    scalar: 0.9,
    gravity: 0.9,
    decay: 0.92,
    origin: { y: 0.7 },
    colors: ["#0a84ff", "#34c759", "#ff9f0a", "#ff453a", "#bf5af2"],
  };

  confetti({ ...defaults, particleCount: 22, angle: 70, origin: { x: 0.2, y: 0.7 } });
  confetti({ ...defaults, particleCount: 22, angle: 110, origin: { x: 0.8, y: 0.7 } });
}
