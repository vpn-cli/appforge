"use client";

import { createInsforgeClient } from "@/lib/insforge-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const [isLoading, setIsLoading] = useState<"github" | "google" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const supabase = createInsforgeClient();

  const handleOAuthLogin = async (provider: "github" | "google") => {
    setIsLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading("email");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (!error) {
      setMagicLinkSent(true);
    }
    setIsLoading(null);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-4">
      <Card className="w-full max-w-[400px] border-neutral-800 bg-neutral-950/50 backdrop-blur-xl text-neutral-100 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-white mb-2">AppForge</CardTitle>
          <CardDescription className="text-neutral-400 text-base">
            Sign in to start building metadata-driven apps
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md text-center">
              Authentication failed. Please try again.
            </div>
          )}
          
          {magicLinkSent ? (
            <div className="bg-[#27C93F]/10 border border-[#27C93F]/30 text-[#27C93F] text-sm p-4 rounded-md text-center flex flex-col gap-2">
              <span className="font-bold">Check your email!</span>
              <span>We sent a magic login link to {email}.</span>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                required
              />
              <Button 
                type="submit"
                className="w-full h-12 text-md font-medium bg-white text-black hover:bg-neutral-200 transition-all disabled:opacity-50"
                disabled={!!isLoading || !email}
              >
                {isLoading === "email" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Send Magic Link
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-950 px-2 text-neutral-500">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="w-full h-12 text-md font-medium border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50"
              onClick={() => handleOAuthLogin("github")}
              disabled={!!isLoading}
            >
              {isLoading === "github" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              GitHub
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 text-md font-medium border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50"
              onClick={() => handleOAuthLogin("google")}
              disabled={!!isLoading}
            >
              {isLoading === "google" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
