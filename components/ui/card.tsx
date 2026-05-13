import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card with elevation system & variants.
 *  - default:     elevation-2, hover lifts to elevation-3
 *  - flat:        no shadow (use inside other surfaces / dense lists)
 *  - glass:       frosted material (modals, popovers, hero cards)
 *  - interactive: cursor-pointer + lift + subtle border highlight
 */
const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-[box-shadow,transform,border-color] duration-base ease-ios",
  {
    variants: {
      variant: {
        default: "shadow-elevation-2 hover:shadow-elevation-3",
        flat:    "shadow-none",
        glass:   "glass shadow-elevation-3",
        interactive: cn(
          "shadow-elevation-2 hover:shadow-elevation-4 hover:-translate-y-0.5",
          "hover:border-primary/30 cursor-pointer active:translate-y-0 active:shadow-elevation-2"
        ),
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={cn("font-display text-base font-semibold leading-none tracking-tight", className)} {...props} />
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
);
CardFooter.displayName = "CardFooter";
