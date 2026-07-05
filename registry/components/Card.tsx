import { RenderNode } from "../index";

export function Card({ title, subtitle, content, footer }: { title?: string, subtitle?: string, content?: any[], footer?: any[] }) {
  return (
    <div className="bg-surface border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 h-full">
      {(title || subtitle) && (
        <div className="flex flex-col gap-1.5">
          {title && <h4 className="font-bold text-text-primary text-lg">{title}</h4>}
          {subtitle && <p className="text-xs text-text-muted font-medium">{subtitle}</p>}
        </div>
      )}
      
      {content && content.length > 0 && (
         <div className="flex flex-col gap-4 flex-1">
           {content.map((item, idx) => <RenderNode key={idx} config={item} />)}
         </div>
      )}
      
      {footer && footer.length > 0 && (
         <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-border/50">
           {footer.map((item, idx) => <RenderNode key={idx} config={item} />)}
         </div>
      )}
    </div>
  );
}
