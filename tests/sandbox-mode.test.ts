import { describe, it, expect, vi } from "vitest";
import { isSandboxAppId } from "@/lib/sandbox";
import {
  saveAppConfig,
  publishAppConfig,
  renameApp,
  deleteApp,
  getAppConfig,
} from "@/actions/apps";
import { syncAppSchema } from "@/actions/schema";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "mock-user-123" }),
}));

vi.mock("@/lib/insforge-server", () => ({
  createInsforgeServer: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

describe("Sandbox mode and demo write path protection", () => {
  describe("isSandboxAppId helper", () => {
    it("identifies demo, template-*, and mock-* routes as sandbox IDs", () => {
      expect(isSandboxAppId("demo")).toBe(true);
      expect(isSandboxAppId("template-blank")).toBe(true);
      expect(isSandboxAppId("template-crm")).toBe(true);
      expect(isSandboxAppId("mock-new-id")).toBe(true);
      expect(isSandboxAppId("mock-1")).toBe(true);
    });

    it("does not flag real user app UUIDs as sandbox IDs", () => {
      expect(isSandboxAppId("e62973ca-95cf-4df5-8b6b-4a572a1bf3e1")).toBe(false);
      expect(isSandboxAppId("a0000000-0000-0000-0000-000000000001")).toBe(false);
    });
  });

  describe("Server Action Hard-Blocks for Sandbox Apps", () => {
    it("blocks saveAppConfig for 'demo' and returns 400 error without touching DB", async () => {
      const res = await saveAppConfig("demo", JSON.stringify({ app: "Demo" }));
      expect(res.success).toBe(false);
      expect(res.error).toContain("Sandbox demo and template applications cannot be modified");
      expect(res.status).toBe(400);
    });

    it("blocks saveAppConfig for 'template-*' IDs", async () => {
      const res = await saveAppConfig("template-blank", JSON.stringify({ app: "Blank" }));
      expect(res.success).toBe(false);
      expect(res.error).toContain("Sandbox demo and template applications cannot be modified");
    });

    it("blocks publishAppConfig for 'demo' and returns 400 error", async () => {
      const res = await publishAppConfig("demo", JSON.stringify({ app: "Demo" }));
      expect(res.success).toBe(false);
      expect(res.error).toContain("Sandbox demo and template applications cannot be published");
      expect(res.status).toBe(400);
    });

    it("blocks publishAppConfig for 'template-*' IDs", async () => {
      const res = await publishAppConfig("template-crm", JSON.stringify({ app: "CRM" }));
      expect(res.success).toBe(false);
      expect(res.error).toContain("Sandbox demo and template applications cannot be published");
    });

    it("blocks renameApp for 'demo' and throws 400", async () => {
      await expect(renameApp("demo", "New Name")).rejects.toThrow(
        "Sandbox demo and template applications cannot be renamed."
      );
    });

    it("blocks deleteApp for 'demo' and throws 400", async () => {
      await expect(deleteApp("demo")).rejects.toThrow(
        "Sandbox demo and template applications cannot be deleted."
      );
    });

    it("blocks syncAppSchema for 'demo' and returns failure without DDL execution", async () => {
      const res = await syncAppSchema("demo", { items: { name: "string" } }, "user-123");
      expect(res.success).toBe(false);
      expect(res.message).toContain("Sandbox demo and template schemas cannot be synchronized");
    });

    it("getAppConfig returns null immediately for 'demo'", async () => {
      const config = await getAppConfig("demo");
      expect(config).toBeNull();
    });
  });
});
