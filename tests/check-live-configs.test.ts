import { describe, it, expect } from "vitest";
import {
  assertNoCliCredentials,
  loadEnvFile,
  resolveConnectionString,
  auditConfig,
  runAudit,
} from "../scripts/check-live-configs.mjs";

describe("check-live-configs auditor suite", () => {
  describe("Security: CLI credential assertion", () => {
    it("allows standard harmless CLI arguments", () => {
      expect(() => assertNoCliCredentials(["--live"])).not.toThrow();
      expect(() => assertNoCliCredentials([])).not.toThrow();
      expect(() => assertNoCliCredentials(["--verbose", "--dry-run"])).not.toThrow();
    });

    it("rejects --db argument", () => {
      expect(() => assertNoCliCredentials(["--db=postgres://user:pass@host/db"])).toThrow(
        /Security Violation/
      );
    });

    it("rejects --database argument", () => {
      expect(() => assertNoCliCredentials(["--database=postgresql://user:pass@host/db"])).toThrow(
        /Security Violation/
      );
    });

    it("rejects bare postgres:// connection string", () => {
      expect(() => assertNoCliCredentials(["postgres://user:secret@localhost:5432/app"])).toThrow(
        /Security Violation/
      );
    });

    it("rejects bare postgresql:// connection string", () => {
      expect(() => assertNoCliCredentials(["postgresql://user:secret@localhost:5432/app"])).toThrow(
        /Security Violation/
      );
    });
  });

  describe("Environment variable resolution", () => {
    it("loads .env.test and extracts variables without throwing", () => {
      const parsed = loadEnvFile(".env.test");
      expect(typeof parsed).toBe("object");
      expect(parsed).not.toBeNull();
    });

    it("resolves test connection string from .env.test or environment", async () => {
      const connStr = await resolveConnectionString(false);
      expect(connStr).toBeDefined();
      expect(connStr.length).toBeGreaterThan(0);
      expect(connStr).toContain("postgres");
    });
  });

  describe("Fixture config validation (auditConfig)", () => {
    it("accepts a strictly valid AppForge configuration AST", () => {
      const validConfig = {
        app: "fixture_demo",
        pages: [
          {
            title: "Home",
            components: [
              {
                type: "Statistic",
                label: "Active Workflows",
                value: "1,244",
                variant: "panel",
                trend: {
                  value: "+12%",
                  sentiment: "positive",
                  direction: "up",
                },
              },
              {
                type: "DataTable",
                entity: "workflows",
                columns: [
                  { key: "workflow", label: "WORKFLOW", type: "avatar" },
                  { key: "trigger", label: "TRIGGER", type: "code" },
                  { key: "status", label: "STATUS", type: "badge" },
                ],
                data: [
                  { id: "1", workflow: "Billing Sync", trigger: "cron_daily", status: "Active" },
                ],
              },
            ],
          },
        ],
      };

      const result = auditConfig(validConfig, "draft");
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it("rejects invalid configuration with unrecognized / malicious keys", () => {
      const invalidConfig = {
        app: "fixture_demo",
        foo: "unrecognized_root_key",
        pages: [
          {
            title: "Home",
            components: [
              {
                type: "Statistic",
                label: "Active Workflows",
                value: "1,244",
                dangerouslySetInnerHTML: "alert(1)",
                style: { color: "red" },
              },
            ],
          },
        ],
      };

      const tallies: Record<string, number> = {};
      const result = auditConfig(invalidConfig, "draft", tallies);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.includes("unrecognized") || i.includes("Unrecognized"))).toBe(true);
    });

    it("rejects configuration with null, empty, or unparseable JSON", () => {
      expect(auditConfig(null).valid).toBe(false);
      expect(auditConfig("").valid).toBe(false);
      expect(auditConfig("{ bad json ").valid).toBe(false);
    });
  });

  describe("Integration audit execution against TEST database", () => {
    it("runs audit against TEST database with read-only transaction and zero writes", async () => {
      const auditResult = await runAudit(false);
      expect(auditResult).toBeDefined();
      expect(typeof auditResult.totalApps).toBe("number");
      expect(typeof auditResult.validDraftCount).toBe("number");
      expect(typeof auditResult.invalidDraftCount).toBe("number");
    });
  });
});
