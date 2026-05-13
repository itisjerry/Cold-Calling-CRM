import * as React from "react";

/**
 * Subtle attribution footer rendered inside the main content scroll.
 * Stays out of the way on dense screens but always discoverable.
 */
export function AppFooter() {
  return (
    <footer className="mt-10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/80 px-1">
      <div>
        © {new Date().getFullYear()} Helio CRM · Built for closers.
      </div>
      <a
        href="https://www.pixelarchitecture.dev/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors group"
      >
        Powered by
        <span className="font-semibold bg-gradient-to-r from-primary to-cold bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
          Pixel Architecture
        </span>
      </a>
    </footer>
  );
}
