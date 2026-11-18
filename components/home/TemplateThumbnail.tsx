import { RenderNode } from "@/registry";

type Props = {
  config: {
    pages?: Array<{
      components?: Array<Record<string, unknown>>;
    }>;
  };
};

export function TemplateThumbnail({ config }: Props) {
  const components = config.pages?.[0]?.components?.slice(0, 3) ?? [];

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden bg-surface-sunken border-b border-border select-none pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 50%, rgba(0,0,0,0.85) 75%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 50%, rgba(0,0,0,0.85) 75%, transparent 100%)",
        }}
      >
        <div className="absolute top-0 left-0 w-[540px] origin-top-left transform scale-[0.72] sm:scale-[0.75] p-4 bg-background flex flex-col gap-3 overflow-hidden pointer-events-none">
          {components.map((comp, idx) => (
            <RenderNode key={idx} config={comp} />
          ))}
        </div>
      </div>

      <div className="absolute inset-0 ring-1 ring-inset ring-border/40 pointer-events-none" />
    </div>
  );
}
