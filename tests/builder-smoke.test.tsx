import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", style: { fontFamily: "Inter" } }),
  Geist: () => ({ variable: "--font-geist-sans", style: { fontFamily: "Geist" } }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", style: { fontFamily: "Geist Mono" } }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ appId: "demo" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: false, userId: null }),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@monaco-editor/react", () => ({
  default: ({ value }: { value: string }) => (
    <pre data-testid="monaco-mock">{value}</pre>
  ),
}));

vi.mock("@/actions/apps", () => ({
  getAppConfig: vi.fn().mockResolvedValue(null),
  saveAppConfig: vi.fn().mockResolvedValue({ success: true }),
  publishAppConfig: vi.fn().mockResolvedValue({ success: true }),
}));

import BuilderPage from "@/app/builder/[appId]/page";
import { LivePreview } from "@/components/builder/LivePreview";
import { normalizeMonacoHexColor } from "@/components/builder/ConfigEditor";

describe("Builder route smoke test (/builder/demo)", () => {
  it("expands 3-digit and 4-digit minified CSS hex tokens for Monaco themes", () => {
    expect(normalizeMonacoHexColor("#fff")).toBe("#ffffff");
    expect(normalizeMonacoHexColor("#0000")).toBe("#00000000");
    expect(normalizeMonacoHexColor("#17171F")).toBe("#17171F");
    expect(normalizeMonacoHexColor("#6D5BF040")).toBe("#6D5BF040");
    expect(normalizeMonacoHexColor("invalid", "FFFFFF")).toBe("#FFFFFF");
  });

  it("renders BuilderPage for /builder/demo with real RenderNode preview and validation", () => {
    const html = renderToString(<BuilderPage />);

    expect(html).toContain("Incident Command Center");
    expect(html).toContain("Sandbox");
    expect(html).toContain("Active Incidents");
    expect(html).toContain("INC-4091");
    expect(html).toContain("No issues");
    expect(html).toContain("Ask Copilot");
  });

  it("isolates invalid component schemas with InvalidNodeFallback while rendering valid siblings", () => {
    const configWithBrokenNode = JSON.stringify({
      app: "Resilience Check",
      pages: [
        {
          components: [
            { type: "Header", title: "Healthy Header" },
            { type: "DataTable", columns: "not-an-array" },
            { type: "Statistic", label: "Healthy Metric", value: "42" },
          ],
        },
      ],
    });

    const html = renderToString(<LivePreview configStr={configWithBrokenNode} appId="demo" />);

    expect(html).toContain("Healthy Header");
    expect(html).toContain("Invalid Component Spec");
    expect(html).toContain("Healthy Metric");
    expect(html).toContain("42");
  });
});
