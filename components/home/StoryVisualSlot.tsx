"use client";

import {
  useEffect,
  useRef,
  useState,
  startTransition,
  type ComponentType,
  type ReactNode,
} from "react";

export type StoryVisualKind = "backends" | "resilience" | "preview" | "copilot";

async function loadStoryVisual(kind: StoryVisualKind): Promise<ComponentType> {
  switch (kind) {
    case "backends":
      return (await import("./story/DynamicBackendsLive")).DynamicBackendsLive;
    case "resilience":
      return (await import("./story/GracefulDegradationLive"))
        .GracefulDegradationLive;
    case "preview":
      return (await import("./story/InstantPreviewLive")).InstantPreviewLive;
    case "copilot":
      return (await import("./story/AiCopilotLive")).AiCopilotLive;
  }
}

export function StoryVisualSlot({
  kind,
  children,
}: {
  kind: StoryVisualKind;
  children: ReactNode;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [LiveComp, setLiveComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    const el = slotRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          loadStoryVisual(kind).then((Comp) => {
            if (cancelled) return;
            startTransition(() => {
              setLiveComp(() => Comp);
            });
          });
        }
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [kind]);

  return <div ref={slotRef}>{LiveComp ? <LiveComp /> : children}</div>;
}
