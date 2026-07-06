import { RenderNode } from "../index";

export function Card({ title, subtitle, content, footer }: { title?: string, subtitle?: string, content?: any[], footer?: any[] }) {
  return (
    <div className="group relative bg-surface border border-border/80 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 ease-out flex flex-col pt-6">
      <div className="px-8 pb-4 flex-1">
        {title && <h3 className="text-xl font-semibold text-text-primary tracking-tight mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-text-muted font-medium mb-5">{subtitle}</p>}
        <div className="space-y-4">
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
