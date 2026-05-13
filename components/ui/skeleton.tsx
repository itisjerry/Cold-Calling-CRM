import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton with shimmer sweep. Use for any async placeholder.
 *
 * <Skeleton className="h-4 w-32 rounded" />
 * <Skeleton variant="circle" className="h-10 w-10" />
 */
export function Skeleton({
  className,
  variant = "block",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "block" | "circle" | "text" }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/60",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded h-3",
        variant === "block" && "rounded-md",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 -translate-x-full animate-shimmer",
          "bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent"
        )}
      />
    </div>
  );
}

/** Convenience: a row of skeleton text lines */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}
