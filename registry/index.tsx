/* eslint-disable @typescript-eslint/no-explicit-any */
﻿import { Header } from "./components/Header";
import { ButtonAction } from "./components/ButtonAction";
import { Card } from "./components/Card";
import { Grid } from "./components/Grid";
import { Statistic } from "./components/Statistic";
import { DataTable } from "./components/DataTable";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  Header,
  ButtonAction,
  Card,
  Grid,
  Statistic,
  DataTable,
};

export function RenderNode({ config }: { config: unknown }) {
  if (config === "<<<REPLACE>>>") {
    return (
      <div className="w-full h-32 bg-muted/20 animate-pulse rounded-2xl border border-dashed border-border/50 flex items-center justify-center shadow-inner overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] bg-[length:250%_250%] animate-[skeleton-shine_2s_infinite_linear]" />
        <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase relative z-10 opacity-70">
          Synthesizing Component Structure...
        </span>
      </div>
    );
  }
  
  if (!config || typeof config !== 'object') return null;
  
  const { type, ...props } = config as { type: string, [key: string]: unknown };
  
  if (!type) {
    return (
      <div className="p-3 bg-[#FFBD2E]/10 border border-[#FFBD2E]/20 text-[#FFBD2E] text-[11px] font-mono rounded flex flex-col gap-1 my-2">
        <span className="font-bold tracking-widest uppercase">Warning</span>
        <span>A nested component block is missing its &quot;type&quot; identifier.</span>
      </div>
    );
  }

  const Component = ComponentRegistry[type];

  if (!Component) {
    return (
      <div className="p-3 bg-[#FF5F56]/10 border border-[#FF5F56]/20 text-[#FF5F56] text-[11px] font-mono rounded relative overflow-hidden group cursor-help my-2">
        <span className="font-bold mr-1 uppercase">Unknown Component Type:</span> {String(type)}
        <div className="absolute inset-0 bg-[#FF5F56]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <ErrorBoundary componentName={type}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

