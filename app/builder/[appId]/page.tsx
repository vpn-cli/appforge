"use client";

import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
  Suspense,
} from "react";
import { AppForgeLogo } from "@/components/ui/appforge-logo";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
import { motion, AnimatePresence } from "motion/react";
import { MOTION_TOKENS } from "@/lib/motion-tokens";
import {
  ArrowLeft,
  Save,
  Play,
  Check,
  Loader2,
  FileCode,
  Layout,
  Monitor,
  Tablet,
  Smartphone,
  PanelLeftClose,
  Sparkles,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { getAppConfig, saveAppConfig, publishAppConfig } from "@/actions/apps";
import { TEMPLATES_DATA } from "@/lib/templates-data";

const DEFAULT_EDITOR_WIDTH = 460;
const MIN_EDITOR_WIDTH = 340;
const MIN_PREVIEW_WIDTH = 420;
const RAIL_WIDTH = 40;
const EDITOR_COLLAPSED_KEY = "appforge_editor_collapsed";
const EDITOR_WIDTH_KEY = "appforge_editor_width";

const layoutListeners = new Set<() => void>();
let inMemoryEditorCollapsed: boolean | null = null;
let inMemoryEditorWidth: number | null = null;

function emitLayoutChange() {
  layoutListeners.forEach((listener) => listener());
}

function subscribeLayoutPrefs(listener: () => void) {
  layoutListeners.add(listener);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === EDITOR_COLLAPSED_KEY) {
      inMemoryEditorCollapsed = null;
      listener();
    } else if (e.key === EDITOR_WIDTH_KEY) {
      inMemoryEditorWidth = null;
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    layoutListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getEditorCollapsedSnapshot(): boolean {
  if (inMemoryEditorCollapsed !== null) return inMemoryEditorCollapsed;
  try {
    const saved = localStorage.getItem(EDITOR_COLLAPSED_KEY);
    if (saved !== null) return saved === "true";
  } catch { }
  return false;
}

function getEditorCollapsedServerSnapshot(): boolean {
  return false;
}

function getEditorWidthSnapshot(): number {
  if (inMemoryEditorWidth !== null) return inMemoryEditorWidth;
  try {
    const saved = localStorage.getItem(EDITOR_WIDTH_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_EDITOR_WIDTH) return parsed;
    }
  } catch { }
  return DEFAULT_EDITOR_WIDTH;
}

function getEditorWidthServerSnapshot(): number {
  return DEFAULT_EDITOR_WIDTH;
}

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

function BuilderContent() {
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

  const isEditorCollapsed = useSyncExternalStore(
    subscribeLayoutPrefs,
    getEditorCollapsedSnapshot,
    getEditorCollapsedServerSnapshot,
  );

  const editorWidth = useSyncExternalStore(
    subscribeLayoutPrefs,
    getEditorWidthSnapshot,
    getEditorWidthServerSnapshot,
  );

  const setIsEditorCollapsed = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next =
        typeof value === "function"
          ? value(getEditorCollapsedSnapshot())
          : value;
      inMemoryEditorCollapsed = next;
      try {
        localStorage.setItem(EDITOR_COLLAPSED_KEY, String(next));
      } catch { }
      emitLayoutChange();
    },
    [],
  );

  const setEditorWidth = useCallback(
    (value: number | ((prev: number) => number)) => {
      const next =
        typeof value === "function" ? value(getEditorWidthSnapshot()) : value;
      inMemoryEditorWidth = next;
      try {
        localStorage.setItem(EDITOR_WIDTH_KEY, String(next));
      } catch { }
      emitLayoutChange();
    },
    [],
  );

  // Dragging active state for editor/preview divider & panel sizes
  const BUILDER_PANEL_SIZES_KEY = "appforge_builder_panel_sizes";
  const DEFAULT_EDITOR_PANEL_SIZE = 42;

  const editorPanelRef = useRef<ImperativePanelHandle>(null);
  const [isHandleDragging, setIsHandleDragging] = useState(false);
  const [panelSizes, setPanelSizes] = useState<number[]>(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem(BUILDER_PANEL_SIZES_KEY)
          : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 2 &&
          typeof parsed[0] === "number"
        ) {
          return parsed;
        }
      }
    } catch { }
    return [DEFAULT_EDITOR_PANEL_SIZE, 100 - DEFAULT_EDITOR_PANEL_SIZE];
  });

  const handlePanelLayout = useCallback((sizes: number[]) => {
    setPanelSizes(sizes);
    try {
      localStorage.setItem(BUILDER_PANEL_SIZES_KEY, JSON.stringify(sizes));
    } catch { }
  }, []);

  const handleDraggingChange = useCallback((dragging: boolean) => {
    setIsHandleDragging(dragging);
    if (dragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    }
  }, []);

  const handleResetPanels = useCallback(() => {
    editorPanelRef.current?.resize(DEFAULT_EDITOR_PANEL_SIZE);
    try {
      localStorage.setItem(
        BUILDER_PANEL_SIZES_KEY,
        JSON.stringify([
          DEFAULT_EDITOR_PANEL_SIZE,
          100 - DEFAULT_EDITOR_PANEL_SIZE,
        ]),
      );
    } catch { }
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  const { isSignedIn } = useAuth();
  const isGuestRoute =
    appId === "demo" || appId.startsWith("template-") || appId === "mock-new-id";

  const [configStr, setConfigStr] = useState(() => {
    const templateParam = searchParams.get("template");
    const matchedTemplate = TEMPLATES_DATA.find(
      (t) => t.id === templateParam || appId === `template-${t.id}` || appId === t.id
    );
    if (matchedTemplate) {
      return JSON.stringify(matchedTemplate.config, null, 2);
    }
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
    } catch { }
    return appId;
  }, [configStr, appId]);

  const { errors, warnings } = useMemo(
    () => validateConfig(configStr),
    [configStr],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published">("idle");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
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
            setTimeout(() => copilotInputRef.current?.focus(), 280);
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsEditorCollapsed]);

  useEffect(() => {
    if (!showPublishDialog) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPublishing) {
        setShowPublishDialog(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showPublishDialog, isPublishing]);

  const handleToggleCopilot = useCallback(() => {
    setIsCopilotOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsEditorCollapsed(false);
        setTimeout(() => copilotInputRef.current?.focus(), 280);
      }
      return next;
    });
  }, [setIsEditorCollapsed]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState("saving");
    try {
      const res = await saveAppConfig(appId, configStr);
      if (!res.success) {
        setSaveState("idle");
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
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
        setNotificationModal({
          type: "success",
          title: "Draft Saved",
          message: "All configurations and AST properties are synchronized.",
        });
      }
    } catch (e: unknown) {
      setSaveState("idle");
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
    setPublishState("publishing");
    try {
      const res = await publishAppConfig(appId, configStr);
      if (!res.success) {
        setPublishState("idle");
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
        setPublishState("published");
        setTimeout(() => setPublishState("idle"), 2000);
        setNotificationModal({
          type: "success",
          title: "App Published!",
          message:
            "Your application is now live. Anyone with the link can view this app and its data.",
        });
      }
    } catch (e: unknown) {
      setPublishState("idle");
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
      setShowPublishDialog(false);
    }
  };

  const handleApplyCopilotComponents = (
    newComponents: unknown[],
    newAppName?: string,
  ) => {
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

      // Sync the "app" field: either use explicit newAppName or infer from Header component
      let appTitleToUse = newAppName?.trim();
      if (!appTitleToUse && Array.isArray(newComponents)) {
        const headerComp = newComponents.find(
          (c) =>
            c &&
            typeof c === "object" &&
            (c as Record<string, unknown>).type === "Header" &&
            typeof (c as Record<string, unknown>).title === "string",
        ) as { title?: string } | undefined;
        if (headerComp?.title && headerComp.title.trim()) {
          appTitleToUse = headerComp.title.trim();
        }
      }

      if (appTitleToUse) {
        currentConfig.app = appTitleToUse;
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
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-foreground antialiased select-none relative">
      {/* Background treatment: STATIC frame of the mesh gradient at ~60% intensity. No WebGL animation in builder */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none hero-mesh-fallback opacity-60"
      />
      {/* =========================================================================
          TOP APPLICATION TOOLBAR (h-14, 56px) - Glass top bar
          Sans breadcrumb with App Name, Copilot ⌘K toggle, Save Draft, Publish
          ========================================================================= */}
      <header className="h-14 border-b border-border glass-1 shrink-0 flex items-center justify-between px-4 sm:px-6 z-20 transition-all">
        {/* Left: Navigation & Breadcrumb with App Name */}
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="sm"
            render={<Link href="/apps" />}
            aria-label="Back to apps"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </IconButton>

          {/* Breadcrumb shows AppForge logo mark tile + app's name */}
          <div className="flex items-center gap-2 font-sans text-[13px]">
            <Link
              href="/"
              aria-label="AppForge Home"
              className="flex items-center gap-2 outline-none group select-none shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center shadow-xs shrink-0 transition-colors">
                <AppForgeLogo size={15} className="text-background" />
              </div>
              <span className="font-medium text-foreground">AppForge</span>
            </Link>
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

          {/* Save Draft Button: dynamic state (idle → "Saving…" → "Saved", with a width spring) */}
          <motion.div layout transition={MOTION_TOKENS.springStandard}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {saveState === "saving" ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center"
                  >
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Saving…</span>
                  </motion.span>
                ) : saveState === "saved" ? (
                  <motion.span
                    key="saved"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Saved</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    <span>Save Draft</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Publish CTA: dynamic state (idle → "Publishing…" → "Published", with a width spring) */}
          <motion.div layout transition={MOTION_TOKENS.springStandard}>
            <Button
              onClick={() => {
                if (publishState === "idle") setShowPublishDialog(true);
              }}
              disabled={publishState === "publishing"}
              variant="primary"
              size="sm"
              className="overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {publishState === "publishing" ? (
                  <motion.span
                    key="publishing"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center"
                  >
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Publishing…</span>
                  </motion.span>
                ) : publishState === "published" ? (
                  <motion.span
                    key="published"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5 text-white" />
                    <span>Published</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    <span>Publish</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </header>

      {/* =========================================================================
          WORKSPACE WORK AREA
          Two resizable panes taking full width: Config editor (left) | Preview (right)
          Copilot floating chat pill anchored at bottom-right corner of Monaco pane
          ========================================================================= */}
      <main
        id="main-content"
        tabIndex={-1}
        ref={containerRef}
        className="flex-1 flex flex-col md:flex-row overflow-hidden relative outline-none"
      >
        {/* PANE 1: CONFIG EDITOR (LEFT) */}
        {isEditorCollapsed ? (
          <>
            <aside
              style={{ width: `${RAIL_WIDTH}px` }}
              className="h-full border-r border-border glass-1 flex flex-col items-center py-2.5 shrink-0 cursor-pointer hover:bg-muted/40 transition-colors group select-none"
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

            {/* PANE 2: PREVIEW (RIGHT) when editor is collapsed */}
            <section
              aria-label="Application Live Preview Canvas"
              className="flex-1 min-w-[400px] flex flex-col h-full bg-background overflow-hidden"
              role="region"
            >
              <div className="h-9 px-4 border-b border-border glass-1 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">
                    Preview
                  </span>
                </div>

                <div className="flex items-center gap-1 glass-2-nested p-0.5 rounded-full border border-border">
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    className={`p-1 rounded-full transition-colors ${viewport === "desktop"
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
                    className={`p-1 rounded-full transition-colors ${viewport === "tablet"
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
                    className={`p-1 rounded-full transition-colors ${viewport === "mobile"
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
          </>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={handlePanelLayout}
            className="flex-1 h-full w-full flex overflow-hidden"
          >
            {/* PANE 1: CONFIG EDITOR (LEFT) */}
            <ResizablePanel
              ref={editorPanelRef}
              defaultSize={panelSizes[0]}
              minSize={22}
              maxSize={70}
              id="builder-editor-panel"
              order={1}
              className="h-full flex flex-col border-r border-border bg-card shrink-0 min-w-[280px] overflow-hidden"
              role="region"
              aria-label="Code Editor and Validation Panel"
            >
              {/* Editor Panel Header: 36px (h-9) consistent with Preview header, styled with glass-1 */}
              <div className="h-9 px-4 border-b border-border glass-1 flex items-center justify-between shrink-0 select-none">
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

              {/* Monaco Editor (automaticLayout: true + ResizeObserver) */}
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
            </ResizablePanel>

            {/* RESIZABLE HANDLE with 8px hit area, 1px line, small grip, col-resize, brand hover/drag, double-click reset */}
            <ResizableHandle
              id="builder-split-handle"
              onDragging={handleDraggingChange}
              onReset={handleResetPanels}
              isDragging={isHandleDragging}
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={Math.round(panelSizes[0])}
              aria-valuemin={22}
              aria-valuemax={70}
              aria-label="Resize Config Editor and Preview panels"
              tabIndex={0}
              title="Drag to resize, double-click to reset, arrow keys to adjust"
            />

            {/* PANE 2: PREVIEW (RIGHT) - fills remaining space, sits on solid surface */}
            <ResizablePanel
              defaultSize={panelSizes[1]}
              minSize={30}
              id="builder-preview-panel"
              order={2}
              className="flex-1 min-w-[360px] flex flex-col h-full bg-background overflow-hidden"
              role="region"
              aria-label="Application Live Preview Canvas"
            >
              {/* Preview Panel Header: 36px (h-9) consistent with Editor header, styled with glass-1 */}
              <div className="h-9 px-4 border-b border-border glass-1 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">
                    Preview
                  </span>
                </div>

                {/* Viewport Width Controls in preview panel header - styled with glass-2-nested */}
                <div className="flex items-center gap-1 glass-2-nested p-0.5 rounded-full border border-border">
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    className={`p-1 rounded-full transition-colors ${viewport === "desktop"
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
                    className={`p-1 rounded-full transition-colors ${viewport === "tablet"
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
                    className={`p-1 rounded-full transition-colors ${viewport === "mobile"
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
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {/* Transparent Drag Overlay: while dragging, prevents Monaco / iframe from swallowing mouse events or hiding cursor */}
        {isHandleDragging && (
          <div
            className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent pointer-events-auto"
            aria-hidden="true"
          />
        )}
      </main>

      {/* Publish Confirmation Dialog */}
      {showPublishDialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            if (!isPublishing) setShowPublishDialog(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-dialog-title"
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 text-left animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <h2
                id="publish-dialog-title"
                className="text-[17px] font-semibold text-foreground"
              >
                Publish {appName}
              </h2>
            </div>

            <div className="rounded-xl bg-warning-light border border-warning-border text-warning-text px-3.5 py-3 text-[13px] font-medium mb-4">
              Anyone with the link can view this app and its data.
            </div>

            <p className="text-muted-foreground text-[13px] mb-5">
              Your latest configuration and entity schemas will be deployed live at{" "}
              <span className="font-mono text-foreground">/apps/{appId}</span>.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowPublishDialog(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                )}
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}

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
              className={`text-[17px] font-semibold mb-2 ${notificationModal.type === "error"
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

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-background" />}>
      <BuilderContent />
    </Suspense>
  );
}
