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
    >
      <body className="min-h-full flex flex-col font-sans cursor-none">
        <GlobalCursor />
        <SmoothScroller>
          {children}
        </SmoothScroller>
      </body>
    </html>
  );
}
