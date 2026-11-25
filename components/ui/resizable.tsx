"use client";

import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

interface ResizableHandleProps
  extends React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> {
  withHandle?: boolean;
  onReset?: () => void;
  isDragging?: boolean;
}

const ResizableHandle = ({
  className,
  withHandle = true,
  onReset,
  isDragging,
  onDoubleClick,
  ...props
}: ResizableHandleProps) => {
  return (
    <ResizablePrimitive.PanelResizeHandle
      onDoubleClick={(e) => {
        onDoubleClick?.(e);
        onReset?.();
      }}
      className={cn(
        // 8px hit area: w-2 (-mx-1 for seamless placement over border)
        "relative flex w-2 -mx-1 h-full items-center justify-center cursor-col-resize select-none z-30 outline-none group transition-colors",
        className
      )}
      {...props}
    >
      {/* 1px Center Line: turns brand-colored on hover and while dragging */}
      <div
        className={cn(
          "absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors duration-150",
          "bg-border group-hover:bg-brand group-focus-visible:bg-brand",
          isDragging && "bg-brand"
        )}
      />

      {/* Small Grip: 4px x 16px rounded pill that highlights with brand color */}
      {withHandle && (
        <div
          className={cn(
            "relative z-10 flex h-4 w-1 rounded-full transition-all duration-150",
            "bg-muted-foreground/30 group-hover:bg-brand group-hover:scale-y-110 group-focus-visible:bg-brand",
            isDragging && "bg-brand scale-y-110 shadow-xs"
          )}
          aria-hidden="true"
        />
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
