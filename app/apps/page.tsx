import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getUserApps } from "@/actions/apps";
import type { AppData } from "@/components/dashboard/AppGrid";

type AppWithConfig = AppData & {
  config?: unknown;
  published_config?: unknown;
};

export async function AppsContent() {
  const apps = (await getUserApps()) as AppWithConfig[];
  return <DashboardView initialApps={apps} />;
}

export default async function AppsPage() {
  let userId: string | null = null;

  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true") {
    // Explicit opt-in dev bypass for local preview
    userId = "dev-test-user-123";
  } else {
    const authResult = await auth();
    userId = authResult.userId;
    if (!userId) {
      redirect("/sign-in");
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      }
    >
      <AppsContent />
    </Suspense>
  );
}
