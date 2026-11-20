import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(109,91,240,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "btn-pill-primary",
        secondary:
          "btn-pill-secondary",
        default:
          "btn-pill-primary",
        outline:
          "btn-pill-secondary",
        ghost:
          "rounded-full text-brand-link hover:text-brand-link hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.97]",
        destructive:
          "rounded-full bg-destructive text-white hover:opacity-90 shadow-xs active:scale-[0.97]",
        link:
          "text-brand-link underline-offset-4 hover:underline rounded-none active:scale-100",
      },
      size: {
        lg: "h-11 px-[22px] text-[15px] gap-2 [&_svg:not([class*='size-'])]:size-4",
        md: "h-9 px-4 text-[14px] gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-[30px] px-3 text-[13px] gap-1.5 [&_svg:not([class*='size-'])]:size-3",
        default: "h-9 px-4 text-[14px] gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-9 rounded-full p-0 flex items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-[30px] rounded-full p-0 flex items-center justify-center [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 rounded-full p-0 flex items-center justify-center [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonPrimitive.Props,
  VariantProps<typeof buttonVariants> {
  showArrow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", showArrow, children, render, nativeButton, ...props }, ref) => {
    const isNativeButton = nativeButton !== undefined ? nativeButton : render ? false : true;
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        render={render}
        nativeButton={isNativeButton}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        {showArrow && (
          <ArrowRight
            className="w-4 h-4 ml-0.5 transition-transform duration-200 group-hover/button:translate-x-0.5"
            strokeWidth={2}
          />
        )}
      </ButtonPrimitive>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
