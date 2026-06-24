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
