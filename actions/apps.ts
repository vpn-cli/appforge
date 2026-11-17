"use server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { EventPublisher } from "@/lib/event-queue";

/**
 * Resolves the authenticated user ID.
 * The development bypass is strictly opt-in via DEV_AUTH_BYPASS=true and is hard-blocked in production.
 */
function isDevAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true";
}

async function getAuthOrBypass() {
  if (isDevAuthBypassEnabled()) {
    return { userId: "dev-bypass-user", isBypass: true };
  }

  const { userId } = await auth();
  if (userId) return { userId, isBypass: false };

  return { userId: null, isBypass: false };
}

export async function getUserApps() {
  const { userId, isBypass } = await getAuthOrBypass();

  if (isBypass) {
    return [
      {
        id: "mock-1",
        name: "Customer Success Portal",
        updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: "Published",
        config: {
          app: "Customer Success Portal",
          pages: [
            {
              components: [
                {
                  type: "Header",
                  title: "Customer Success & Operations",
                  subtitle: "Active enterprise accounts, health scores, and critical churn alerts.",
                  size: "lg",
                },
                {
                  type: "Grid",
                  columns: 3,
                  gap: 4,
                  items: [
                    { type: "Statistic", label: "Net Retention", value: "114%", trend: "up", trendValue: "+3.2%" },
                    { type: "Statistic", label: "Accounts at Risk", value: "2", trend: "down", trendValue: "-1" },
                    { type: "Statistic", label: "Expansion ARR", value: "$42,800" },
                  ],
                },
                {
                  type: "DataTable",
                  entity: "accounts",
                  columns: [
                    { key: "company", label: "Account Name", type: "text" },
                    { key: "mrr", label: "ARR ($)", type: "number" },
                    { key: "health", label: "Health", type: "badge" },
                  ],
                  data: [
                    { id: "1", company: "Acme Logistics", mrr: 18200, health: "Good" },
                    { id: "2", company: "Vanguard Tech", mrr: 29500, health: "Review" },
                    { id: "3", company: "Helix Biotech", mrr: 12400, health: "Good" },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: "mock-2",
        name: "Global Fleet Logistics",
        updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: "Draft",
        config: {
          app: "Global Fleet Logistics",
          pages: [
            {
              components: [
                {
                  type: "Header",
                  title: "Fleet Operations Telemetry",
                  subtitle: "Real-time dispatch, route schedules, and equipment alerts.",
                  size: "lg",
                },
                {
                  type: "Grid",
                  columns: 3,
                  gap: 4,
                  items: [
                    {
                      type: "Card",
                      title: "Western Depot",
                      subtitle: "24 vehicles online · 0 critical alerts",
                      footer: [{ type: "ButtonAction", label: "Inspect depot", variant: "outline" }],
                    },
                    {
                      type: "Card",
                      title: "Eastern Corridor",
                      subtitle: "18 vehicles online · 1 scheduled repair",
                      footer: [{ type: "ButtonAction", label: "Inspect corridor", variant: "outline" }],
                    },
                    {
                      type: "Card",
                      title: "Central Hub",
                      subtitle: "42 vehicles online · nominal status",
                      footer: [{ type: "ButtonAction", label: "Inspect hub", variant: "outline" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];
  }

  if (!userId) throw new Error("Unauthorized");

  const supabase = await createInsforgeServer();
  const { data, error } = await supabase
    .from("apps")
    .select("id, name, updated_at, published_config, config")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getUserApps]", error);
    return [];
  }

  return data.map((app: Record<string, unknown>) => ({
    ...app,
    status: app.published_config ? "Published" : "Draft"
  }));
}

export async function createApp(prompt?: string) {
  const supabase = await createInsforgeServer();
  const { userId, isBypass } = await getAuthOrBypass();

  const querySuffix = prompt ? `?prompt=${encodeURIComponent(prompt)}` : "";

  if (isBypass) {
    redirect(`/builder/mock-new-id${querySuffix}`);
  }

  // Gracefully bounce unauthenticated 'Create New App' clicks to the sandbox
  if (!userId) {
    redirect(`/builder/template-blank${querySuffix}`);
  }

  const appName = prompt ? prompt.trim().slice(0, 36) : "Untitled App";

  const { data, error } = await supabase
    .from("apps")
    .insert({
      user_id: userId,
      name: appName,
      config: { app: appName, pages: [] },
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createApp] failed:", error);
    throw new Error("Failed to create app");
  }

  redirect(`/builder/${data.id}${querySuffix}`);
}

export async function createAppFromTemplate(templateId: string) {
  const supabase = await createInsforgeServer();
  const { userId, isBypass } = await getAuthOrBypass();

  if (!userId || isBypass) {
    redirect(`/builder/template-${templateId}`);
  }

  // Determine template initial configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialConfig: any = { "app": `New ${templateId} App`, "pages": [] };
  
  if (templateId === "directory") {
    initialConfig = {
      "app": "Employee Directory",
      "entities": { "employees": { "name": "string", "role": "string", "department": "string", "email": "string" } },
      "pages": [{
        "components": [
          { "type": "Header", "title": "Employee Directory", "subtitle": "Search and manage personnel globally.", "size": "lg" },
          { "type": "Grid", "columns": 3, "gap": 4, "items": [
              { "type": "Statistic", "label": "Total Employees", "value": "142", "trend": "up", "trendValue": "+12%" },
              { "type": "Statistic", "label": "Departments", "value": "8" },
              { "type": "Statistic", "label": "Open Roles", "value": "24", "trend": "up", "trendValue": "+4" }
          ]},
          { "type": "Card", "title": "Directory Database", "content": [
              { "type": "DataTable", "entity": "employees", "columns": ["name", "role", "department", "email"] }
          ]}
        ]
      }]
    };
  } else if (templateId === "crm") {
    initialConfig = {
      "app": "Analytics CRM",
      "entities": { "leads": { "company": "string", "contact": "string", "value": "number", "status": "string" } },
      "pages": [{
        "components": [
          { "type": "Header", "title": "Sales Analytics CRM", "subtitle": "Q3 Performance Metrics and Pipeline", "size": "lg" },
          { "type": "Grid", "columns": 4, "gap": 4, "items": [
              { "type": "Statistic", "label": "Total Pipeline", "value": "$1.2M", "trend": "up", "trendValue": "+18%" },
              { "type": "Statistic", "label": "Active Leads", "value": "84", "trend": "down", "trendValue": "-5%" },
              { "type": "Statistic", "label": "Conversion Rate", "value": "12.5%", "trend": "up", "trendValue": "+2.1%" },
              { "type": "Statistic", "label": "Closed Won", "value": "42 Deals" }
          ]},
          { "type": "Header", "title": "Recent Opportunities", "size": "md" },
          { "type": "DataTable", "entity": "leads", "columns": ["company", "contact", "value", "status"] }
        ]
      }]
    };
  }

  const { data, error } = await supabase
    .from("apps")
    .insert({
      user_id: userId,
      name: initialConfig.app || `New ${templateId} App`,
      config: initialConfig
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createTemplate] failed:", error);
    throw new Error("Failed to create app from template");
  }

  // Redirecting the user to the builder with a flag so the UI can seed the template
  redirect(`/builder/${data.id}?template=${templateId}`);
}

import { syncAppSchema } from "@/actions/schema";

export async function saveAppConfig(appId: string, configStr: string) {
  const supabase = await createInsforgeServer();
  const { userId, isBypass } = await getAuthOrBypass();

  if (isBypass) {
    console.log("[ADMIN BYPASS] Mocking Save App Config for:", appId);
    let rawConfig = {};
    try {
      rawConfig = JSON.parse(configStr);
    } catch {
      /* ignore */
    }
    if ((rawConfig as Record<string, unknown>).entities) {
      await import("@/actions/schema").then((m) =>
        m.syncAppSchema(appId, (rawConfig as Record<string, unknown>).entities, userId),
      );
    }
    return { success: true };
  }

  if (!userId) throw new Error("Unauthorized");

  let rawConfig = {};
  try {
    rawConfig = JSON.parse(configStr);
  } catch {
    return {
      success: false,
      error: "Invalid JSON configuration. Cannot save.",
    };
  }

  // Save the configuration to the apps table
  const { data: updatedRows, error: saveError } = await supabase
    .from("apps")
    .update({ config: rawConfig, updated_at: new Date().toISOString() })
    .eq("id", appId)
    .eq("user_id", userId)
    .select("id");

  if (saveError) {
    return {
      success: false,
      error: `Failed to save config: ${saveError.message}`,
    };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: "App not found or not owned by user",
      status: 404,
    };
  }

  // Trigger schema synchronization if entities exist
  if ((rawConfig as Record<string, unknown>).entities) {
    const syncRes = await syncAppSchema(
      appId,
      (rawConfig as Record<string, unknown>).entities,
      userId
    );
    if (!syncRes.success) {
      console.warn("Schema Sync Warning:", syncRes.message);
      // We purposefully do not throw an error here to prevent blocking the UI save success entirely
    }
  }

  return { success: true };
}

export async function publishAppConfig(appId: string, configStr: string) {
  const supabase = await createInsforgeServer();
  const { userId, isBypass } = await getAuthOrBypass();

  if (isBypass) {
    if (userId === "dev-bypass-user" || !userId) {
      throw new Error("Unauthorized - You must sign in to publish an app.");
    }
    console.log("[ADMIN BYPASS] Mocking Publish App Config for:", appId);
    return { success: true };
  }

  if (!userId) throw new Error("Unauthorized");

  let rawConfig = {};
  try {
    rawConfig = JSON.parse(configStr);
  } catch {
    return { success: false, error: "Invalid json format." };
  }

  const { data: updatedRows, error } = await supabase
    .from("apps")
    .update({ published_config: rawConfig, config: rawConfig })
    .eq("id", appId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    return { success: false, error: `Failed to publish app: ${error.message}` };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error: "App not found or not owned by user",
      status: 404,
    };
  }

  // Asynchronously fire a Kafka event to our decoupled queue tracking 'app_published' events.
  // This operation handles its own errors silently to prevent failing the UI interaction if analytics goes down.
  EventPublisher.publish("appforge-events", "app_published", {
    app_id: appId,
    user_id: userId,
    config_size: configStr.length,
    timestamp: new Date().toISOString(),
  });

  return { success: true };
}

export async function deleteApp(appId: string) {
  const supabase = await createInsforgeServer();
  const { userId, isBypass } = await getAuthOrBypass();

  if (isBypass) return { success: true };
  if (!userId) throw new Error("Unauthorized");

  const { data: deletedRows, error } = await supabase
    .from("apps")
    .delete()
    .eq("id", appId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw new Error(`Failed to delete app: ${error.message}`);
  }

  if (!deletedRows || deletedRows.length === 0) {
    const err = new Error("App not found or not owned by user");
    (err as unknown as { status: number }).status = 404;
    throw err;
  }
  return { success: true };
}

export async function renameApp(appId: string, newName: string) {
  const supabase = await createInsforgeServer();
  const { userId, isBypass } = await getAuthOrBypass();

  if (isBypass) return { success: true };
  if (!userId) throw new Error("Unauthorized");

  const { data: updatedRows, error } = await supabase
    .from("apps")
    .update({ name: newName })
    .eq("id", appId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw new Error(`Failed to rename app: ${error.message}`);
  }

  if (!updatedRows || updatedRows.length === 0) {
    const err = new Error("App not found or not owned by user");
    (err as unknown as { status: number }).status = 404;
    throw err;
  }
  return { success: true };
}

export async function getAppConfig(appId: string) {
  if (appId.startsWith("template-") || appId.startsWith("mock-")) return null;
  
  const supabase = await createInsforgeServer();
  const { userId, isBypass } = await getAuthOrBypass();

  if (isBypass) return null;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("apps")
    .select("config")
    .eq("id", appId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.config;
}
