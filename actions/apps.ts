"use server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { redirect } from "next/navigation";

export async function getUserApps() {
  const supabase = await createInsforgeServer();
  let { data: { user } } = await supabase.auth.getUser();

  // DEV BYPASS FALLBACK
  if (process.env.NODE_ENV === "development" && !user) {
    return [
      { id: "mock-1", name: "Internal CRM (Mock)", updated_at: new Date().toISOString(), status: "Published" },
      { id: "mock-2", name: "Inventory Tracker (Mock)", updated_at: new Date(Date.now() - 3600000).toISOString(), status: "Draft" },
    ];
  }

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("apps")
    .select("id, name, updated_at, published_config")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getUserApps]", error);
    return [];
  }

  return data.map((app: any) => ({
    ...app,
    status: app.published_config ? "Published" : "Draft"
  }));
}

export async function createApp() {
  const supabase = await createInsforgeServer();
  let { data: { user } } = await supabase.auth.getUser();

  // DEV BYPASS FALLBACK
  if (process.env.NODE_ENV === "development" && !user) {
    redirect("/builder/mock-new-id");
  }

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("apps")
    .insert({
      name: "Untitled App",
      config: { app: "Untitled App", pages: [] }
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createApp] failed:", error);
    throw new Error("Failed to create app");
  }

  redirect(`/builder/${data.id}`);
}

export async function createAppFromTemplate(templateId: string) {
  const supabase = await createInsforgeServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === "development" && !user) {
    redirect(`/builder/template-${templateId}`);
  }

  if (!user) throw new Error("Unauthorized");

  // In production, we would merge actual template JSON here 
  // before inserting into `apps.config`.
  const { data, error } = await supabase
    .from("apps")
    .insert({
      name: `New ${templateId} App`,
      config: { "app": `New ${templateId} App`, "pages": [] }
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
  const { data: { user } } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === "development" && !user) {
    console.log("[DEV BYPASS] Mocking Save App Config for:", appId);
    // Trigger mock schema sync for testing
    let rawConfig = {};
    try { rawConfig = JSON.parse(configStr); } catch (e) {}
    if ((rawConfig as any).entities) {
      await syncAppSchema(appId, (rawConfig as any).entities);
    }
    return { success: true };
  }

  if (!user) throw new Error("Unauthorized");

  let rawConfig = {};
  try {
    rawConfig = JSON.parse(configStr);
  } catch (e) {
    throw new Error("Invalid JSON configuration. Cannot save.");
  }

  // Save the configuration to the apps table
  const { error: saveError } = await supabase
    .from("apps")
    .update({ config: rawConfig, updated_at: new Date().toISOString() })
    .eq("id", appId)
    .eq("user_id", user.id);

  if (saveError) {
    throw new Error(`Failed to save config: ${saveError.message}`);
  }

  // Trigger schema synchronization if entities exist
  if ((rawConfig as any).entities) {
    const syncRes = await syncAppSchema(appId, (rawConfig as any).entities);
    if (!syncRes.success) {
      console.warn("Schema Sync Warning:", syncRes.message);
      // We purposefully do not throw an error here to prevent blocking the UI save success entirely
    }
  }

  return { success: true };
}

export async function publishAppConfig(appId: string, configStr: string) {
  const supabase = await createInsforgeServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === "development" && !user) {
    console.log("[DEV BYPASS] Mocking Publish App Config for:", appId);
    return { success: true };
  }

  if (!user) throw new Error("Unauthorized");

  let rawConfig = {};
  try {
    rawConfig = JSON.parse(configStr);
  } catch (e) {
    throw new Error("Invalid json format.");
  }

  const { error } = await supabase
    .from("apps")
    .update({ published_config: rawConfig, status: 'Published' })
    .eq("id", appId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Failed to publish app.");
  }

  return { success: true };
}
