import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkGuestCopilotLimit,
  resetGuestCopilotLimitsForTesting,
  resolveClientIp,
  DEFAULT_GUEST_COPILOT_IP_LIMIT,
  DEFAULT_GUEST_COPILOT_DAILY_CAP,
} from "@/lib/rate-limit";

let mockUserId: string | null = null;

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: mockUserId })),
}));

vi.mock("@/lib/copilot-pipeline", () => ({
  createCopilotStream: vi.fn(() => new ReadableStream()),
}));

import { POST } from "@/app/api/copilot/route";

describe("Copilot Guest Exposure & Rate Limiting", () => {
  beforeEach(() => {
    resetGuestCopilotLimitsForTesting();
    mockUserId = null;
    delete process.env.GUEST_COPILOT_IP_LIMIT;
    delete process.env.GUEST_COPILOT_DAILY_CAP;
  });

  describe("checkGuestCopilotLimit helper", () => {
    it("allows up to DEFAULT_GUEST_COPILOT_IP_LIMIT (5) generations per IP, then blocks", async () => {
      const ip = "203.0.113.10";

      for (let i = 0; i < DEFAULT_GUEST_COPILOT_IP_LIMIT; i++) {
        const res = await checkGuestCopilotLimit(ip);
        expect(res.success).toBe(true);
        expect(res.remaining).toBe(DEFAULT_GUEST_COPILOT_IP_LIMIT - (i + 1));
      }

      // 6th call from same IP must be blocked
      const blockedRes = await checkGuestCopilotLimit(ip);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.reason).toBe("ip_limit");
      expect(blockedRes.remaining).toBe(0);
    });

    it("allows different IPs to have independent IP quotas", async () => {
      const ip1 = "203.0.113.11";
      const ip2 = "203.0.113.12";

      // Exhaust ip1
      for (let i = 0; i < DEFAULT_GUEST_COPILOT_IP_LIMIT; i++) {
        await checkGuestCopilotLimit(ip1);
      }
      expect((await checkGuestCopilotLimit(ip1)).success).toBe(false);

      // ip2 must still be permitted
      const resIp2 = await checkGuestCopilotLimit(ip2);
      expect(resIp2.success).toBe(true);
    });

    it("blocks all logged-out requests once global daily cap is reached", async () => {
      process.env.GUEST_COPILOT_DAILY_CAP = "3";
      process.env.GUEST_COPILOT_IP_LIMIT = "10";

      // 3 calls across 3 different IPs
      expect((await checkGuestCopilotLimit("10.0.0.1")).success).toBe(true);
      expect((await checkGuestCopilotLimit("10.0.0.2")).success).toBe(true);
      expect((await checkGuestCopilotLimit("10.0.0.3")).success).toBe(true);

      // 4th call from a brand-new IP must be blocked by global daily cap
      const blockedRes = await checkGuestCopilotLimit("10.0.0.4");
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.reason).toBe("global_daily_cap");
    });
  });

  describe("POST /api/copilot route handler", () => {
    it("returns 429 with 'sign in to keep generating' when logged-out IP exceeds quota", async () => {
      const ip = "198.51.100.25";

      // Exhaust IP quota
      for (let i = 0; i < DEFAULT_GUEST_COPILOT_IP_LIMIT; i++) {
        await checkGuestCopilotLimit(ip);
      }

      const req = new Request("http://localhost:3000/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": ip,
        },
        body: JSON.stringify({ prompt: "Create a customer tracker" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(429);

      const json = await res.json();
      expect(json.error).toBe("Please sign in to keep generating with Copilot.");
      expect(json.code).toBe("AUTH_REQUIRED");
      expect(json.reason).toBe("ip_limit");
    });

    it("returns 429 with 'sign in to keep generating' when global daily cap is reached", async () => {
      process.env.GUEST_COPILOT_DAILY_CAP = "2";

      await checkGuestCopilotLimit("10.1.1.1");
      await checkGuestCopilotLimit("10.1.1.2");

      const req = new Request("http://localhost:3000/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": "10.1.1.3",
        },
        body: JSON.stringify({ prompt: "Build an inventory tool" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(429);

      const json = await res.json();
      expect(json.error).toBe("Please sign in to keep generating with Copilot.");
      expect(json.code).toBe("AUTH_REQUIRED");
      expect(json.reason).toBe("global_daily_cap");
    });

    it("does NOT block authenticated users when guest caps are exhausted", async () => {
      process.env.GUEST_COPILOT_DAILY_CAP = "1";
      await checkGuestCopilotLimit("10.0.0.1"); // Daily cap exhausted for guests

      // Log in as user
      mockUserId = "user_clerk_active_123";

      const req = new Request("http://localhost:3000/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-real-ip": "10.0.0.99",
        },
        body: JSON.stringify({ prompt: "Generate admin dashboard" }),
      });

      const res = await POST(req);
      // Status is 200 (or 500 if no mock AI keys), but critically NOT 429 AUTH_REQUIRED!
      expect(res.status).not.toBe(429);
      if (res.status !== 200) {
        const json = await res.json();
        expect(json.code).not.toBe("AUTH_REQUIRED");
      }
    });

    describe("IP spoofing defense (x-real-ip only)", () => {
      it("resolves x-real-ip when present, ignoring x-forwarded-for and cf-connecting-ip", () => {
        const req = new Request("http://localhost:3000/api/copilot", {
          headers: {
            "x-real-ip": "198.51.100.42",
            "x-forwarded-for": "10.0.0.1, 10.0.0.2",
            "cf-connecting-ip": "172.16.0.5",
          },
        });
        expect(resolveClientIp(req)).toBe("198.51.100.42");
      });

      it("falls back to shared 'unknown' bucket when x-real-ip is absent, never trusting spoofed headers", () => {
        const req = new Request("http://localhost:3000/api/copilot", {
          headers: {
            "x-forwarded-for": "10.0.0.1, 10.0.0.2",
            "cf-connecting-ip": "172.16.0.5",
          },
        });
        expect(resolveClientIp(req)).toBe("unknown");
      });

      it("blocks rotating spoofed x-forwarded-for headers because they map to the same 'unknown' bucket", async () => {
        // Send 5 requests from rotating x-forwarded-for / cf-connecting-ip headers without x-real-ip
        for (let i = 1; i <= DEFAULT_GUEST_COPILOT_IP_LIMIT; i++) {
          const req = new Request("http://localhost:3000/api/copilot", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": `198.51.100.${i}`,
              "cf-connecting-ip": `203.0.113.${i}`,
            },
            body: JSON.stringify({ prompt: `Prompt ${i}` }),
          });
          const res = await POST(req);
          expect(res.status).not.toBe(429);
        }

        // 6th request with a new spoofed IP must be BLOCKED because all fallback requests share "unknown"
        const spoofedReq = new Request("http://localhost:3000/api/copilot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "198.51.100.99",
            "cf-connecting-ip": "203.0.113.99",
          },
          body: JSON.stringify({ prompt: "Attacker rotating IP" }),
        });

        const blockedRes = await POST(spoofedReq);
        expect(blockedRes.status).toBe(429);
        const json = await blockedRes.json();
        expect(json.error).toBe("Please sign in to keep generating with Copilot.");
        expect(json.code).toBe("AUTH_REQUIRED");
        expect(json.reason).toBe("ip_limit");
      });
    });
  });
});
