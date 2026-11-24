import { describe, it, expect } from "vitest";
import {
  assertNoCliCredentials,
  loadEnvFile,
  resolveConnectionString,
  auditConfig,
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

    it("resolves connection string from customEnv without accessing environment", async () => {
      const connStr = await resolveConnectionString(false, {
        envTest: { TEST_DATABASE_URL: "postgresql://postgres:secret@localhost:5432/testdb" },
      });
      expect(connStr).toBe("postgresql://postgres:secret@localhost:5432/testdb");
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
                variant: "gradient",
                trend: {
                  value: "+12%",
                  sentiment: "positive",
                  direction: "up",
                  series: [50, 52, 51, 54, 53, 55, 56],
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
});
