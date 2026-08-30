"use client";

import { useMemo, useState, useEffect } from "react";
import { ConfigEditor } from "@/components/builder/ConfigEditor";
import { CopilotPanel } from "@/components/builder/CopilotPanel";
import { LivePreview } from "@/components/builder/LivePreview";
import { ValidationPanel } from "@/components/builder/ValidationPanel";
import { validateConfig } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { getAppConfig, saveAppConfig, publishAppConfig } from "@/actions/apps";


const defaultMockConfig = JSON.stringify({
  app: "Employee Control Center",
  pages: [
    {
      components: [
        {
          type: "Header",
          title: "Operations Hub",
          subtitle: "Manage fleet logistics and security incidents globally.",
          size: "lg"
        },
        {
          type: "Grid",
          columns: 3,
          gap: 6,
          items: [
            {
              type: "Card",
              title: "System Alerts",
              subtitle: "2 unresolved issues",
              footer: [
                { type: "ButtonAction", label: "View Logs", variant: "outline", icon: "search" }
              ]
            },
            {
              type: "Card",
              title: "Active Personnel",
              subtitle: "142 onboard",
              footer: [
                { type: "ButtonAction", label: "Message All", variant: "ghost", icon: "play" }
              ]
            },
            {
              type: "Card",
              title: "Fleet Status",
              subtitle: "All units nominal",
              footer: [
                { type: "ButtonAction", label: "Run Diagnostic", variant: "secondary", icon: "arrow-right" }
              ]
            }
          ]
        }
      ]
    }
  ]
}, null, 2);

export default function BuilderPage() {
  const params = useParams();
  const appId = params.appId as string;
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const isGuestRoute = appId.startsWith("template-") || appId === "mock-new-id";
  
  const [configStr, setConfigStr] = useState(() => {
     if (appId.includes("template-blank")) {
        return JSON.stringify({ app: "Untitled Template", pages: [] }, null, 2);
     }
     if (appId.includes("template-directory")) {
        return JSON.stringify({
          app: "Employee Directory",
          pages: [{
            components: [
              { type: "Header", title: "Corporate Hierarchy", subtitle: "Internal personnel management." },
              { type: "Grid", columns: 3, items: [
                { type: "Card", title: "Vipin", subtitle: "Admin", footer: [{ type: "ButtonAction", label: "View" }] },
                { type: "Card", title: "John Doe", subtitle: "Developer", footer: [{ type: "ButtonAction", label: "View" }] }
              ]}
            ]
          }]
        }, null, 2);
     }
     return defaultMockConfig;
  });
  const { errors, warnings } = useMemo(() => validateConfig(configStr), [configStr]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authRequireMessage, setAuthRequireMessage] = useState<string | null>(null);
  const [notificationModal, setNotificationModal] = useState<{
    type: "error" | "success";
    title: string;
    message: string;
  } | null>(null);

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

  const checkGuestUsageLimit = () => {
    if (isSignedIn) return true;

    const today = new Date().toDateString();
    let limitData = { count: 0, date: today };

    try {
      const stored = window.localStorage.getItem("guest_builder_actions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          limitData = parsed;
        }
      }
    } catch (e) {
      // Ignore parse errors, resort to fresh payload
    }

    if (limitData.count >= 2) {
      setAuthRequireMessage(
        "You've reached your free daily usage limit. Please sign in to continue building your application.",
      );
      return false;
    }

    limitData.count++;
    window.localStorage.setItem(
      "guest_builder_actions",
      JSON.stringify(limitData),
    );
    return true;
  };

  const handleSave = async () => {
    if (!checkGuestUsageLimit()) return;

    // In production without bypass, this will eventually throw `Unauthorized` and redirect them.
    // In development with bypass, it will mock the save successfully.
    setIsSaving(true);
    // If not signed in, mock the save locally so guests can exhaust their interaction quota cleanly
    if (!isSignedIn) {
      setTimeout(() => {
        setNotificationModal({
          type: "success",
          title: "Draft Saved Locally",
          message: "Guest changes are saved securely to your browser temporarily. Please sign in to deploy!",
        });
        setIsSaving(false);
      }, 500);
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
    if (!checkGuestUsageLimit()) return;

    setIsPublishing(true);

    // If not signed in, mock the publish cleanly so guests can exhaust their quota without hitting the authentication wall instantly
    if (!isSignedIn) {
      setTimeout(() => {
        setNotificationModal({
          type: "success",
          title: "Mock Publish Successful",
          message:
            "Guest applications cannot be hosted live. However, here's a simulated success! Sign in to claim a permanent URL.",
        });
        setIsPublishing(false);
      }, 800);
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
      }, 1500);
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
        console.warn(
          "Editor JSON invalid. Falling back to base template to weave AI flow.",
        );
      }

      if (!currentConfig.pages || currentConfig.pages.length === 0)
        currentConfig.pages = [{ components: [] }];
      currentConfig.pages[0].components = newComponents;
      setConfigStr(JSON.stringify(currentConfig, null, 2));
    } catch {
      setNotificationModal({
        type: "error",
        title: "Generation Error",
        message: "Failed to weave AI structure into layout.",
      });
    }
  };

  const handleStreamStart = () => {
    if (!checkGuestUsageLimit()) return;
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
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Builder Toolbar */}
      <div className="h-14 border-b border-border bg-card shrink-0 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-tight">
              App Builder
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {appId}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center text-xs text-muted-foreground mr-4">
            {isGenerating ? (
              <span className="text-[#A78BFA] font-medium flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-[#A78BFA] before:rounded-full before:mr-2 before:animate-pulse">
                Generating
              </span>
            ) : errors.length > 0 ? (
              <span className="text-[#FF5F56] font-medium flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-[#FF5F56] before:rounded-full before:mr-2">
                Has Errors
              </span>
            ) : (
              <span className="text-[#27C93F] font-medium flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-[#27C93F] before:rounded-full before:mr-2">
                Ready
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-muted border-border hover:bg-card hover:text-foreground font-medium text-xs transition-colors"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="h-8 bg-brand hover:bg-brand-dark text-white font-medium text-xs shadow-md shadow-brand/20"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-2 fill-current" />
            )}
            Publish
          </Button>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden overflow-y-auto md:overflow-hidden">
        {/* Left Side: Editor & Validation */}
        <div className="w-full md:w-1/2 flex flex-col min-h-[50vh] md:min-h-0 border-b md:border-b-0 md:border-r border-border bg-card/50">
          <div className="flex-1 min-h-0 relative">
            <ConfigEditor
              value={configStr}
              onChange={(val) => setConfigStr(val || "")}
            />
            <CopilotPanel
              onApply={handleApplyCopilotComponents}
              onStreamStart={handleStreamStart}
              onStreamEnd={handleStreamEnd}
            />
          </div>
          <div className="h-48 shrink-0">
            <ValidationPanel
              errors={errors}
              warnings={warnings}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className="w-full md:w-1/2 min-h-[50vh] bg-background">
          <LivePreview configStr={configStr} />
        </div>
      </div>

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
                <Button className="bg-brand hover:bg-brand-dark text-white">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>
      )}

      {notificationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <h2
              className={`text-xl font-bold mb-2 ${notificationModal.type === "error" ? "text-red-500" : "text-brand"}`}
            >
              {notificationModal.title}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {notificationModal.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setNotificationModal(null)}
                className={
                  notificationModal.type === "error"
                    ? "bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
                    : "bg-brand hover:bg-brand-dark text-white min-w-[100px]"
                }
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
