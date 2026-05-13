import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background/60 px-3 py-1 text-sm shadow-elevation-1",
        "transition-[box-shadow,border-color,background] duration-base ease-ios",
        "placeholder:text-muted-foreground",
        "hover:border-border focus-visible:outline-none focus-visible:border-primary",
        "focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.2),var(--elevation-1)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
