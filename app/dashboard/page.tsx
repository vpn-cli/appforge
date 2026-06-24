import { createInsforgeServer } from "@/lib/insforge-server";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

async function DashboardContent() {
  const supabase = await createInsforgeServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Dashboard</h1>
      <p className="text-neutral-400 mb-8 text-lg">Welcome to AppForge. You are successfully logged in.</p>
      <div className="text-sm bg-neutral-900 p-4 rounded-lg font-mono border border-neutral-800 text-neutral-300 shadow-inner w-full max-w-md break-all">
        <span className="text-neutral-500 mr-2">User ID:</span> {user.id}
      </div>
      <form action="/auth/signout" method="post" className="mt-8">
        <button className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md text-sm font-medium transition-colors text-white">
          Sign Out
        </button>
      </form>
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
