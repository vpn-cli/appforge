import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full transition-all duration-200 outline-none text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-9 px-3.5 rounded-full border border-border bg-card text-[14px] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-background",
        hero:
          "h-14 px-5 rounded-[20px] glass-1 text-[15px] focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-background",
        ghost:
          "bg-transparent border-0 text-[15px] focus:outline-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };

