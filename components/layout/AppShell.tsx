"use client";

import { AppHeader } from "@/components/layout/AppHeader";

type Props = {
  children: React.ReactNode;
  activeSearchQuery?: string;
  onSearchChange?: (q: string) => void;
};

export function AppShell({ children, activeSearchQuery, onSearchChange }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-brand/20 selection:text-brand">
      <AppHeader activeSearchQuery={activeSearchQuery} onSearchChange={onSearchChange} />
      <main id="main-content" className="flex-1 w-full flex flex-col">
        {children}
      </main>
    </div>
  );
}
