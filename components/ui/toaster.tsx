"use client";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={(resolvedTheme as "light" | "dark") || "light"}
      position="top-right"
      richColors
      closeButton
      expand
      visibleToasts={5}
      offset={20}
      gap={10}
      duration={5000}
      toastOptions={{
        className: "shadow-elevation-4",
        classNames: {
          toast:
            "bg-card/95 text-card-foreground border border-[hsl(var(--glass-border))] backdrop-blur-xl shadow-elevation-4 rounded-xl",
          title: "font-display font-semibold tracking-tight",
          description: "text-muted-foreground text-sm leading-snug",
          actionButton: "bg-primary text-primary-foreground rounded-md font-medium",
          cancelButton: "bg-muted text-foreground rounded-md font-medium",
          closeButton: "border border-border bg-card text-foreground hover:bg-accent",
        },
      }}
    />
  );
}
