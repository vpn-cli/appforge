import { RenderNode } from "../index";
import { CardProvider } from "../context";

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
  return (
    <div className="@container h-full bg-card border border-border rounded-lg overflow-hidden flex flex-col p-4 shadow-sm hover:border-border/80 transition-colors min-w-0">
      {(title || subtitle) && (
        <div className="shrink-0 mb-3 min-w-0">
          {title && (
            <h3
              className="text-sm font-semibold text-foreground tracking-tight break-words [overflow-wrap:anywhere] min-w-0"
              title={title}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-normal break-words [overflow-wrap:anywhere] min-w-0 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {content && content.length > 0 && (
        <CardProvider isInCard={true}>
          <div className="flex flex-col divide-y divide-border/60 flex-1 min-w-0">
            {content.map((child, idx) => (
              <div
                key={idx}
                className="first:pt-0 pt-3 pb-3 last:pb-0 min-w-0"
              >
                <RenderNode config={child} />
              </div>
            ))}
          </div>
        </CardProvider>
      )}

      {footer && footer.length > 0 && (
        <div className="pt-3 flex flex-wrap items-center gap-2 mt-auto min-w-0">
          {footer.map((child, idx) => (
            <RenderNode key={idx} config={child} />
          ))}
        </div>
      )}
    </div>
  );
}
