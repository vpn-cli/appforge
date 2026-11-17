import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full transition-all duration-200 outline-none select-none focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 cursor-pointer active:scale-95",
  {
    variants: {
      variant: {
        glass:
          "bg-slate-200/60 hover:bg-slate-300/60 text-slate-700 border border-slate-300/40 shadow-xs dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 dark:border-white/10 dark:shadow-none",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10",
        solid:
          "bg-card hover:bg-muted text-foreground border border-border shadow-xs",
      },
      size: {
        lg: "size-11 [&_svg]:size-5",
        md: "size-9 [&_svg]:size-4",
        sm: "size-[30px] [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "md",
    },
  }
);

export interface IconButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "glass", size = "md", ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="icon-button"
        className={cn(iconButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };

