import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[#FA7800] text-white",
        secondary:
          "bg-[#F5F5F5] text-[#505050]",
        destructive:
          "bg-[#FFEBEE] text-[#E53935]",
        outline:
          "border border-[#E0E0E0] text-[#505050]",
        success:
          "bg-[#E8F5E9] text-[#43A047]",
        warning:
          "bg-[#FFF3E0] text-[#FA7800]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
