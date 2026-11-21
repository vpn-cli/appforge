import * as React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> { }

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[12px] font-mono font-medium bg-black/5 dark:bg-white/10 text-muted-foreground border border-black/10 dark:border-white/10 shadow-2xs select-none",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
