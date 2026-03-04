import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[10px] border border-[#E0E0E0] bg-white px-4 py-2 text-sm text-[#333] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#ccc] focus:border-[#FA7800] focus:outline-none focus:ring-2 focus:ring-[#FA7800]/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
