import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassSurfaceVariants = cva("transition-all duration-200", {
  variants: {
    level: {
      1: "glass-1",
      2: "glass-2",
      "2-nested": "glass-2-nested",
      3: "glass-3",
      tile: "glass-3-tile",
    },
    radius: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    level: 1,
    radius: "2xl",
  },
});

export interface GlassSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassSurfaceVariants> {
  as?: React.ElementType;
}

const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ className, level = 1, radius = "2xl", as: Component = "div", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(glassSurfaceVariants({ level, radius, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

GlassSurface.displayName = "GlassSurface";

export { GlassSurface, glassSurfaceVariants };

