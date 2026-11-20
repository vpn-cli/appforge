import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import middleware from "@/middleware";
import fs from "fs";
import path from "path";

describe("Middleware & Route '/' Server Auth Verification", () => {
  it("immediately returns NextResponse.next() for '/' without calling Clerk auth or redirecting", () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = middleware(req, {} as any);

    // Should return next() without headers or redirect
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
    // Crucially, it must NOT redirect to sign-in or handshake
    expect(res.headers.get("location")).toBeNull();
  });

  it("statically verifies that no server component or file for '/' calls auth() or currentUser()", () => {
    // The page file:
    const pageContent = fs.readFileSync(path.resolve("app/page.tsx"), "utf8");
    expect(pageContent).not.toMatch(/\bauth\s*\(/);
    expect(pageContent).not.toMatch(/\bcurrentUser\s*\(/);

    // All home components rendered on '/':
    const homeDir = path.resolve("components/home");
    const files = fs.readdirSync(homeDir, { recursive: true }) as string[];
    for (const file of files) {
      if (typeof file === "string" && (file.endsWith(".tsx") || file.endsWith(".ts"))) {
        const filePath = path.join(homeDir, file);
        const code = fs.readFileSync(filePath, "utf8");
        // Server auth calls from @clerk/nextjs/server must not exist on home components
        expect(code).not.toContain("@clerk/nextjs/server");
        expect(code).not.toMatch(/\bcurrentUser\s*\(/);
      }
    }
  });

  it("confirms HomeTopBar uses client-side useAuth() so returning idle users see signed-in state without server errors", () => {
    const topBarCode = fs.readFileSync(path.resolve("components/home/HomeTopBar.tsx"), "utf8");
    // Uses client directive
    expect(topBarCode).toMatch(/["']use client["']/);
    // Uses client-side useAuth() from @clerk/nextjs, not server auth()
    expect(topBarCode).toContain("useAuth");
    expect(topBarCode).not.toContain("@clerk/nextjs/server");
    // Dynamically imports signed in controls without SSR to prevent hydration mismatch
    expect(topBarCode).toContain("HomeTopBarSignedIn");
    expect(topBarCode).toContain("ssr: false");
  });
});
