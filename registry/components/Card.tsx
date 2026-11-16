import { RenderNode } from "../index";

export function Card({ title, subtitle, content, footer }: { title?: string, subtitle?: string, content?: unknown[], footer?: unknown[] }) {
  return (
    <div className="h-full bg-card border border-border rounded-lg overflow-hidden flex flex-col pt-5 shadow-sm hover:border-border/80 transition-colors">
      <div className="px-5 pb-3 flex-1 flex flex-col">
        {(title || subtitle) && (
          <div className="shrink-0 mb-3">
            {title && <h3 className="text-base font-semibold text-foreground tracking-tight mb-0.5">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="flex flex-col space-y-3">
          {content?.map((child, idx) => (
            <RenderNode key={idx} config={child} />
          ))}
        </div>
      </div>
      {footer && footer.length > 0 && (
        <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center gap-2 mt-auto">
          {footer.map((child, idx) => (
            <RenderNode key={idx} config={child} />
          ))}
        </div>
      )}
    </div>
  );
}

