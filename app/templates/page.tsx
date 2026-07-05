import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createInsforgeServer } from "@/lib/insforge-server";
import Link from "next/link";

export default async function TemplatesPage() {
  const supabase = await createInsforgeServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar userLoggedIn={!!user || process.env.NODE_ENV === "development"} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-24 flex flex-col gap-12">
        <div className="text-center mb-6">
           <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">Starter Templates</h1>
           <p className="text-text-secondary max-w-xl mx-auto text-lg leading-relaxed">Jumpstart your workspace with pre-configured JSON structural layouts designed for instant previewing.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-surface border-border hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300">
             <CardHeader>
               <CardTitle className="text-xl text-text-primary">Employee Directory</CardTitle>
               <CardDescription>Standard Grid-based personnel layout.</CardDescription>
             </CardHeader>
             <CardContent>
               <form action={async () => {
                 "use server";
                 await import("@/actions/apps").then(m => m.createAppFromTemplate("directory"));
               }}>
                 <Button type="submit" className="w-full bg-surface-secondary text-text-primary hover:bg-surface-tertiary">Use Template</Button>
               </form>
             </CardContent>
          </Card>
          <Card className="bg-surface border-border hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300">
             <CardHeader>
               <CardTitle className="text-xl text-text-primary">Analytics CRM</CardTitle>
               <CardDescription>Heavy metrics layout for phase 2 charts.</CardDescription>
             </CardHeader>
             <CardContent>
               <form action={async () => {
                 "use server";
                 await import("@/actions/apps").then(m => m.createAppFromTemplate("crm"));
               }}>
                 <Button type="submit" className="w-full bg-surface-secondary text-text-primary hover:bg-surface-tertiary">Use Template</Button>
               </form>
             </CardContent>
          </Card>
          <Card className="bg-surface border-border hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 border-brand/30 bg-gradient-to-br from-surface to-brand/5">
             <CardHeader>
               <CardTitle className="text-xl text-text-primary">Blank Canvas</CardTitle>
               <CardDescription>Start from complete scratch in the editor.</CardDescription>
             </CardHeader>
             <CardContent>
               <form action={async () => {
                 "use server";
                 await import("@/actions/apps").then(m => m.createAppFromTemplate("blank"));
               }}>
                 <Button type="submit" className="w-full bg-brand text-text-inverse hover:bg-brand-dark shadow-md shadow-brand/20">Start Custom Build</Button>
               </form>
             </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
