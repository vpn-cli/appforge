import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { AppGrid } from "@/components/dashboard/AppGrid";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AppData } from "@/components/dashboard/AppGrid";
import { getUserApps } from "@/actions/apps";

async function DashboardContent() {
  let { userId } = await auth();

  if (!userId && process.env.NODE_ENV === "development") {
    // DEV BYPASS: Supabase default SMTP rate limits magic links to 3/hour.
    // We inject a dummy user so you can still view the Dashboard UI locally!
    userId = "dev-test-user-123";
  } else if (!userId) {
    redirect("/login");
  }

  const apps = (await getUserApps()) as AppData[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-10 pb-24 sm:pb-10 flex flex-col gap-10">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Creator Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back. Here is an overview of your AppForge ecosystem.</p>
          </div>
          <div className="text-xs font-mono bg-muted px-3 py-1.5 rounded-md border border-border text-muted-foreground">
            User ID: {userId?.split('_')[1]?.substring(0, 5) || "MOCK"}***
          </div>
        </div>

        {/* Stats Strip */}
        <StatsBar />

        {/* Main Layout Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-10">
          
          <div className="col-span-1 xl:col-span-3 h-full">
            <h2 className="text-lg font-bold text-foreground mb-5 uppercase tracking-wider text-xs">Your Apps</h2>
            <AppGrid initialApps={apps} />
          </div>

          <div className="col-span-1 xl:col-span-1 border-t xl:border-t-0 pt-8 xl:pt-0">
            <h2 className="text-lg font-bold text-foreground mb-5 uppercase tracking-wider text-xs xl:invisible hidden xl:block">Activity</h2>
            <div className="sticky top-6">
              <RecentActivity />
            </div>
          </div>
          
        </div>
        
      </main>

      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="w-8 h-8 text-neutral-500 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}


