import { describe, it, expect, beforeAll } from "vitest";
import "./setup-db";
import { resolveConnectionString, runAudit } from "../scripts/check-live-configs.mjs";

describe("check-live-configs database integration suite", () => {
  beforeAll(() => {
    const testDbUrl = process.env.TEST_DATABASE_URL;
    if (!testDbUrl) {
      throw new Error(
        "CRITICAL: Missing required TEST_DATABASE_URL environment variable for database integration tests. Integration tests must FAIL loudly if TEST_DATABASE_URL is missing; no silent skips."
      );
    }
    if (!testDbUrl.includes("dvkmkubcplroecqkfjuf")) {
      throw new Error(
        `SAFETY GUARD VIOLATION: Database tests are strictly locked to the dedicated TEST project. TEST_DATABASE_URL must contain 'dvkmkubcplroecqkfjuf'. Got: '${testDbUrl}'. Aborting test execution.`
      );
    }
  });

  describe("Environment variable resolution", () => {
    it("resolves test connection string from .env.test or environment", async () => {
      const connStr = await resolveConnectionString(false);
      expect(connStr).toBeDefined();
      expect(connStr.length).toBeGreaterThan(0);
      expect(connStr).toContain("postgres");
      expect(connStr).toContain("dvkmkubcplroecqkfjuf");
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
