"use client";
import * as React from "react";
import { motion, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * SF-style segmented control. Pill slides between options via shared layoutId.
 *
 * <Segmented value={scope} onChange={setScope} options={[{ value: "mine", label: "Mine" }, ...]} />
 */
export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Segmented<T extends string = string>({
  value,
  onChange,
  options,
  className,
  size = "default",
  id,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  size?: "sm" | "default";
  id?: string;
}) {
  const groupId = React.useId();
  const layoutId = id ? `segmented-${id}` : `segmented-${groupId}`;
  return (
    <LayoutGroup id={layoutId}>
      <div
        role="tablist"
        className={cn(
          "inline-flex items-center rounded-md bg-muted/60 p-0.5 shadow-elevation-1",
          size === "sm" ? "h-8" : "h-9",
          className
        )}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative inline-flex items-center justify-center gap-1.5 rounded-[6px] px-3 text-sm font-medium",
                "transition-colors duration-base ease-ios focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                size === "sm" ? "h-7 px-2.5 text-xs" : "h-8",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId={`${layoutId}-pill`}
                  className="absolute inset-0 rounded-[6px] bg-background shadow-elevation-2 shadow-inner-hl"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {Icon && <Icon className="relative h-3.5 w-3.5" />}
              <span className="relative">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
