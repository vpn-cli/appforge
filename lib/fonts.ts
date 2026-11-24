import { Inter, Geist, Geist_Mono } from "next/font/google";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const MONO_FONT_STACK = `"SF Mono", ui-monospace, SFMono-Regular, Menlo, ${geistMono.style.fontFamily}, monospace`;
