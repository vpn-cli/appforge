import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-20 flex flex-col gap-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p className="text-brand font-mono text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Data Collection</h2>
          <p className="leading-relaxed">AppForge collects JSON payloads necessary for component regeneration and dynamic API extraction. User details are handled entirely via Supabase Auth architecture and adhere strictly to their GoTrue security definitions. Passwords are never seen nor stored by the runtime system.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

