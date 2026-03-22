"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--discover-gold)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--discover-gold)] text-[var(--discover-bg)] hover:bg-[var(--discover-gold)]/90",
        secondary:
          "border-transparent bg-[var(--discover-active-card)] text-[var(--discover-body)] hover:bg-[var(--discover-active-card)]/80",
        outline:
          "border-[var(--discover-gold)] text-[var(--discover-gold)] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
