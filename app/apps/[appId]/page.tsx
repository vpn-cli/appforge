import { createInsforgeServer } from "@/lib/insforge-server";
import { RenderNode } from "@/registry";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@clerk/nextjs/server";

export default async function LiveAppPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const { userId } = await auth();

  // Fetch the latest published configuration directly
  let rawConfig: unknown = null;

  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true" && !userId) {
    // DEV BYPASS: Explicit opt-in fake published state for previewing without auth
    rawConfig = {
      app: "Published App Simulation",
      pages: [
        {
          components: [
            { type: "Header", title: "Live Published Route", size: "lg" },
            { type: "ButtonAction", label: "Interact", variant: "default" }
          ]
        }
      ]
    };
  } else {
    // Secure Database Read
    const supabase = await createInsforgeServer();
    const { data: appData, error } = await supabase
      .from("apps")
      .select("published_config")
      .eq("id", appId)
      .single();

    if (error || !appData?.published_config) {
      return notFound();
    }
    rawConfig = appData.published_config;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
         <div className="bg-success-light border border-success-border text-success-text text-xs font-mono py-1.5 px-3 rounded-full self-start flex items-center mb-4">
           <span className="w-1.5 h-1.5 bg-success-text rounded-full mr-2" />
           Live Environment
         </div>
         
         {/* Live Execution Loop via Registry Engine */}
         <div className="flex flex-col gap-8 w-full pb-32">
           {(rawConfig as { pages?: { components: unknown[] }[] })?.pages?.[0]?.components?.map((comp: unknown, i: number) => (
             <RenderNode key={i} config={comp} />
           ))}
         </div>
      </main>

      <Footer />
    </div>
  );
}
