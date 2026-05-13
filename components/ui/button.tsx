import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Apple-grade Button:
 *  - vertical gradient fill (light at top, base at bottom)
 *  - inner highlight (shadow-inner-hl) for a glass-bead lip
 *  - elevation shadow that grows on hover, compresses on press
 *  - active state nudges down 1px + scales 0.985 (iOS press)
 *  - focus ring with primary glow
 */
const buttonVariants = cva(
  cn(
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium select-none",
    "transition-[transform,background,box-shadow,opacity] duration-fast ease-ios",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px active:scale-[0.985]"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "text-primary-foreground shadow-elevation-2 shadow-inner-hl",
          "bg-gradient-to-b from-primary/95 to-primary",
          "hover:from-primary hover:to-primary hover:shadow-elevation-3 hover:brightness-[1.04]",
          "active:shadow-elevation-1"
        ),
        destructive: cn(
          "text-destructive-foreground shadow-elevation-2 shadow-inner-hl",
          "bg-gradient-to-b from-destructive/95 to-destructive",
          "hover:brightness-[1.05] hover:shadow-elevation-3",
          "active:shadow-elevation-1"
        ),
        success: cn(
          "text-white shadow-elevation-2 shadow-inner-hl",
          "bg-gradient-to-b from-emerald-500 to-emerald-600",
          "hover:from-emerald-500 hover:to-emerald-700 hover:shadow-elevation-3",
          "active:shadow-elevation-1"
        ),
        outline: cn(
          "border border-input bg-background/60 backdrop-blur-sm text-foreground shadow-elevation-1",
          "hover:bg-accent hover:text-accent-foreground hover:shadow-elevation-2"
        ),
        secondary: cn(
          "bg-secondary text-secondary-foreground shadow-elevation-1",
          "hover:bg-secondary/80 hover:shadow-elevation-2"
        ),
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link:  "text-primary underline-offset-4 hover:underline",
        glass: cn(
          "glass text-foreground shadow-elevation-2",
          "hover:bg-[hsl(var(--glass-tint-strong))] hover:shadow-elevation-3"
        ),
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:   "h-8 rounded-md px-3 text-xs",
        lg:   "h-11 rounded-lg px-6 text-[15px]",
        xl:   "h-12 rounded-lg px-7 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
export { buttonVariants };
