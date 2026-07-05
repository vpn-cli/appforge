import { createInsforgeServer } from "@/lib/insforge-server";
import { RenderNode } from "@/registry";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function LiveAppPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const supabase = await createInsforgeServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the latest published configuration directly
  let rawConfig: any = null;

  if (process.env.NODE_ENV === "development" && !user) {
    // DEV BYPASS: Fake published state
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
      <Navbar userLoggedIn={!!user} />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
         <div className="bg-[#27C93F]/10 border border-[#27C93F]/30 text-[#27C93F] text-xs font-mono py-1.5 px-3 rounded-full self-start flex items-center mb-4 shadow-sm shadow-[#27C93F]/5">
           <span className="w-1.5 h-1.5 bg-[#27C93F] rounded-full mr-2 shadow-[0_0_8px_rgba(39,201,63,0.8)] animate-pulse" />
           Live Environment
         </div>
         
         {/* Live Execution Loop via Registry Engine */}
         <div className="flex flex-col gap-8 w-full pb-32">
           {rawConfig?.pages?.[0]?.components?.map((comp: any, i: number) => (
             <RenderNode key={i} config={comp} />
           ))}
         </div>
      </main>

      <Footer />
    </div>
  );
}
