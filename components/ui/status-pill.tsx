import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium select-none whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        published:
          "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30",
        draft:
          "bg-black/5 text-muted-foreground border border-black/10 dark:bg-white/5 dark:text-muted-foreground dark:border-white/10",
        active:
          "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40",
        idle:
          "bg-black/5 text-muted-foreground border border-black/10 dark:bg-white/5 dark:text-muted-foreground dark:border-white/10",
        warning:
          "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30",
        error:
          "bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30",
        neutral:
          "bg-muted text-foreground border border-border",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

const dotColors: Record<string, string> = {
  published: "bg-emerald-500",
  draft: "bg-muted-foreground/60",
  active: "bg-emerald-500 animate-pulse",
  idle: "bg-muted-foreground/50",
  warning: "bg-amber-500",
  error: "bg-rose-500",
  neutral: "bg-foreground/60",
};

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {
  showDot?: boolean;
}

export function StatusPill({
  className,
  variant = "neutral",
  showDot = true,
  children,
  ...props
}: StatusPillProps) {
  const currentVariant = variant || "neutral";
  return (
    <span
      className={cn(statusPillVariants({ variant: currentVariant, className }))}
      {...props}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[currentVariant] || dotColors.neutral)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export { StatusPill as Badge };
