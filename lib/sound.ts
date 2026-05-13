"use client";
/**
 * Tasteful WebAudio chimes — no audio assets to ship.
 * Each chime is a short envelope of one or two sine tones tuned to feel polite.
 *
 * Usage:
 *   playChime("notification")  → soft 2-note ping
 *   playChime("message")       → bright 3-note iMessage-style
 *   playChime("reminder")      → bell-like single tone
 *   playChime("success")       → upward arpeggio (used for conversions)
 *
 * Honors prefers-reduced-motion (treats it as audio-off too) and the
 * persisted `helio.soundOn` flag (defaults to on).
 */

type ChimeKind = "notification" | "message" | "reminder" | "success";

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  try { _ctx = new Ctor(); } catch { return null; }
  return _ctx;
}

const STORAGE_KEY = "helio.soundOn";

export function isSoundOn(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === null ? true : v === "1";
}

export function setSoundOn(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  window.dispatchEvent(new CustomEvent("helio:sound-changed", { detail: on }));
}

export function playChime(kind: ChimeKind = "notification") {
  if (typeof window === "undefined") return;
  if (!isSoundOn()) return;
  // Treat reduced-motion users as preferring silence too — courtesy default.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const ac = ctx();
  if (!ac) return;
  // Some browsers suspend on load; resume on first user interaction.
  if (ac.state === "suspended") ac.resume().catch(() => {});

  const now = ac.currentTime;

  // Master gain — keep things quiet.
  const master = ac.createGain();
  master.gain.value = 0.0;
  master.connect(ac.destination);

  // Soft fade-in/out wrapping all notes.
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.18, now + 0.01);

  const notes: Array<[freq: number, atOffset: number, dur: number, type: OscillatorType]> = (() => {
    switch (kind) {
      case "message":
        // iMessage-ish: high → higher → highest, quick
        return [
          [880,  0.00, 0.10, "sine"],
          [1175, 0.06, 0.10, "sine"],
          [1568, 0.12, 0.14, "sine"],
        ];
      case "reminder":
        // Single bell-ish tone with a soft tail
        return [
          [660, 0.00, 0.40, "triangle"],
          [990, 0.00, 0.40, "sine"],
        ];
      case "success":
        // Upward arpeggio — used for conversion-style wins
        return [
          [523, 0.00, 0.10, "sine"],
          [659, 0.08, 0.10, "sine"],
          [784, 0.16, 0.18, "sine"],
        ];
      case "notification":
      default:
        // Polite two-note ping — descending fifth
        return [
          [880, 0.00, 0.12, "sine"],
          [587, 0.10, 0.16, "sine"],
        ];
    }
  })();

  const totalDur = Math.max(...notes.map((n) => n[1] + n[2])) + 0.05;

  for (const [freq, off, dur, type] of notes) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + off);
    g.gain.setValueAtTime(0, now + off);
    g.gain.linearRampToValueAtTime(0.6, now + off + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + off + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(now + off);
    osc.stop(now + off + dur + 0.02);
  }

  // Master release
  master.gain.linearRampToValueAtTime(0, now + totalDur);
}
