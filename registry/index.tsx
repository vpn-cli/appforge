/* eslint-disable @typescript-eslint/no-explicit-any */
import { Header } from "./components/Header";
import { ButtonAction } from "./components/ButtonAction";
import { Card } from "./components/Card";
import { Grid } from "./components/Grid";
import { Statistic } from "./components/Statistic";
import { DataTable } from "./components/DataTable";
import { InvalidNodeFallback } from "./components/InvalidNodeFallback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { validateComponentNode } from "@/lib/validation";

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
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,var(--color-border)_50%,transparent_75%)] bg-[length:250%_250%] animate-[skeleton-shine_2s_infinite_linear]" />
        <span className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase relative z-10 opacity-70">
          Synthesizing Component Structure...
        </span>
      </div>
    );
  }

  if (!config || typeof config !== "object") return null;

  const raw = config as { type?: unknown; [key: string]: unknown };

  if (!raw.type || typeof raw.type !== "string") {
    return (
      <div className="p-3 bg-warning-light border border-warning-border text-warning-text text-xs font-mono rounded-md flex flex-col gap-1 my-2">
        <span className="font-bold tracking-widest uppercase">Warning</span>
        <span>A nested component block is missing its &quot;type&quot; identifier.</span>
      </div>
    );
  }

  const type = raw.type;
  const Component = ComponentRegistry[type];

  if (!Component) {
    return (
      <div className="p-3 bg-error-light border border-error-border text-error-text text-xs font-mono rounded-md relative overflow-hidden group cursor-help my-2">
        <span className="font-bold mr-1 uppercase">Unknown Component Type:</span> {String(type)}
        <div className="absolute inset-0 bg-error/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  // Deep validate component props against its specific Zod schema
  const validation = validateComponentNode(config);

  if (!validation.valid) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[AppForge AST Schema Violation] Component <${type}> failed validation:`,
        validation.issues
      );
    }
    return (
      <InvalidNodeFallback
        type={type}
        issues={validation.issues}
        rawNode={config}
      />
    );
  }

  const validatedProps = validation.data || raw;
  // Strip out the 'type' field from props passed to the component
  const { type: _t, ...props } = validatedProps;

  return (
    <ErrorBoundary componentName={type}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
