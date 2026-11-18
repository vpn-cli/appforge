import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium select-none whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        published:
          "bg-status-success-bg text-status-success-text border border-status-success-border",
        draft:
          "bg-status-neutral-bg text-status-neutral-text border border-status-neutral-border",
        active:
          "bg-status-success-bg text-status-success-text border border-status-success-border",
        success:
          "bg-status-success-bg text-status-success-text border border-status-success-border",
        idle:
          "bg-status-info-bg text-status-info-text border border-status-info-border",
        info:
          "bg-status-info-bg text-status-info-text border border-status-info-border",
        warning:
          "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
        error:
          "bg-status-danger-bg text-status-danger-text border border-status-danger-border",
        danger:
          "bg-status-danger-bg text-status-danger-text border border-status-danger-border",
        neutral:
          "bg-status-neutral-bg text-status-neutral-text border border-status-neutral-border",
        violet:
          "bg-status-violet-bg text-status-violet-text border border-status-violet-border",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

const dotColors: Record<string, string> = {
  published: "bg-[var(--status-success-dot)]",
  draft: "bg-[var(--status-neutral-dot)]",
  active: "bg-[var(--status-success-dot)] animate-pulse",
  success: "bg-[var(--status-success-dot)]",
  idle: "bg-[var(--status-info-dot)]",
  info: "bg-[var(--status-info-dot)]",
  warning: "bg-[var(--status-warning-dot)]",
  error: "bg-[var(--status-danger-dot)]",
  danger: "bg-[var(--status-danger-dot)]",
  neutral: "bg-[var(--status-neutral-dot)]",
  violet: "bg-[var(--status-violet-dot)]",
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

