import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createInsforgeServer } from "@/lib/insforge-server";

export default async function TermsPage() {
  const supabase = await createInsforgeServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar userLoggedIn={!!user || process.env.NODE_ENV === "development"} />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-20 flex flex-col gap-8">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Terms of Service</h1>
        <div className="prose prose-invert max-w-none text-text-secondary">
          <p className="text-brand font-mono text-sm mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-text-primary">1. Acceptance of Terms</h2>
          <p className="leading-relaxed mb-6">By accessing or using AppForge, you agree to be bound by these functional placeholders. Since this is an MVP build, there are no actual legal binding terms attached to this instance.</p>
          <h2 className="text-2xl font-semibold mt-8 mb-4 text-text-primary">2. Platform Usage</h2>
          <p className="leading-relaxed">You may use the metadata generation engine for internal prototyping and live runtime deployment capabilities without restriction during the beta.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
