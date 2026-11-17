"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  Sun,
  Moon,
  FileCode,
  Layout,
  Monitor,
  Tablet,
  Smartphone,
  PanelLeftClose,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { getAppConfig, saveAppConfig, publishAppConfig } from "@/actions/apps";

const DEFAULT_COPILOT_WIDTH = 360;
const DEFAULT_EDITOR_WIDTH = 420;
const MIN_COPILOT_WIDTH = 300;
const MIN_EDITOR_WIDTH = 320;
const MIN_PREVIEW_WIDTH = 400;
const RAIL_WIDTH = 38;

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

  const copilotInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Remember collapsed / open states per browser wrapped in try/catch (default open)
  const [isCopilotCollapsed, setIsCopilotCollapsed] = useState<boolean>(() => {
    if (copilotQuery === "closed") return true;
    if (copilotQuery === "open" || initialPrompt) return false;
    try {
      const saved = localStorage.getItem("appforge_copilot_collapsed");
      if (saved !== null) return saved === "true";
    } catch {}
    return false; // Open by default
  });

  useEffect(() => {
    if (themeQuery === "dark" || themeQuery === "light") {
      setTheme(themeQuery);
    }
  }, [themeQuery, setTheme]);

  useEffect(() => {
    if (copilotQuery === "closed") {
      setIsCopilotCollapsed(true);
    } else if (copilotQuery === "open") {
      setIsCopilotCollapsed(false);
    }
  }, [copilotQuery]);

  const [isEditorCollapsed, setIsEditorCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("appforge_editor_collapsed");
      if (saved !== null) return saved === "true";
    } catch {}
    return false;
  });

  // Remember pane widths in localStorage
  const [copilotWidth, setCopilotWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("appforge_copilot_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_COPILOT_WIDTH) return parsed;
      }
    } catch {}
    return DEFAULT_COPILOT_WIDTH;
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

  // Dragging active state
  const [activeDrag, setActiveDrag] = useState<"copilot" | "editor" | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("appforge_copilot_collapsed", String(isCopilotCollapsed));
    } catch {}
  }, [isCopilotCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem("appforge_editor_collapsed", String(isEditorCollapsed));
    } catch {}
  }, [isEditorCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem("appforge_copilot_width", String(copilotWidth));
    } catch {}
  }, [copilotWidth]);

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

  // ⌘K / Ctrl+K keyboard shortcut toggles/focuses Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const activeEl = document.activeElement;
        // Keep editor-focus exception if user is actively typing inside Monaco
        if (activeEl?.closest(".monaco-editor")) {
          return;
        }

        e.preventDefault();
        setIsCopilotCollapsed(false);
        setTimeout(() => copilotInputRef.current?.focus(), 60);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleCopilot = useCallback(() => {
    setIsCopilotCollapsed((prev) => {
      const next = !prev;
      if (!next) {
        setTimeout(() => copilotInputRef.current?.focus(), 60);
      }
      return next;
    });
  }, []);

  // Window mousemove / mouseup handlers for divider dragging
  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;

      if (activeDrag === "copilot") {
        const relativeX = e.clientX - rect.left;
        const editorOccupied = isEditorCollapsed ? RAIL_WIDTH : editorWidth;
        const maxCopilot = containerWidth - editorOccupied - MIN_PREVIEW_WIDTH - 12;
        const boundedWidth = Math.max(
          MIN_COPILOT_WIDTH,
          Math.min(Math.max(MIN_COPILOT_WIDTH, maxCopilot), relativeX),
        );
        setCopilotWidth(Math.round(boundedWidth));
      } else if (activeDrag === "editor") {
        const copilotOccupied = isCopilotCollapsed ? RAIL_WIDTH : copilotWidth;
        const editorTarget = e.clientX - rect.left - copilotOccupied - 6;
        const maxEditor = containerWidth - copilotOccupied - MIN_PREVIEW_WIDTH - 12;
        const boundedWidth = Math.max(
          MIN_EDITOR_WIDTH,
          Math.min(Math.max(MIN_EDITOR_WIDTH, maxEditor), editorTarget),
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
  }, [activeDrag, copilotWidth, editorWidth, isCopilotCollapsed, isEditorCollapsed]);

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
          TOP APPLICATION TOOLBAR (h-11, 44px)
          Sans breadcrumb with App Name, Copilot ⌘K toggle, Save, Publish
          ========================================================================= */}
      <header className="h-11 border-b border-border bg-card shrink-0 flex items-center justify-between px-3 sm:px-4 z-20">
        {/* Left: Navigation & Sans Breadcrumb with App Name */}
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

          {/* Breadcrumb shows app's name, not UUID */}
          <div className="flex items-center gap-2 font-sans text-xs">
            <span className="font-medium text-foreground">AppForge</span>
            <span className="text-muted-foreground/40 font-normal">/</span>
            <span
              className="text-muted-foreground font-normal truncate max-w-[180px] sm:max-w-[280px]"
              title={appName}
            >
              {appName}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-1.5 px-2 py-0.5 rounded-full text-[13px] font-medium bg-muted text-muted-foreground border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
              {isGuestRoute ? "Sandbox" : "Draft"}
            </span>
          </div>
        </div>

        {/* Center: File indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted/40 rounded-md border border-border text-[13px] font-mono text-muted-foreground">
          <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
          <span>config.json</span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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

          {/* Header "Copilot ⌘K" toggle button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleCopilot}
            className={`h-8 px-2.5 border-border hover:bg-muted text-foreground font-medium text-xs gap-1.5 transition-colors shadow-xs ${
              !isCopilotCollapsed ? "bg-muted font-semibold" : "bg-card"
            }`}
            aria-label="Toggle Copilot panel"
            aria-expanded={!isCopilotCollapsed}
          >
            <span>Copilot</span>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-muted-foreground/10 text-muted-foreground rounded border border-border">
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

          {/* Publish CTA: Solid fill, clearly enabled, AA label contrast */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="h-8 bg-brand hover:bg-brand-dark text-text-inverse font-medium text-xs shadow-xs transition-colors disabled:bg-muted disabled:text-muted-foreground/50 disabled:border disabled:border-border"
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
          Three resizable panes: Copilot (left) | Config editor | Preview (right)
          ========================================================================= */}
      <main
        ref={containerRef}
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative"
      >
        {/* PANE 1: COPILOT (LEFT) - primary entry point, open by default */}
        <CopilotPanel
          isCollapsed={isCopilotCollapsed}
          onToggleCollapse={() => setIsCopilotCollapsed((prev) => !prev)}
          width={copilotWidth}
          onApply={handleApplyCopilotComponents}
          onStreamStart={handleStreamStart}
          onStreamEnd={handleStreamEnd}
          initialPrompt={initialPrompt}
          inputRef={copilotInputRef}
        />

        {/* DIVIDER 1: Between Copilot and Editor */}
        {!isCopilotCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(copilotWidth)}
            aria-valuemin={MIN_COPILOT_WIDTH}
            aria-valuemax={800}
            aria-label="Resize Copilot panel"
            tabIndex={0}
            onMouseDown={() => setActiveDrag("copilot")}
            onDoubleClick={() => setCopilotWidth(DEFAULT_COPILOT_WIDTH)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setCopilotWidth((w) => Math.max(MIN_COPILOT_WIDTH, w - 10));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setCopilotWidth((w) => w + 10);
              } else if (e.key === "Home" || e.key === "Enter") {
                e.preventDefault();
                setCopilotWidth(DEFAULT_COPILOT_WIDTH);
              }
            }}
            className={`relative w-[6px] -mx-[3px] h-full cursor-col-resize z-30 shrink-0 group outline-none select-none transition-colors ${
              activeDrag === "copilot"
                ? "bg-brand/30"
                : "hover:bg-brand/20 focus-visible:bg-brand/30"
            }`}
            title="Drag to resize, double-click to reset, arrow keys to adjust"
          >
            <div
              className={`absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-150 ${
                activeDrag === "copilot"
                  ? "bg-brand w-[3px]"
                  : "bg-transparent group-hover:bg-brand/70 group-focus-visible:bg-brand w-[2px]"
              }`}
            />
          </div>
        )}

        {/* PANE 2: CONFIG EDITOR (MIDDLE) */}
        {isEditorCollapsed ? (
          <aside
            style={{ width: `${RAIL_WIDTH}px` }}
            className="h-full border-r border-border bg-card flex flex-col items-center py-2.5 shrink-0 cursor-pointer hover:bg-muted/40 transition-colors group select-none"
            onClick={() => setIsEditorCollapsed(false)}
            title="Expand Config Editor"
            role="region"
            aria-label="Config editor rail"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditorCollapsed(false);
              }}
              className="p-1 rounded-md text-muted-foreground group-hover:text-foreground hover:bg-muted transition-colors mb-3"
              aria-label="Expand Config Editor"
            >
              <FileCode className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-medium text-muted-foreground group-hover:text-foreground tracking-wider select-none">
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
            {/* Editor Panel Header: 36px (h-9) */}
            <div className="h-9 px-3.5 border-b border-border bg-card flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Config
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorCollapsed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                aria-label="Collapse Config Editor to slim rail"
                title="Collapse to slim rail"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Monaco Editor (automaticLayout: true) */}
            <div className="flex-1 min-h-0 relative bg-card overflow-hidden">
              <ConfigEditor
                value={configStr}
                onChange={(val) => setConfigStr(val || "")}
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

        {/* DIVIDER 2: Between Editor and Preview */}
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

        {/* PANE 3: PREVIEW (RIGHT) - fills remaining space, min 400px */}
        <section
          aria-label="Application Live Preview Canvas"
          className="flex-1 min-w-[400px] flex flex-col h-full bg-background overflow-hidden"
          role="region"
        >
          {/* Preview Panel Header: 36px (h-9) with device viewport toggles */}
          <div className="h-9 px-3.5 border-b border-border bg-card flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Layout className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                Preview
              </span>
            </div>

            {/* Viewport Width Controls in preview panel header */}
            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded border border-border">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`p-1 rounded transition-colors ${
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
                className={`p-1 rounded transition-colors ${
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
                className={`p-1 rounded transition-colors ${
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

          {/* Framed Browser Viewport Container */}
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
                  ? "text-destructive"
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
