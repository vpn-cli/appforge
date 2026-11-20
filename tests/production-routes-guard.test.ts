import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Sentry to avoid unhandled rejections during dev-mode testing
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
}));

import { GET as sentryTestGet } from "@/app/api/sentry-test/route";
import DevRenderersPage from "@/app/dev/renderers/page";
import TestRenderersPage from "@/app/test-renderers/page";
import DashboardPage from "@/app/dashboard/page";

describe("Production Route Guards & Redirects", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
  });

  describe("Production Mode (NODE_ENV === 'production')", () => {
    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    });

    it("/api/sentry-test returns a 404 response in production", async () => {
      const response = await sentryTestGet();
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Not found" });
    });

    it("/dev/renderers calls notFound() in production", () => {
      expect(() => {
        DevRenderersPage();
      }).toThrowError(/NEXT_HTTP_ERROR_FALLBACK;404/);
    });

    it("/test-renderers calls notFound() in production", () => {
      expect(() => {
        TestRenderersPage();
      }).toThrowError(/NEXT_HTTP_ERROR_FALLBACK;404/);
    });
  });

  describe("Development Mode (NODE_ENV === 'development')", () => {
    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    });

    it("/api/sentry-test executes test error logging and returns 500 in development", async () => {
      const response = await sentryTestGet();
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty("error", "Crash forcefully logged to Sentry!");
    });

    it("/dev/renderers does not throw notFound() in development", () => {
      expect(() => {
        const element = DevRenderersPage();
        expect(element).toBeDefined();
      }).not.toThrow();
    });

    it("/test-renderers does not throw notFound() in development", () => {
      expect(() => {
        const element = TestRenderersPage();
        expect(element).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("/dashboard Canonical Route Redirect", () => {
    it("/dashboard redirects to /apps", () => {
      try {
        DashboardPage();
        expect.unreachable("DashboardPage should have redirected");
      } catch (err: unknown) {
        const error = err as { message?: string; digest?: string };
        expect(error.message).toBe("NEXT_REDIRECT");
        expect(error.digest).toContain("/apps");
      }
    });
  });
});
