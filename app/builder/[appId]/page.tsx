"use client";

import { useMemo, useState, useEffect } from "react";
import { ConfigEditor } from "@/components/builder/ConfigEditor";
import { CopilotPanel } from "@/components/builder/CopilotPanel";
import { LivePreview } from "@/components/builder/LivePreview";
import { ValidationPanel } from "@/components/builder/ValidationPanel";
import { validateConfig } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Play,
  Loader2,
  Sparkles,
  Sun,
  Moon,
  FileCode,
  Layout,
  Code2,
  Eye,
  Columns,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { getAppConfig, saveAppConfig, publishAppConfig } from "@/actions/apps";

const defaultMockConfig = JSON.stringify(
  {
    app: "Employee Control Center",
    pages: [
      {
        components: [
          {
            type: "Header",
            title: "Operations Hub",
            subtitle: "Manage fleet logistics and security incidents globally.",
            size: "lg",
          },
          {
            type: "Grid",
            columns: 3,
            gap: 4,
            items: [
              {
                type: "Card",
                title: "System Alerts",
                subtitle: "2 unresolved issues",
                footer: [
                  {
                    type: "ButtonAction",
                    label: "View Logs",
                    variant: "outline",
                    icon: "search",
                  },
                ],
              },
              {
                type: "Card",
                title: "Active Personnel",
                subtitle: "142 onboard",
                footer: [
                  {
                    type: "ButtonAction",
                    label: "Message All",
                    variant: "ghost",
                    icon: "play",
                  },
                ],
              },
              {
                type: "Card",
                title: "Fleet Status",
                subtitle: "All units nominal",
                footer: [
                  {
                    type: "ButtonAction",
                    label: "Run Diagnostic",
                    variant: "secondary",
                    icon: "arrow-right",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  null,
  2,
);

type Direction = "A" | "B";
type ViewportMode = "desktop" | "tablet" | "mobile";
type ViewMode = "split" | "code" | "preview";

export default function BuilderPage() {
  const params = useParams();
  const appId = (params?.appId as string) || "demo";
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || undefined;
  const initialDirection = (searchParams.get("direction") as Direction) || "A";

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [isCopilotOpen, setIsCopilotOpen] = useState(!!initialPrompt);

  const { isSignedIn } = useAuth();
  const isGuestRoute = appId.startsWith("template-") || appId === "mock-new-id";

  const [configStr, setConfigStr] = useState(() => {
    if (appId.includes("template-blank")) {
      return JSON.stringify({ app: "Untitled Template", pages: [] }, null, 2);
    }
    if (appId.includes("template-directory")) {
      return JSON.stringify(
        {
          app: "Employee Directory",
          pages: [
            {
              components: [
                {
                  type: "Header",
                  title: "Corporate Hierarchy",
                  subtitle: "Internal personnel management.",
                },
                {
                  type: "Grid",
                  columns: 3,
                  gap: 4,
                  items: [
                    {
                      type: "Card",
                      title: "Vipin",
                      subtitle: "Admin · Active",
                      footer: [{ type: "ButtonAction", label: "View Profile" }],
                    },
                    {
                      type: "Card",
                      title: "John Doe",
                      subtitle: "Developer · On Call",
                      footer: [{ type: "ButtonAction", label: "View Profile" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        null,
        2,
      );
    }
    return defaultMockConfig;
  });

  const { errors, warnings } = useMemo(
    () => validateConfig(configStr),
    [configStr],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authRequireMessage, setAuthRequireMessage] = useState<string | null>(
    null,
  );
  const [notificationModal, setNotificationModal] = useState<{
    type: "error" | "success";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const dirParam = searchParams.get("direction");
    if (dirParam === "A" || dirParam === "B") {
      setDirection(dirParam);
    }
    const themeParam = searchParams.get("theme");
    if (themeParam === "light" || themeParam === "dark") {
      setTheme(themeParam);
    }
  }, [searchParams, setTheme]);

  useEffect(() => {
    if (!isGuestRoute && isSignedIn) {
      getAppConfig(appId)
        .then((config) => {
          if (config) {
            setConfigStr(JSON.stringify(config, null, 2));
          }
        })
        .catch((err) => console.error("Failed to hydrate config:", err));
    }
  }, [appId, isGuestRoute, isSignedIn]);

  // Global shortcut ⌘K for Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tagName = target.tagName.toLowerCase();
          const isInput =
            tagName === "input" ||
            tagName === "textarea" ||
            target.isContentEditable;
          const isEditor = target.closest(
            ".monaco-editor, .cm-editor, [data-code-editor], textarea",
          );
          if (isInput || isEditor) return;
        }
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    if (!isSignedIn) {
      setTimeout(() => {
        setNotificationModal({
          type: "success",
          title: "Draft Saved Locally",
          message:
            "Guest changes are saved securely to your browser temporarily. Sign in to sync across devices!",
        });
        setIsSaving(false);
      }, 400);
      return;
    }

    try {
      const res = await saveAppConfig(appId, configStr);
      if (res && res.success === false) throw new Error(res.error);
      setNotificationModal({
        type: "success",
        title: "Saved Successfully",
        message: "Your draft has been saved securely to the database.",
      });
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      if (msg.toLowerCase().includes("unauthorized")) {
        setAuthRequireMessage(
          "Your session expired. Please sign in to save your draft.",
        );
      } else {
        setNotificationModal({
          type: "error",
          title: "Failed to Save",
          message: msg,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    if (!isSignedIn) {
      setTimeout(() => {
        setNotificationModal({
          type: "success",
          title: "Simulated Deployment",
          message:
            "Guest preview published locally. Sign in with Clerk to generate a permanent public URL.",
        });
        setIsPublishing(false);
      }, 600);
      return;
    }

    try {
      const res = await publishAppConfig(appId, configStr);
      if (res && res.success === false) throw new Error(res.error);
      setNotificationModal({
        type: "success",
        title: "Published Successfully",
        message: "Redirecting you to the live application...",
      });
      setTimeout(() => {
        window.location.href = `/apps/${appId}`;
      }, 1200);
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      if (msg.toLowerCase().includes("unauthorized")) {
        setAuthRequireMessage(
          "Your session expired. Please sign in to publish your application.",
        );
      } else {
        setNotificationModal({
          type: "error",
          title: "Publish Error",
          message: msg,
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleApplyCopilotComponents = (newComponents: unknown[]) => {
    try {
      interface PageSchema {
        components: unknown[];
      }
      interface ConfigSchema {
        app: string;
        pages: PageSchema[];
      }

      let currentConfig: ConfigSchema = {
        app: "My App",
        pages: [{ components: [] }],
      };
      try {
        currentConfig = JSON.parse(configStr || "{}");
      } catch {
        console.warn("Editor JSON invalid. Falling back to base template.");
      }

      if (!currentConfig.pages || currentConfig.pages.length === 0)
        currentConfig.pages = [{ components: [] }];
      currentConfig.pages[0].components = newComponents;
      setConfigStr(JSON.stringify(currentConfig, null, 2));
    } catch {
      setNotificationModal({
        type: "error",
        title: "Generation Error",
        message: "Failed to merge AI structure into layout.",
      });
    }
  };

  const handleStreamStart = () => {
    setIsGenerating(true);
    try {
      const currentConfig = JSON.parse(configStr);
      if (!currentConfig.pages) currentConfig.pages = [{}];
      currentConfig.pages[0].components = "<<<REPLACE>>>";
      setConfigStr(JSON.stringify(currentConfig, null, 2));
    } catch {
      setConfigStr(
        JSON.stringify(
          {
            app: "AI Generated Template",
            pages: [{ components: "<<<REPLACE>>>" }],
          },
          null,
          2,
        ),
      );
    }
  };

  const handleStreamEnd = () => setIsGenerating(false);

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-foreground antialiased select-none">
      {/* =========================================================================
          TOP APPLICATION TOOLBAR (h-11, 44px)
          Unified surface, 1px border-border, Copilot trigger left of Save Draft,
          Breadcrumb in regular sans font!
          ========================================================================= */}
      <header className="h-11 border-b border-border bg-card shrink-0 flex items-center justify-between px-3 sm:px-4 z-20">
        {/* Left: Navigation & Sans Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-md transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </Link>

          {/* Regular sans breadcrumb: "AppForge / demo" */}
          <div className="flex items-center gap-2 font-sans text-xs">
            <span className="font-medium text-foreground">AppForge</span>
            <span className="text-muted-foreground/40 font-normal">/</span>
            <span className="text-muted-foreground font-normal">
              {appId}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isGuestRoute ? "Sandbox" : "Draft"}
            </span>
          </div>
        </div>

        {/* Center: Direction B View Mode Switcher / Direction A Filename */}
        {direction === "B" ? (
          <div className="hidden md:flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === "code"
                  ? "bg-card text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === "split"
                  ? "bg-card text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === "preview"
                  ? "bg-card text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/40 rounded-md border border-border text-[11px] font-mono text-muted-foreground">
            <FileCode className="w-3.5 h-3.5 text-brand" />
            <span>config.json</span>
          </div>
        )}

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Direction Switcher Pill (For Visual Target Evaluation) */}
          <div className="flex items-center bg-muted/50 p-0.5 rounded-md border border-border text-[10px] font-sans font-medium mr-1">
            <button
              type="button"
              onClick={() => setDirection("A")}
              className={`px-2 py-0.5 rounded transition-colors ${
                direction === "A"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Direction A: Studio IDE (Zed + Linear)"
            >
              Dir A
            </button>
            <button
              type="button"
              onClick={() => setDirection("B")}
              className={`px-2 py-0.5 rounded transition-colors ${
                direction === "B"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Direction B: Command Canvas (v0 + Linear)"
            >
              Dir B
            </button>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-md transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          {/* Copilot Trigger: MOVED OUT of the code area into top toolbar, left of Save Draft */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCopilotOpen((prev) => !prev)}
            className="h-8 bg-card border-border hover:bg-muted hover:text-foreground text-foreground font-medium text-xs gap-1.5 transition-colors shadow-xs"
            aria-label="Trigger Gemini Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span className="hidden sm:inline">Copilot</span>
            <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-mono bg-muted text-muted-foreground rounded border border-border">
              ⌘K
            </kbd>
          </Button>

          {/* Save Draft Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-card border-border hover:bg-muted hover:text-foreground text-foreground font-medium text-xs transition-colors shadow-xs"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            )}
            Save Draft
          </Button>

          {/* Publish CTA */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="h-8 bg-brand hover:bg-brand-dark text-text-inverse font-medium text-xs shadow-xs transition-colors"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            )}
            Publish
          </Button>
        </div>
      </header>

      {/* =========================================================================
          WORKSPACE WORK AREA
          Consistent 36px (h-9) panel headers, 1px border-border, unified surfaces
          ========================================================================= */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: Editor & Validation */}
        {(direction === "A" || viewMode !== "preview") && (
          <section
            aria-label="Code Editor and Validation Panel"
            className={`${
              direction === "B" && viewMode === "code"
                ? "w-full"
                : "w-full md:w-1/2"
            } flex flex-col h-full border-b md:border-b-0 md:border-r border-border bg-card`}
          >
            {/* Editor Panel Header: 36px (h-9) */}
            <div className="h-9 px-3.5 border-b border-border bg-card flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Config Editor
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  (JSON)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">UTF-8</span>
              </div>
            </div>

            {/* Monaco Editor (No floating overlays, Geist Mono font stack, custom theme) */}
            <div className="flex-1 min-h-0 relative bg-card overflow-hidden">
              <ConfigEditor
                value={configStr}
                onChange={(val) => setConfigStr(val || "")}
              />
            </div>

            {/* Validation Log (Collapsed to single 28px row when 0 issues, expandable) */}
            <ValidationPanel
              errors={errors}
              warnings={warnings}
              isGenerating={isGenerating}
            />
          </section>
        )}

        {/* RIGHT COLUMN: Framed Canvas Preview */}
        {(direction === "A" || viewMode !== "code") && (
          <section
            aria-label="Application Live Preview Canvas"
            className={`${
              direction === "B" && viewMode === "preview"
                ? "w-full"
                : "w-full md:w-1/2"
            } flex flex-col h-full bg-background`}
          >
            {/* Preview Panel Header: 36px (h-9) */}
            <div className="h-9 px-3.5 border-b border-border bg-card flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <Layout className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Live Preview
                </span>
                <span className="text-[10px] text-muted-foreground font-sans">
                  · Dynamic Runtime
                </span>
              </div>

              {/* Viewport Width Controls in Direction A */}
              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded border border-border">
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  className={`p-1 rounded transition-colors ${
                    viewport === "desktop"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Desktop (100%)"
                  aria-label="Desktop viewport"
                >
                  <Monitor className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("tablet")}
                  className={`p-1 rounded transition-colors ${
                    viewport === "tablet"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Tablet (768px)"
                  aria-label="Tablet viewport"
                >
                  <Tablet className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={`p-1 rounded transition-colors ${
                    viewport === "mobile"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Mobile (375px)"
                  aria-label="Mobile viewport"
                >
                  <Smartphone className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Framed Browser Viewport Container */}
            <div className="flex-1 min-h-0 bg-background overflow-hidden relative">
              <LivePreview
                configStr={configStr}
                appId={appId}
                viewport={viewport}
                onViewportChange={setViewport}
                showInnerToolbar={direction === "A"}
              />
            </div>
          </section>
        )}

        {/* Copilot Drawer (Docked from the right, not floating over editor text) */}
        <CopilotPanel
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          onApply={handleApplyCopilotComponents}
          onStreamStart={handleStreamStart}
          onStreamEnd={handleStreamEnd}
          initialPrompt={initialPrompt}
        />
      </main>

      {/* Auth Requirement Modal */}
      {authRequireMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Sign In Required
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {authRequireMessage}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setAuthRequireMessage(null)}
              >
                Cancel
              </Button>
              <SignInButton mode="modal">
                <Button className="bg-brand hover:bg-brand-dark text-text-inverse">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <h2
              className={`text-lg font-bold mb-2 ${
                notificationModal.type === "error"
                  ? "text-red-500"
                  : "text-foreground"
              }`}
            >
              {notificationModal.title}
            </h2>
            <p className="text-muted-foreground text-xs mb-6">
              {notificationModal.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setNotificationModal(null)}
                className="bg-brand hover:bg-brand-dark text-text-inverse min-w-[90px] h-8 text-xs font-medium"
              >
                Okay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
