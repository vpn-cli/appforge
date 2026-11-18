import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env.local" });

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          globals: true,
          environment: "node",
          include: ["tests/**/*.{test,spec}.{ts,tsx,js,jsx}"],
          exclude: [
            "tests/**/*.db.test.*",
            "tests/cross-tenant-hardening.test.ts",
            "tests/db/**",
            "infrasity_ref/**",
            "node_modules/**",
          ],
        },
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "./"),
          },
        },
      },
      {
        test: {
          name: "database",
          globals: true,
          environment: "node",
          include: [
            "tests/**/*.db.test.{ts,tsx,js,jsx}",
            "tests/cross-tenant-hardening.test.ts",
            "tests/db/**/*.{test,spec}.{ts,tsx,js,jsx}",
          ],
          exclude: ["infrasity_ref/**", "node_modules/**"],
        },
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "./"),
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
});
