import { RenderNode } from "../index";

export function Card({ title, subtitle, content, footer }: { title?: string, subtitle?: string, content?: unknown[], footer?: unknown[] }) {
  return (
    <div className="group relative bg-card/60 backdrop-blur-xl border border-black/15 dark:border-border/50 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgba(108,87,164,0.1)] hover:-translate-y-1 hover:border-brand/40 transition-all duration-500 ease-out flex flex-col pt-6">
      <div className="px-8 pb-4 flex-1 flex flex-col">
        {(title || subtitle) && (
          <div className="shrink-0 mb-5">
            {title && <h3 className="text-xl font-semibold text-foreground tracking-tight mb-1">{title}</h3>}
            {subtitle && <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>}
          </div>
        )}
        <div className="flex flex-col space-y-4">
          {content?.map((child, idx) => (
            <RenderNode key={idx} config={child} />
          ))}
        </div>
      </div>
      {footer && footer.length > 0 && (
        <div className="px-8 py-4 bg-background/50 border-t border-border/50 flex items-center gap-3 mt-auto">
          {footer.map((child, idx) => (
            <RenderNode key={idx} config={child} />
          ))}
        </div>
      )}
    </div>
  );
}

