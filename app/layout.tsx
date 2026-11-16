import type { Metadata } from "next";
import { inter, geistMono } from "@/lib/fonts";
import "./globals.css";
import { SmoothScroller } from "@/components/layout/SmoothScroller";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "AppForge",
  description: "Stop writing boilerplate. Build enterprise React applications instantly with AppForge's JSON compiler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#111110",
          borderRadius: "0.5rem"
        },
        elements: {
          card: "border border-border bg-card text-foreground shadow-lg relative overflow-hidden",
          headerTitle: "font-bold text-2xl tracking-tight text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border-border hover:bg-muted transition-colors text-foreground",
          formButtonPrimary: "font-medium shadow-xs bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground rounded-md",
          modalBackdrop: "live-clerk-gradient backdrop-blur-[2px]",
        }
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const p = new URLSearchParams(window.location.search).get('theme');
                  if (p === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                    localStorage.setItem('theme', 'light');
                  } else if (p === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                    localStorage.setItem('theme', 'dark');
                  }
                } catch(e) {}
              `,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col font-sans">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Skip to Main Content
          </a>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <SmoothScroller>
              {children}
            </SmoothScroller>
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
