"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ConfigEditor } from "@/components/builder/ConfigEditor";
import { CopilotFloatingPill } from "@/components/builder/CopilotFloatingPill";
import { LivePreview } from "@/components/builder/LivePreview";
import { ValidationPanel } from "@/components/builder/ValidationPanel";
import { validateConfig } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { StatusPill } from "@/components/ui/status-pill";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Kbd } from "@/components/ui/kbd";
import {
  ArrowLeft,
  Save,
  Play,
  Loader2,
  FileCode,
  Layout,
  Monitor,
  Tablet,
  Smartphone,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { getAppConfig, saveAppConfig, publishAppConfig } from "@/actions/apps";

const DEFAULT_EDITOR_WIDTH = 460;
const MIN_EDITOR_WIDTH = 340;
const MIN_PREVIEW_WIDTH = 420;
const RAIL_WIDTH = 40;

const defaultMockConfig = JSON.stringify(
  {
    app: "Incident Command Center",
    pages: [
      {
        components: [
          {
            type: "Header",
            title: "Incident Command Center",
            subtitle:
              "Real-time service degradation alerts, active remediation runs, and edge latency telemetry.",
            size: "lg",
          },
          {
            type: "Grid",
            columns: 4,
            gap: 3,
            items: [
              {
                type: "Statistic",
                label: "Active Incidents",
                value: "2",
                trend: { value: "-3", sentiment: "positive" },
              },
              {
                type: "Statistic",
                label: "Mean Time to Recovery",
                value: "14m",
                trend: { value: "-4m", sentiment: "positive" },
              },
              {
                type: "Statistic",
                label: "Degraded Services",
                value: "1",
                trend: { value: "+1", sentiment: "negative" },
              },
              {
                type: "Statistic",
                label: "Global Uptime",
                value: "99.98%",
                trend: { value: "0.0%", sentiment: "neutral" },
              },
            ],
          },
          {
            type: "DataTable",
            columns: [
              { key: "id", label: "Incident ID", type: "id" },
              { key: "service", label: "Service", type: "text" },
              { key: "severity", label: "Severity", type: "badge" },
              { key: "status", label: "Status", type: "badge" },
              { key: "impact", label: "Impact ($)", type: "currency" },
            ],
            data: [
              {
                id: "INC-4091",
                service: "API Gateway Ingress",
                severity: "Critical",
                status: "Active",
                impact: 18200,
              },
              {
                id: "INC-4092",
                service: "Auth0 Token Relay",
                severity: "Warning",
                status: "Pending",
                impact: 4200,
              },
              {
                id: "INC-4089",
                service: "Postgres Read Replica",
                severity: "Minor",
                status: "Resolved",
                impact: 950,
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

type ViewportMode = "desktop" | "tablet" | "mobile";

export default function BuilderPage() {
  const params = useParams();
  const appId = (params?.appId as string) || "demo";
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || undefined;
  const copilotQuery = searchParams.get("copilot");
  const themeQuery = searchParams.get("theme");

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  const copilotInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Floating Copilot Pill open / collapsed state (closed by default unless prompt passed)
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(() => {
    if (copilotQuery === "open" || initialPrompt) return true;
    return false;
  });

  useEffect(() => {
    if (themeQuery === "dark" || themeQuery === "light") {
      setTheme(themeQuery);
    }
  }, [themeQuery, setTheme]);

  useEffect(() => {
    if (copilotQuery === "closed") {
      setIsCopilotOpen(false);
    } else if (copilotQuery === "open") {
      setIsCopilotOpen(true);
    }
  }, [copilotQuery]);

  const [isEditorCollapsed, setIsEditorCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("appforge_editor_collapsed");
      if (saved !== null) return saved === "true";
    } catch {}
    return false;
  });

  const [editorWidth, setEditorWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("appforge_editor_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_EDITOR_WIDTH) return parsed;
      }
    } catch {}
    return DEFAULT_EDITOR_WIDTH;
  });

  // Dragging active state for editor/preview divider
  const [activeDrag, setActiveDrag] = useState<"editor" | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("appforge_editor_collapsed", String(isEditorCollapsed));
    } catch {}
  }, [isEditorCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem("appforge_editor_width", String(editorWidth));
    } catch {}
  }, [editorWidth]);

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
                      title: "Sarah Jenkins",
                      subtitle: "Product Lead",
                      footer: [{ type: "ButtonAction", label: "View Profile" }],
                    },
                    {
                      type: "Card",
                      title: "Alex Thorne",
                      subtitle: "Staff Engineer",
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

  // App Name for breadcrumb
  const appName = useMemo(() => {
    try {
      const parsed = JSON.parse(configStr);
      if (parsed && typeof parsed.app === "string" && parsed.app.trim()) {
        return parsed.app.trim();
      }
    } catch {}
    return appId;
  }, [configStr, appId]);

  const { errors, warnings } = useMemo(
    () => validateConfig(configStr),
    [configStr],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
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

  // ⌘K / Ctrl+K keyboard shortcut toggles/focuses floating Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsEditorCollapsed(false);
        setIsCopilotOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => copilotInputRef.current?.focus(), 80);
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleCopilot = useCallback(() => {
    setIsCopilotOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsEditorCollapsed(false);
        setTimeout(() => copilotInputRef.current?.focus(), 80);
      }
      return next;
    });
  }, []);

  // Window mousemove / mouseup handlers for divider dragging (Editor vs Preview)
  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;

      if (activeDrag === "editor") {
        const relativeX = e.clientX - rect.left;
        const maxEditor = containerWidth - MIN_PREVIEW_WIDTH - 12;
        const boundedWidth = Math.max(
          MIN_EDITOR_WIDTH,
          Math.min(maxEditor, relativeX),
        );
        setEditorWidth(Math.round(boundedWidth));
      }
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, [activeDrag, editorWidth]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveAppConfig(appId, configStr);
      if (!res.success) {
        if (res.error?.toLowerCase().includes("unauthorized")) {
          setAuthRequireMessage(
            "Please sign in to save your application to your personal account.",
          );
        } else {
          setNotificationModal({
            type: "error",
            title: "Saving Failed",
            message: res.error || "Could not save your configuration.",
          });
        }
      } else {
        setNotificationModal({
          type: "success",
          title: "Draft Saved",
          message: "All configurations and AST properties are synchronized.",
        });
      }
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      if (msg.toLowerCase().includes("unauthorized")) {
        setAuthRequireMessage(
          "Your session expired. Please sign in to save your changes.",
        );
      } else {
        setNotificationModal({
          type: "error",
          title: "Network Error",
          message: msg,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await publishAppConfig(appId, configStr);
      if (!res.success) {
        if (res.error?.toLowerCase().includes("unauthorized")) {
          setAuthRequireMessage(
            "Please sign in to deploy and publish your dynamic application.",
          );
        } else {
          setNotificationModal({
            type: "error",
            title: "Deployment Error",
            message: res.error || "Failed to publish app runtime.",
          });
        }
      } else {
        setNotificationModal({
          type: "success",
          title: "App Published!",
          message:
            "Your application has been deployed live with updated schema routes.",
        });
      }
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
          TOP APPLICATION TOOLBAR (h-14, 56px) - Glass top bar
          Sans breadcrumb with App Name, Copilot ⌘K toggle, Save Draft, Publish
          ========================================================================= */}
      <header className="h-14 border-b border-border/80 dark:border-white/10 glass-1 shrink-0 flex items-center justify-between px-4 sm:px-6 z-20 transition-all">
        {/* Left: Navigation & Breadcrumb with App Name */}
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="sm"
            render={<Link href="/dashboard" />}
            aria-label="Back to dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </IconButton>

          {/* Breadcrumb shows app's name, not UUID */}
          <div className="flex items-center gap-2 font-sans text-[13px]">
            <span className="font-medium text-foreground">AppForge</span>
            <span className="text-muted-foreground/40 font-normal">/</span>
            <span
              className="text-muted-foreground font-normal truncate max-w-[180px] sm:max-w-[280px]"
              title={appName}
            >
              {appName}
            </span>
            <StatusPill variant="neutral" className="hidden sm:inline-flex ml-1">
              {isGuestRoute ? "Sandbox" : "Draft"}
            </StatusPill>
          </div>
        </div>

        {/* Center: File indicator in glass pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full glass-2-nested text-[13px] font-mono text-muted-foreground">
          <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
          <span>config.json</span>
        </div>

        {/* Right Toolbar Actions: ThemeToggle, Copilot ⌘K, Save Draft, Publish */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Neutral Glass Circle Theme Toggle */}
          <ThemeToggle />

          {/* Header "Copilot ⌘K" toggle button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleCopilot}
            className="gap-1.5"
            aria-label="Toggle Copilot pill"
            aria-expanded={isCopilotOpen}
            data-copilot-toggle
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Copilot</span>
            <Kbd>⌘K</Kbd>
          </Button>

          {/* Save Draft Button (secondary frosted pill) */}
          <Button
            variant="secondary"
            size="sm"
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

          {/* Publish CTA: Primary pill button */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            variant="primary"
            size="sm"
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
          Two resizable panes taking full width: Config editor (left) | Preview (right)
          Copilot floating chat pill anchored at bottom-right corner of Monaco pane
          ========================================================================= */}
      <main
        ref={containerRef}
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative"
      >
        {/* PANE 1: CONFIG EDITOR (LEFT) */}
        {isEditorCollapsed ? (
          <aside
            style={{ width: `${RAIL_WIDTH}px` }}
            className="h-full border-r border-border bg-card flex flex-col items-center py-2.5 shrink-0 cursor-pointer hover:bg-muted/40 transition-colors group select-none"
            onClick={() => setIsEditorCollapsed(false)}
            title="Expand Config Editor"
            role="region"
            aria-label="Config editor rail"
          >
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditorCollapsed(false);
              }}
              className="mb-3 text-muted-foreground group-hover:text-foreground"
              aria-label="Expand Config Editor"
            >
              <FileCode className="w-4 h-4" />
            </IconButton>
            <div className="flex-1 flex items-center justify-center">
              <span className="[writing-mode:vertical-lr] rotate-180 text-[12px] font-medium text-muted-foreground group-hover:text-foreground tracking-wider select-none">
                Config
              </span>
            </div>
          </aside>
        ) : (
          <section
            style={{ width: `${editorWidth}px` }}
            aria-label="Code Editor and Validation Panel"
            className="h-full flex flex-col border-r border-border bg-card shrink-0 min-w-[320px] overflow-hidden"
            role="region"
          >
            {/* Editor Panel Header: 36px (h-9) consistent with Preview header */}
            <div className="h-9 px-4 border-b border-border bg-card flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[13px] font-medium text-foreground">
                  Config
                </span>
              </div>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorCollapsed(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Collapse Config Editor to slim rail"
                title="Collapse to slim rail"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </IconButton>
            </div>

            {/* Monaco Editor (automaticLayout: true) */}
            <div className="flex-1 min-h-0 relative bg-card overflow-hidden">
              <ConfigEditor
                value={configStr}
                onChange={(val) => setConfigStr(val || "")}
              />
              {/* Floating Copilot Chat Pill anchored at bottom-right corner of Monaco editor pane */}
              <CopilotFloatingPill
                isOpen={isCopilotOpen}
                onOpenChange={setIsCopilotOpen}
                onApply={handleApplyCopilotComponents}
                onStreamStart={handleStreamStart}
                onStreamEnd={handleStreamEnd}
                initialPrompt={initialPrompt}
                externalInputRef={copilotInputRef}
              />
            </div>

            {/* Validation Log */}
            <ValidationPanel
              errors={errors}
              warnings={warnings}
              isGenerating={isGenerating}
            />
          </section>
        )}

        {/* DIVIDER: Between Editor and Preview */}
        {!isEditorCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(editorWidth)}
            aria-valuemin={MIN_EDITOR_WIDTH}
            aria-valuemax={1000}
            aria-label="Resize Config Editor panel"
            tabIndex={0}
            onMouseDown={() => setActiveDrag("editor")}
            onDoubleClick={() => setEditorWidth(DEFAULT_EDITOR_WIDTH)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setEditorWidth((w) => Math.max(MIN_EDITOR_WIDTH, w - 10));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setEditorWidth((w) => w + 10);
              } else if (e.key === "Home" || e.key === "Enter") {
                e.preventDefault();
                setEditorWidth(DEFAULT_EDITOR_WIDTH);
              }
            }}
            className={`relative w-[6px] -mx-[3px] h-full cursor-col-resize z-30 shrink-0 group outline-none select-none transition-colors ${
              activeDrag === "editor"
                ? "bg-brand/30"
                : "hover:bg-brand/20 focus-visible:bg-brand/30"
            }`}
            title="Drag to resize, double-click to reset, arrow keys to adjust"
          >
            <div
              className={`absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-150 ${
                activeDrag === "editor"
                  ? "bg-brand w-[3px]"
                  : "bg-transparent group-hover:bg-brand/70 group-focus-visible:bg-brand w-[2px]"
              }`}
            />
          </div>
        )}

        {/* PANE 2: PREVIEW (RIGHT) - fills remaining space, sits on solid surface */}
        <section
          aria-label="Application Live Preview Canvas"
          className="flex-1 min-w-[400px] flex flex-col h-full bg-background overflow-hidden"
          role="region"
        >
          {/* Preview Panel Header: 36px (h-9) consistent with Editor header */}
          <div className="h-9 px-4 border-b border-border bg-card flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Layout className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[13px] font-medium text-foreground">
                Preview
              </span>
            </div>

            {/* Viewport Width Controls in preview panel header */}
            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-full border border-border">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`p-1 rounded-full transition-colors ${
                  viewport === "desktop"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Desktop"
                aria-label="Desktop viewport"
              >
                <Monitor className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("tablet")}
                className={`p-1 rounded-full transition-colors ${
                  viewport === "tablet"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tablet"
                aria-label="Tablet viewport"
              >
                <Tablet className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`p-1 rounded-full transition-colors ${
                  viewport === "mobile"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Mobile"
                aria-label="Mobile viewport"
              >
                <Smartphone className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Framed Browser Viewport Container on solid surface */}
          <div className="flex-1 min-h-0 bg-background overflow-hidden relative">
            <LivePreview
              configStr={configStr}
              appId={appId}
              viewport={viewport}
              onViewportChange={setViewport}
              showInnerToolbar={true}
            />
          </div>
        </section>
      </main>

      {/* Auth Requirement Modal */}
      {authRequireMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <h2 className="text-[17px] font-semibold text-foreground mb-2">
              Sign In Required
            </h2>
            <p className="text-muted-foreground text-[13px] mb-6">
              {authRequireMessage}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setAuthRequireMessage(null)}
              >
                Cancel
              </Button>
              <SignInButton mode="modal">
                <Button variant="primary" size="md">
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
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <h2
              className={`text-[17px] font-semibold mb-2 ${
                notificationModal.type === "error"
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {notificationModal.title}
            </h2>
            <p className="text-muted-foreground text-[13px] mb-6">
              {notificationModal.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setNotificationModal(null)}
                className="min-w-[90px]"
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
