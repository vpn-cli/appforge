import { RenderNode } from "../index";

export function Card({
  title,
  subtitle,
  content,
  footer,
}: {
  title?: string;
  subtitle?: string;
  content?: unknown[];
  footer?: unknown[];
}) {
  // Detect if subtitle contains numeric metrics (e.g. "2 unresolved issues", "142 onboard", "$42,800", "114%")
  const isMetric = subtitle ? /\d/.test(subtitle) || /^[+$€£¥%]/.test(subtitle) : false;

  return (
    <div className="h-full bg-card border border-border rounded-lg overflow-hidden flex flex-col p-4 shadow-sm hover:border-border/80 transition-colors">
      {(title || subtitle) && (
        <div className="shrink-0 mb-3">
          {title && (
            <h3 className="text-xs font-medium text-muted-foreground tracking-tight mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              className={
                isMetric
                  ? "text-xl font-bold tracking-tight text-foreground font-mono tabular-nums leading-snug"
                  : "text-sm font-medium text-foreground leading-snug"
              }
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {content && content.length > 0 && (
        <div className="flex flex-col space-y-2.5 flex-1">
          {content.map((child, idx) => (
            <RenderNode key={idx} config={child} />
          ))}
        </div>
      )}

      {footer && footer.length > 0 && (
        <div className="pt-3 flex items-center gap-2 mt-auto">
          {footer.map((child, idx) => (
            <RenderNode key={idx} config={child} />
          ))}
        </div>
      )}
    </div>
  );
}
