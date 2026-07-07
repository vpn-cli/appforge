import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SmoothScroller } from "@/components/layout/SmoothScroller";
import { GlobalCursor } from "@/components/layout/GlobalCursor";

export const metadata: Metadata = {
  title: "AppForge - Next Gen Builder",
  description: "Live Config-driven Apps with graceful degradation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans cursor-none">
        <GlobalCursor />
        {/* Native SSR-safe dark mode injection to bypass React 19 use-client script warnings */}
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const localTheme = window.localStorage.getItem('theme');
              if (localTheme === 'dark' || (!localTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (_) {}
          `
        }} />
        <SmoothScroller>
          {children}
        </SmoothScroller>
      </body>
    </html>
  );
}

