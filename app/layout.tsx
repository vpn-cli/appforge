import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from 'next/font/local';
import { SmoothScroller } from "@/components/layout/SmoothScroller";
import { CustomCursor } from "@/components/layout/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppForge",
  description: "Stop writing boilerplate. Build enterprise React applications instantly with AppForge's JSON compiler.",
};

import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#BE185D", // AppForge brand purple/pink
          colorBackground: "#09090b", // Deep dark background
          colorInputBackground: "#18181b", // Slightly elevated input bg
          colorInputText: "#fafafa",
          colorText: "#fafafa",
          borderRadius: "0.5rem"
        },
        elements: {
          card: "border border-border/50 shadow-2xl shadow-brand/10",
          headerTitle: "font-semibold text-lg",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border-border/50 hover:bg-muted/50 transition-colors",
          formButtonPrimary: "font-medium shadow-md transition-transform hover:scale-[1.02] active:scale-95",
        }
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col font-sans cursor-none">
          <CustomCursor />
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
    </ClerkProvider>
  );
}

